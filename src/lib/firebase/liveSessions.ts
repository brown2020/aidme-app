import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./db";
import { MAX_LINE_LENGTH } from "@/lib/constants";
import { reportOperationalEvent } from "@/lib/monitoring";
import {
  INTERIM_SLOTS,
  defaultSessionTitle,
  emailKey,
  emailKeys,
  interimSchema,
  invitesSchema,
  latestInterimText,
  liveSessionSchema,
  normalizeEmail,
  toLineText,
  transcriptLineSchema,
  type LiveSession,
  type TranscriptLine,
} from "@/lib/liveSessionModel";

const SESSIONS = "sessions";
const LINES = "lines";
const INTERIM = "interim";
const PRIVATE = "private";
const INVITES = "invites";
/** Lines a viewer loads; ~30 minutes of conversation fits comfortably */
const MAX_VIEWER_LINES = 1000;
const MAX_LISTED_SESSIONS = 50;
/** Firestore allows 500 writes per batch */
const DELETE_BATCH_SIZE = 450;

/** Converts Firestore Timestamps to Dates so documents can be schema-checked */
function plain(snap: DocumentSnapshot<DocumentData>): Record<string, unknown> | null {
  const data = snap.data({ serverTimestamps: "estimate" });
  if (!data) return null;
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
        ? (value.toDate() as Date)
        : value,
    ])
  );
}

function parseSession(snap: DocumentSnapshot<DocumentData>): LiveSession | null {
  const data = plain(snap);
  if (!data) return null;
  const parsed = liveSessionSchema.safeParse({ createdAt: null, updatedAt: null, ...data });
  if (!parsed.success) {
    reportOperationalEvent("session_doc_invalid", parsed.error);
    return null;
  }
  return { id: snap.id, ...parsed.data };
}

function parseLine(snap: DocumentSnapshot<DocumentData>): TranscriptLine | null {
  const parsed = transcriptLineSchema.safeParse({ createdAt: null, ...plain(snap) });
  return parsed.success ? { id: snap.id, ...parsed.data } : null;
}

const sessionRef = (sessionId: string) => doc(getDb(), SESSIONS, sessionId);
const invitesRef = (sessionId: string) => doc(getDb(), SESSIONS, sessionId, PRIVATE, INVITES);
const interimRef = (sessionId: string, seq: number) =>
  doc(getDb(), SESSIONS, sessionId, INTERIM, String(seq % INTERIM_SLOTS));

export interface SessionOwner {
  uid: string;
  email: string;
  displayName: string | null;
}

