import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { getFirebaseAuth } from "./client";
import { getDb } from "./db";
import { deleteLiveSession, leaveSession } from "./liveSessions";
import { emailKey } from "@/lib/liveSessionModel";

/** Firebase rejects account deletion when the last sign-in is older than this */
const RECENT_SIGN_IN_MS = 5 * 60 * 1000;
const PAGE_SIZE = 50;

/** True when Firebase will require re-authentication before deleting the user */
export function needsRecentSignIn(now = Date.now()): boolean {
  const lastSignIn = getFirebaseAuth().currentUser?.metadata.lastSignInTime;
  if (!lastSignIn) return true;
  return now - new Date(lastSignIn).getTime() > RECENT_SIGN_IN_MS;
}

export async function reauthenticateWithPassword(password: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) return;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

export async function reauthenticateWithGoogle(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  await reauthenticateWithPopup(user, new GoogleAuthProvider());
}

async function deleteOwnedSessions(uid: string): Promise<void> {
  const sessions = collection(getDb(), "sessions");
  for (;;) {
    const page = await getDocs(query(sessions, where("ownerUid", "==", uid), limit(PAGE_SIZE)));
    if (page.empty) return;
    await Promise.all(page.docs.map((session) => deleteLiveSession(session.id)));
  }
}

/** Removes this account from sessions other people shared with them, one page at a time */
async function leaveSharedSessions(uid: string, email: string): Promise<void> {
  const db = getDb();
  const key = await emailKey(email);
  const sources = [
    collection(db, "accounts", uid, "sessions"),
    collection(db, "inboxes", key, "sessions"),
  ];
  for (const source of sources) {
    for (;;) {
      const page = await getDocs(query(source, limit(PAGE_SIZE)));
      if (page.empty) break;
      await Promise.all(page.docs.map((session) => leaveSession(session.id, email, uid)));
    }
  }
}

export class AccountRemovalIncompleteError extends Error {
  constructor(cause: unknown) {
    super("Account data was deleted but the auth user was not", { cause });
    this.name = "AccountRemovalIncompleteError";
  }
}

/**
 * Permanently deletes every session the user owns (with all lines), removes
 * their email from sessions shared with them, then deletes the auth user.
 * Call only after a recent sign-in (see needsRecentSignIn).
 */
export async function deleteAccountAndData(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  await deleteOwnedSessions(user.uid);
  if (user.email && user.emailVerified) await leaveSharedSessions(user.uid, user.email);
  try {
    await deleteUser(user);
  } catch (error) {
    throw new AccountRemovalIncompleteError(error);
  }
}
