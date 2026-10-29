import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
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
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./db";
import { MAX_LINE_LENGTH } from "@/lib/constants";
import { reportOperationalEvent } from "@/lib/monitoring";
import {
  EMAIL_KEY_PATTERN,
  INTERIM_SLOTS,
  defaultSessionTitle,
  emailKey,
  emailKeys,
  interimSchema,
  invitesSchema,
  latestInterimText,
  liveSessionSchema,
  normalizeEmail,
  pairLegacyInvites,
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
const MEMBERS = "members";
const INBOXES = "inboxes";
const ACCOUNTS = "accounts";
/** Lines a viewer loads; ~30 minutes of conversation fits comfortably */
const MAX_VIEWER_LINES = 1000;
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

export interface WatchedSession {
  /** Parsed session, or null when the document is missing or fails validation */
  session: LiveSession | null;
  /** False only when the document does not exist */
  exists: boolean;
  /** Legacy invite hashes still stored on the session document */
  legacyKeys: string[];
}

function legacyKeysOf(data: Record<string, unknown>): string[] {
  if (!Array.isArray(data.viewerKeys)) return [];
  return data.viewerKeys.filter((key): key is string => typeof key === "string" && EMAIL_KEY_PATTERN.test(key));
}

function readSessionSnap(snap: DocumentSnapshot<DocumentData>): WatchedSession {
  const data = plain(snap);
  if (!data) return { session: null, exists: snap.exists(), legacyKeys: [] };
  const legacyKeys = legacyKeysOf(data);
  const rest = { ...data };
  delete rest.viewerKeys;
  const parsed = liveSessionSchema.safeParse({ createdAt: null, updatedAt: null, ...rest });
  if (!parsed.success) {
    reportOperationalEvent("session_doc_invalid", parsed.error);
    return { session: null, exists: true, legacyKeys };
  }
  return { session: { id: snap.id, ...parsed.data }, exists: true, legacyKeys };
}

function parseLine(snap: DocumentSnapshot<DocumentData>): TranscriptLine | null {
  const parsed = transcriptLineSchema.safeParse({ createdAt: null, ...plain(snap) });
  return parsed.success ? { id: snap.id, ...parsed.data } : null;
}

const sessionRef = (sessionId: string) => doc(getDb(), SESSIONS, sessionId);
const invitesRef = (sessionId: string) => doc(getDb(), SESSIONS, sessionId, PRIVATE, INVITES);
const memberRef = (sessionId: string, emailKeyId: string) =>
  doc(getDb(), SESSIONS, sessionId, MEMBERS, emailKeyId);
const inboxRef = (emailKeyId: string, sessionId: string) =>
  doc(getDb(), INBOXES, emailKeyId, SESSIONS, sessionId);
const accountSessionRef = (uid: string, sessionId: string) =>
  doc(getDb(), ACCOUNTS, uid, SESSIONS, sessionId);
const interimRef = (sessionId: string, seq: number) =>
  doc(getDb(), SESSIONS, sessionId, INTERIM, String(seq % INTERIM_SLOTS));

const migrating = new Set<string>();

/**
 * Moves invite hashes off a legacy session document into private membership
 * rows. Safe to call more than once; a failed attempt can be retried.
 */
export async function migrateLegacySession(sessionId: string, legacyKeys: string[]): Promise<void> {
  if (legacyKeys.length === 0 || migrating.has(sessionId)) return;
  migrating.add(sessionId);
  try {
    const db = getDb();
    const invitesSnap = await getDoc(invitesRef(sessionId));
    const storedEmails = invitesSchema.safeParse(invitesSnap.data() ?? { emails: [] });
    const emails = storedEmails.success ? storedEmails.data.emails : [];
    const paired = pairLegacyInvites(emails, await emailKeys(emails), legacyKeys);
    const batch = writeBatch(db);
    if (paired.emailKeys.length > 0) {
      batch.set(invitesRef(sessionId), {
        emails: paired.emails,
        emailKeys: paired.emailKeys,
        updatedAt: serverTimestamp(),
      });
      for (const key of paired.emailKeys) {
        const existing = await getDoc(memberRef(sessionId, key));
        if (!existing.exists()) {
          batch.set(memberRef(sessionId, key), { emailKey: key, uid: "" });
          batch.set(inboxRef(key, sessionId), { createdAt: serverTimestamp() });
        }
      }
    }
    batch.update(sessionRef(sessionId), {
      viewerKeys: deleteField(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    migrating.delete(sessionId);
    reportOperationalEvent("legacy_session_migration_failed", error);
  }
}

export interface SessionOwner {
  uid: string;
  email: string;
  displayName: string | null;
}

/** Creates the session and its owner-only invite list. Hashes are not on the session. */
export async function createLiveSession(
  owner: SessionOwner,
  language: string,
  viewerEmails: string[]
): Promise<string> {
  const db = getDb();
  const ref = doc(collection(db, SESSIONS));
  const keys = await emailKeys(viewerEmails);
  const batch = writeBatch(db);
  batch.set(ref, {
    ownerUid: owner.uid,
    ownerName: (owner.displayName || owner.email).slice(0, 100),
    ownerEmail: normalizeEmail(owner.email),
    title: defaultSessionTitle(new Date()),
    status: "live",
    language,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(invitesRef(ref.id), {
    emails: viewerEmails,
    emailKeys: keys,
    updatedAt: serverTimestamp(),
  });
  for (const key of keys) {
    batch.set(memberRef(ref.id, key), { emailKey: key, uid: "" });
    batch.set(inboxRef(key, ref.id), { createdAt: serverTimestamp() });
  }
  await batch.commit();
  return ref.id;
}

export async function updateSessionViewers(sessionId: string, viewerEmails: string[]): Promise<void> {
  const db = getDb();
  const keys = await emailKeys(viewerEmails);
  const existing = await getDocs(collection(db, SESSIONS, sessionId, MEMBERS));
  const pending = new Set(keys);
  const batch = writeBatch(db);
  batch.set(invitesRef(sessionId), {
    emails: viewerEmails,
    emailKeys: keys,
    updatedAt: serverTimestamp(),
  });
  batch.update(sessionRef(sessionId), { updatedAt: serverTimestamp() });
  for (const member of existing.docs) {
    if (pending.delete(member.id)) continue;
    const uid = member.data().uid;
    batch.delete(member.ref);
    batch.delete(inboxRef(member.id, sessionId));
    if (typeof uid === "string" && uid) batch.delete(accountSessionRef(uid, sessionId));
  }
  for (const key of pending) {
    batch.set(memberRef(sessionId, key), { emailKey: key, uid: "" });
    batch.set(inboxRef(key, sessionId), { createdAt: serverTimestamp() });
  }
  await batch.commit();
}

/**
 * Binds an unclaimed invite to this Firebase account and removes the email-hash
 * inbox entry so a later owner of the mailbox does not inherit the session.
 */
export async function claimSessionAccess(sessionId: string, uid: string, email: string): Promise<void> {
  const key = await emailKey(email);
  const db = getDb();
  const memberSnap = await getDoc(memberRef(sessionId, key));
  if (!memberSnap.exists()) return;
  const currentUid = memberSnap.data().uid;
  if (currentUid === uid) {
    const [accountSnap, inboxSnap] = await Promise.all([
      getDoc(accountSessionRef(uid, sessionId)),
      getDoc(inboxRef(key, sessionId)),
    ]);
    if (accountSnap.exists() && !inboxSnap.exists()) return;
    const batch = writeBatch(db);
    if (!accountSnap.exists()) {
      batch.set(accountSessionRef(uid, sessionId), { emailKey: key, createdAt: serverTimestamp() });
    }
    if (inboxSnap.exists()) batch.delete(inboxSnap.ref);
    await batch.commit();
    return;
  }
  if (currentUid !== "") return;
  const batch = writeBatch(db);
  batch.update(memberRef(sessionId, key), { uid });
  batch.set(accountSessionRef(uid, sessionId), { emailKey: key, createdAt: serverTimestamp() });
  batch.delete(inboxRef(key, sessionId));
  await batch.commit();
}

/** Removes this account's membership, inbox entry, and uid binding. */
export async function leaveSession(sessionId: string, email: string, uid: string): Promise<void> {
  const db = getDb();
  const key = await emailKey(email);
  const accountSnap = await getDoc(accountSessionRef(uid, sessionId));
  const boundKey =
    accountSnap.exists() && typeof accountSnap.data().emailKey === "string"
      ? accountSnap.data().emailKey
      : null;
  const memberIds = [...new Set([key, boundKey].filter((id): id is string => !!id))];
  const [members, inboxes] = await Promise.all([
    Promise.all(memberIds.map((id) => getDoc(memberRef(sessionId, id)))),
    Promise.all(memberIds.map((id) => getDoc(inboxRef(id, sessionId)))),
  ]);
  const batch = writeBatch(db);
  let writes = 0;
  const dropped = new Set<string>();
  members.forEach((snap, index) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const mine = data.uid === uid || (data.uid === "" && snap.id === key);
    if (!mine) return;
    batch.delete(snap.ref);
    dropped.add(memberIds[index]);
    writes += 1;
  });
  inboxes.forEach((snap, index) => {
    if (!snap.exists() || !dropped.has(memberIds[index])) return;
    batch.delete(snap.ref);
    writes += 1;
  });
  if (accountSnap.exists()) {
    batch.delete(accountSnap.ref);
    writes += 1;
  }
  if (writes === 0) return;
  await batch.commit();
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

async function deleteMembershipPointers(sessionId: string): Promise<void> {
  const db = getDb();
  const members = await getDocs(collection(db, SESSIONS, sessionId, MEMBERS));
  let batch = writeBatch(db);
  let count = 0;
  const commit = async () => {
    if (count === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    count = 0;
  };
  for (const member of members.docs) {
    const uid = member.data().uid;
    batch.delete(member.ref);
    batch.delete(inboxRef(member.id, sessionId));
    count += 2;
    if (typeof uid === "string" && uid) {
      batch.delete(accountSessionRef(uid, sessionId));
      count += 1;
    }
    if (count >= DELETE_BATCH_SIZE) await commit();
  }
  await commit();
}

/** Deletes a session with its lines, invites, and every viewer's pointer (owner only) */
export async function deleteLiveSession(sessionId: string): Promise<void> {
  await deleteMembershipPointers(sessionId);
  await Promise.all([
    deleteSubcollection(sessionId, LINES),
    deleteSubcollection(sessionId, INTERIM),
    deleteDoc(invitesRef(sessionId)),
  ]);
  await deleteDoc(sessionRef(sessionId));
}

export function subscribeToSession(
  sessionId: string,
  onChange: (watched: WatchedSession) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(sessionRef(sessionId), (snap) => onChange(readSessionSnap(snap)), onError);
}

export interface InviteRecord {
  emails: string[];
  emailKeys: string[];
}

/** Owner-only: the plain emails behind the session's membership rows */
export function subscribeToInvites(
  sessionId: string,
  onChange: (record: InviteRecord) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    invitesRef(sessionId),
    (snap) => {
      const parsed = invitesSchema.safeParse(snap.data() ?? { emails: [] });
      onChange(
        parsed.success
          ? { emails: parsed.data.emails, emailKeys: parsed.data.emailKeys ?? [] }
          : { emails: [], emailKeys: [] }
      );
    },
    onError
  );
}

export function subscribeToMemberCount(
  sessionId: string,
  onChange: (count: number) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), SESSIONS, sessionId, MEMBERS),
    (snap) => onChange(snap.size),
    onError
  );
}

/** Owner-only ids of membership rows (email hashes). Not for viewer screens. */
export function subscribeToMemberIds(
  sessionId: string,
  onChange: (ids: string[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), SESSIONS, sessionId, MEMBERS),
    (snap) => onChange(snap.docs.map((item) => item.id)),
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

function byNewest(a: LiveSession, b: LiveSession): number {
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
}

export function subscribeToOwnedSessions(
  uid: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(getDb(), SESSIONS), where("ownerUid", "==", uid), orderBy("createdAt", "desc")),
    (snap) => {
      const sessions: LiveSession[] = [];
      for (const item of snap.docs) {
        const watched = readSessionSnap(item);
        if (watched.legacyKeys.length) void migrateLegacySession(item.id, watched.legacyKeys);
        if (watched.session) sessions.push(watched.session);
      }
      onChange(sessions);
    },
    onError
  );
}

/**
 * Every session shared with this account: unclaimed email inbox plus sessions
 * already bound to the uid. No cap, so older sessions stay deletable.
 */
export async function subscribeToSharedSessions(
  uid: string,
  email: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: FirestoreError) => void
): Promise<Unsubscribe> {
  const key = await emailKey(email);
  const db = getDb();
  const sessions = new Map<string, LiveSession>();
  const stops = new Map<string, Unsubscribe>();
  let inboxIds = new Set<string>();
  let accountIds = new Set<string>();
  const claimed = new Set<string>();

  const emit = () => onChange([...sessions.values()].sort(byNewest));

  const sync = (ids: Set<string>) => {
    for (const id of ids) {
      if (stops.has(id)) continue;
      stops.set(
        id,
        subscribeToSession(
          id,
          (watched) => {
            if (watched.session) sessions.set(id, watched.session);
            else sessions.delete(id);
            emit();
          },
          (error) => {
            if (error.code === "permission-denied") {
              sessions.delete(id);
              emit();
              return;
            }
            onError(error);
          }
        )
      );
    }
    for (const [id, stop] of stops) {
      if (ids.has(id)) continue;
      stop();
      stops.delete(id);
      sessions.delete(id);
    }
    emit();
  };

  const recompute = () => sync(new Set([...inboxIds, ...accountIds]));

  const watchIds = (
    path: QueryDocumentSnapshot[],
    assign: (ids: Set<string>) => void,
    claim: boolean
  ) => {
    const ids = new Set(path.map((item) => item.id));
    assign(ids);
    if (claim) {
      for (const id of ids) {
        if (claimed.has(id)) continue;
        claimed.add(id);
        void claimSessionAccess(id, uid, email).catch((error: unknown) => {
          claimed.delete(id);
          reportOperationalEvent("claim_session_failed", error);
        });
      }
    }
    recompute();
  };

  const unsubInbox = onSnapshot(
    query(collection(db, INBOXES, key, SESSIONS), orderBy("createdAt", "desc")),
    (snap) => watchIds(snap.docs, (ids) => (inboxIds = ids), true),
    onError
  );
  const unsubAccount = onSnapshot(
    query(collection(db, ACCOUNTS, uid, SESSIONS), orderBy("createdAt", "desc")),
    (snap) => watchIds(snap.docs, (ids) => (accountIds = ids), false),
    onError
  );

  return () => {
    unsubInbox();
    unsubAccount();
    stops.forEach((stop) => stop());
  };
}
