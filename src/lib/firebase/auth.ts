import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  updateProfile,
  type ActionCodeSettings,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { useAuthStore } from "@/zustand/useAuthStore";

/** Remembers which address requested an email link so the link can finish sign-in on this device */
export const EMAIL_FOR_SIGN_IN_KEY = "aidme-app_email_for_sign_in";

function actionUrl(path: string): ActionCodeSettings {
  return { url: `${window.location.origin}${path}` };
}

/** Pushes the latest profile/verification state into the store */
async function refreshStoredUser(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  await user.reload();
  // Forces a new ID token so Firestore rules see an updated email_verified claim.
  await user.getIdToken(true);
  useAuthStore.getState().setFirebaseUser(getFirebaseAuth().currentUser);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(getFirebaseAuth(), provider);
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function createAccount(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password
  );
  const name = displayName.trim();
  if (name) await updateProfile(user, { displayName: name });
  await sendEmailVerification(user, actionUrl("/account?verified=1"));
  useAuthStore.getState().setFirebaseUser(getFirebaseAuth().currentUser);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), actionUrl("/sign-in"));
}

export async function sendEmailSignInLink(email: string, redirect: string): Promise<void> {
  const address = email.trim();
  await sendSignInLinkToEmail(getFirebaseAuth(), address, {
    url: `${window.location.origin}/auth/email-link?redirect=${encodeURIComponent(redirect)}`,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, address);
}

export function isEmailSignInLink(href: string): boolean {
  return isSignInWithEmailLink(getFirebaseAuth(), href);
}

export async function completeEmailLinkSignIn(email: string, href: string): Promise<void> {
  await signInWithEmailLink(getFirebaseAuth(), email.trim(), href);
  window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
}

export async function resendVerificationEmail(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  await sendEmailVerification(user, actionUrl("/account?verified=1"));
}

export async function refreshEmailVerification(): Promise<boolean> {
  await refreshStoredUser();
  return getFirebaseAuth().currentUser?.emailVerified ?? false;
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  await updateProfile(user, { displayName: displayName.trim() });
  await refreshStoredUser();
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}
