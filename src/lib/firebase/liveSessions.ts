import {
  addDoc,
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
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./client";
import {
  defaultSessionTitle,
  normalizeEmail,
  toLineText,
  type LiveSession,
  type TranscriptLine,
} from "@/lib/liveSessionModel";

const SESSIONS = "sessions";
const LINES = "lines";
/** Lines a viewer loads; ~30 minutes of conversation fits comfortably */
const MAX_VIEWER_LINES = 1000;
const MAX_LISTED_SESSIONS = 50;
/** Firestore allows 500 writes per batch */
const DELETE_BATCH_SIZE = 450;

function toDate(value: unknown): Date | null {
  return value && typeof (value as Timestamp).toDate === "function"
    ? (value as Timestamp).toDate()
    : null;
}

function toLiveSession(snap: DocumentSnapshot<DocumentData>): LiveSession | null {
  const data = snap.data({ serverTimestamps: "estimate" });
  if (!data) return null;
  return {
    id: snap.id,
    ownerUid: String(data.ownerUid ?? ""),
    ownerName: String(data.ownerName ?? ""),
    ownerEmail: String(data.ownerEmail ?? ""),
    title: String(data.title ?? ""),
    status: data.status === "live" ? "live" : "ended",
    language: String(data.language ?? ""),
    viewerEmails: Array.isArray(data.viewerEmails)
      ? data.viewerEmails.filter((e: unknown): e is string => typeof e === "string")
      : [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function toLine(snap: QueryDocumentSnapshot<DocumentData>): TranscriptLine {
  const data = snap.data({ serverTimestamps: "estimate" });
  return {
    id: snap.id,
    text: typeof data.text === "string" ? data.text : "",
    createdAt: toDate(data.createdAt),
  };
}

export interface SessionOwner {
  uid: string;
  email: string;
  displayName: string | null;
}

export async function createLiveSession(
  owner: SessionOwner,
  language: string,
  viewerEmails: string[]
): Promise<string> {
  const ref = await addDoc(collection(getDb(), SESSIONS), {
    ownerUid: owner.uid,
    ownerName: (owner.displayName || owner.email).slice(0, 100),
    ownerEmail: normalizeEmail(owner.email),
    title: defaultSessionTitle(new Date()),
    status: "live",
    language,
    viewerEmails,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSessionViewers(sessionId: string, viewerEmails: string[]): Promise<void> {
  await updateDoc(doc(getDb(), SESSIONS, sessionId), {
    viewerEmails,
    updatedAt: serverTimestamp(),
  });
}

export async function setSessionStatus(
  sessionId: string,
  status: LiveSession["status"]
): Promise<void> {
  await updateDoc(doc(getDb(), SESSIONS, sessionId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** Appends one finalized sentence; resolves once the server accepts it */
export async function appendTranscriptLine(sessionId: string, text: string): Promise<void> {
  const lineText = toLineText(text);
  if (!lineText) return;
  await addDoc(collection(getDb(), SESSIONS, sessionId, LINES), {
    text: lineText,
    createdAt: serverTimestamp(),
  });
}

/** Deletes a session and all of its lines (owner only, per rules) */
export async function deleteLiveSession(sessionId: string): Promise<void> {
  const db = getDb();
  const linesRef = collection(db, SESSIONS, sessionId, LINES);
  for (;;) {
    const page = await getDocs(query(linesRef, limit(DELETE_BATCH_SIZE)));
    if (page.empty) break;
    const batch = writeBatch(db);
    page.docs.forEach((line) => batch.delete(line.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, SESSIONS, sessionId));
}

export function subscribeToSession(
  sessionId: string,
  onChange: (session: LiveSession | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), SESSIONS, sessionId),
    (snap) => onChange(snap.exists() ? toLiveSession(snap) : null),
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
    (snap) => onChange(snap.docs.map(toLine)),
    onError
  );
}

function subscribeToSessionList(
  field: "ownerUid" | "viewerEmails",
  value: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(getDb(), SESSIONS),
      field === "ownerUid" ? where(field, "==", value) : where(field, "array-contains", value),
      orderBy("createdAt", "desc"),
      limit(MAX_LISTED_SESSIONS)
    ),
    (snap) =>
      onChange(
        snap.docs.map(toLiveSession).filter((s): s is LiveSession => s !== null)
      ),
    onError
  );
}

export function subscribeToOwnedSessions(
  uid: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return subscribeToSessionList("ownerUid", uid, onChange, onError);
}

export function subscribeToSharedSessions(
  email: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return subscribeToSessionList("viewerEmails", normalizeEmail(email), onChange, onError);
}
