import {
  createAccount,
  sendEmailSignInLink,
  sendPasswordReset,
  signInWithPassword,
} from "@/lib/firebase/auth";
import { AUTH_ERROR_MESSAGES, MIN_PASSWORD_LENGTH } from "@/lib/constants";

export type AuthMode = "signIn" | "signUp" | "reset" | "emailLink";

export interface AuthFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const AUTH_TITLES: Record<AuthMode, string> = {
  signIn: "Sign in",
  signUp: "Create your account",
  reset: "Reset your password",
  emailLink: "Sign in with an email link",
};

export const AUTH_DESCRIPTIONS: Record<AuthMode, string> = {
  signIn: "Sign in to share live captions or view captions shared with you.",
  signUp: "An account lets you share live captions with people you invite.",
  reset: "Enter your email and we'll send you a link to choose a new password.",
  emailLink: "We'll email you a one-time link. No password needed.",
};

export const AUTH_SUBMIT_LABELS: Record<AuthMode, string> = {
  signIn: "Sign in",
  signUp: "Create account",
  reset: "Send reset link",
  emailLink: "Email me a sign-in link",
};

/** Client-side checks before calling Firebase; returns an error message or null */
export function validateAuthFields(mode: AuthMode, fields: AuthFields): string | null {
  if (mode !== "signUp") return null;
  if (fields.password.length < MIN_PASSWORD_LENGTH) return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
  if (fields.password !== fields.confirmPassword) return AUTH_ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
  return null;
}

/**
 * Runs the Firebase call for a mode. Resolves to "signedIn" or "emailSent"
 * so the form knows whether to navigate or show a check-your-inbox notice.
 */
export async function submitAuthForm(
  mode: AuthMode,
  fields: AuthFields,
  redirect: string
): Promise<"signedIn" | "emailSent"> {
  switch (mode) {
    case "signUp":
      await createAccount(fields.email, fields.password, fields.name);
      return "signedIn";
    case "signIn":
      await signInWithPassword(fields.email, fields.password);
      return "signedIn";
    case "reset":
      await sendPasswordReset(fields.email);
      return "emailSent";
    case "emailLink":
      await sendEmailSignInLink(fields.email, redirect);
      return "emailSent";
  }
}
