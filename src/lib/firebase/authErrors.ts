import { FirebaseError } from "firebase/app";
import { AUTH_ERROR_MESSAGES } from "@/lib/constants";
import { FirebaseNotConfiguredError } from "./client";

const MESSAGES_BY_CODE: Record<string, string | null> = {
  "auth/invalid-credential": AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
  "auth/invalid-login-credentials": AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
  "auth/wrong-password": AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
  "auth/user-not-found": AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
  "auth/email-already-in-use": AUTH_ERROR_MESSAGES.EMAIL_IN_USE,
  "auth/weak-password": AUTH_ERROR_MESSAGES.WEAK_PASSWORD,
  "auth/password-does-not-meet-requirements": AUTH_ERROR_MESSAGES.WEAK_PASSWORD,
  "auth/invalid-email": AUTH_ERROR_MESSAGES.INVALID_EMAIL,
  "auth/missing-email": AUTH_ERROR_MESSAGES.INVALID_EMAIL,
  "auth/missing-password": AUTH_ERROR_MESSAGES.MISSING_PASSWORD,
  "auth/too-many-requests": AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS,
  "auth/network-request-failed": AUTH_ERROR_MESSAGES.NETWORK,
  "auth/popup-blocked": AUTH_ERROR_MESSAGES.POPUP_BLOCKED,
  "auth/account-exists-with-different-credential":
    AUTH_ERROR_MESSAGES.ACCOUNT_EXISTS_DIFFERENT_METHOD,
  "auth/invalid-action-code": AUTH_ERROR_MESSAGES.LINK_INVALID,
  "auth/expired-action-code": AUTH_ERROR_MESSAGES.LINK_INVALID,
  "auth/operation-not-allowed": AUTH_ERROR_MESSAGES.METHOD_DISABLED,
  "auth/unauthorized-domain": AUTH_ERROR_MESSAGES.UNAUTHORIZED_DOMAIN,
  "auth/unauthorized-continue-uri": AUTH_ERROR_MESSAGES.UNAUTHORIZED_DOMAIN,
  "auth/user-disabled": AUTH_ERROR_MESSAGES.USER_DISABLED,
  "auth/requires-recent-login": AUTH_ERROR_MESSAGES.REQUIRES_RECENT_LOGIN,
  // The user closed the window themselves; nothing to report.
  "auth/popup-closed-by-user": null,
  "auth/cancelled-popup-request": null,
};

/**
 * Maps a Firebase Auth failure to user-facing copy.
 * Returns null when the user cancelled and no message should be shown.
 */
export function getAuthErrorMessage(error: unknown): string | null {
  if (error instanceof FirebaseNotConfiguredError) {
    return AUTH_ERROR_MESSAGES.NOT_CONFIGURED;
  }
  const code =
    error instanceof FirebaseError
      ? error.code
      : typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : null;
  if (code && code in MESSAGES_BY_CODE) return MESSAGES_BY_CODE[code];
  return AUTH_ERROR_MESSAGES.GENERIC;
}
