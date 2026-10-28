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
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { authorizedAuthDomains } from "./authorizedDomains";
import { EMAIL_FOR_SIGN_IN_KEY } from "./config";
import { sendWithOptionalContinueUrl } from "./verificationEmail";
import { useAuthStore } from "@/zustand/useAuthStore";

function actionUrl(path: string): ActionCodeSettings {
  return { url: `${window.location.origin}${path}` };
}

/**
 * Sends the verification email. Preview hosts are not Firebase authorized
 * domains, so a continue URL pointing at them is rejected and burns the
 * send quota. Fall back to a message with no continue URL.
 */
async function sendAccountVerification(user: User): Promise<void> {
  const domains = await authorizedAuthDomains();
  await sendWithOptionalContinueUrl({
    hostname: window.location.hostname,
    domains,
    sendWithUrl: () => sendEmailVerification(user, actionUrl("/account?verified=1")),
    sendWithoutUrl: () => sendEmailVerification(user),
  });
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
  await sendAccountVerification(user);
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
  await sendAccountVerification(user);
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