/** Creates the session (with invite fingerprints) and its owner-only invite list atomically */
export async function createLiveSession(
  owner: SessionOwner,
  language: string,
  viewerEmails: string[]
): Promise<string> {
  const db = getDb();
  const ref = doc(collection(db, SESSIONS));
  const batch = writeBatch(db);
  batch.set(ref, {
    ownerUid: owner.uid,
    ownerName: (owner.displayName || owner.email).slice(0, 100),
    ownerEmail: normalizeEmail(owner.email),
    title: defaultSessionTitle(new Date()),
    status: "live",
    language,
    viewerKeys: await emailKeys(viewerEmails),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(invitesRef(ref.id), { emails: viewerEmails, updatedAt: serverTimestamp() });
  await batch.commit();
  return ref.id;
}

export async function updateSessionViewers(sessionId: string, viewerEmails: string[]): Promise<void> {
  const batch = writeBatch(getDb());
  batch.update(sessionRef(sessionId), {
    viewerKeys: await emailKeys(viewerEmails),
    updatedAt: serverTimestamp(),
  });
  batch.set(invitesRef(sessionId), { emails: viewerEmails, updatedAt: serverTimestamp() });
  await batch.commit();
}

/** Removes the signed-in viewer's own fingerprint, ending their access to the session */
export async function leaveSession(sessionId: string, email: string): Promise<void> {
  await updateDoc(sessionRef(sessionId), {
    viewerKeys: arrayRemove(await emailKey(email)),
    updatedAt: serverTimestamp(),
  });
}

export async function setSessionStatus(
  sessionId: string,
  status: LiveSession["status"]
): Promise<void> {
  await updateDoc(sessionRef(sessionId), { status, updatedAt: serverTimestamp() });
}

/**
 * Appends one finalized sentence and clears the in-progress text in the same
 * atomic write, so viewers never see the sentence twice.
 */
export async function appendTranscriptLine(
  sessionId: string,
  text: string,
  seq: number
): Promise<void> {
  const lineText = toLineText(text);
  if (!lineText) return;
  const db = getDb();
  const batch = writeBatch(db);
  batch.set(doc(collection(db, SESSIONS, sessionId, LINES)), {
    text: lineText,
    createdAt: serverTimestamp(),
  });
  batch.set(interimRef(sessionId, seq), { text: "", seq, updatedAt: serverTimestamp() });
  await batch.commit();
}

/** Replaces the words currently being spoken; seq must increase with every write */
export async function setInterimText(sessionId: string, text: string, seq: number): Promise<void> {
  await setDoc(interimRef(sessionId, seq), {
    text: text.slice(0, MAX_LINE_LENGTH),
    seq,
    updatedAt: serverTimestamp(),
  });
}

async function deleteSubcollection(sessionId: string, name: string): Promise<void> {
  const db = getDb();
  const ref = collection(db, SESSIONS, sessionId, name);
  for (;;) {
    const page = await getDocs(query(ref, limit(DELETE_BATCH_SIZE)));
    if (page.empty) return;
    const batch = writeBatch(db);
    page.docs.forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

/** Deletes a session with all of its lines, in-progress text, and invites (owner only) */
export async function deleteLiveSession(sessionId: string): Promise<void> {
  await Promise.all([
    deleteSubcollection(sessionId, LINES),
    deleteSubcollection(sessionId, INTERIM),
    deleteDoc(invitesRef(sessionId)),
  ]);
  await deleteDoc(sessionRef(sessionId));
}

export function subscribeToSession(
  sessionId: string,
  onChange: (session: LiveSession | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(sessionRef(sessionId), (snap) => onChange(parseSession(snap)), onError);
}

/** Owner-only: the plain emails behind the session's invite fingerprints */
export function subscribeToInvites(
  sessionId: string,
  onChange: (emails: string[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    invitesRef(sessionId),
    (snap) => {
      const parsed = invitesSchema.safeParse(snap.data() ?? { emails: [] });
      onChange(parsed.success ? parsed.data.emails : []);
    },
    onError
  );
}

export function subscribeToLines(
  sessionId: string,
  onChange: (lines: TranscriptLine[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(getDb(), SESSIONS, sessionId, LINES),
      orderBy("createdAt"),
      limitToLast(MAX_VIEWER_LINES)
    ),
    (snap) =>
      onChange(snap.docs.map(parseLine).filter((line): line is TranscriptLine => line !== null)),
    onError
  );
}

export function subscribeToInterim(
  sessionId: string,
  onChange: (text: string) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), SESSIONS, sessionId, INTERIM),
    (snap) => {
      const docs = snap.docs.flatMap((item) => {
        const parsed = interimSchema.safeParse(item.data());
        return parsed.success ? [parsed.data] : [];
      });
      onChange(latestInterimText(docs));
    },
    onError
  );
}

function subscribeToSessionQuery(
  filter: ReturnType<typeof where>,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(getDb(), SESSIONS),
      filter,
      orderBy("createdAt", "desc"),
      limit(MAX_LISTED_SESSIONS)
    ),
    (snap) =>
      onChange(snap.docs.map(parseSession).filter((s): s is LiveSession => s !== null)),
    onError
  );
}

export function subscribeToOwnedSessions(
  uid: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return subscribeToSessionQuery(where("ownerUid", "==", uid), onChange, onError);
}

export async function subscribeToSharedSessions(
  email: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Promise<Unsubscribe> {
  const key = await emailKey(email);
  return subscribeToSessionQuery(where("viewerKeys", "array-contains", key), onChange, onError);
}
