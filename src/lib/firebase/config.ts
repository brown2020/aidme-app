// No Firebase SDK imports here: this module is safe for every page's initial bundle.

// Each NEXT_PUBLIC_ variable must be referenced literally so Next.js can inline it.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase environment variables are not set");
    this.name = "FirebaseNotConfiguredError";
  }
}

/** True when the required public Firebase config is present in this build */
export function isFirebaseConfigured(): boolean {
  const { apiKey, authDomain, projectId, appId } = firebaseConfig;
  return Boolean(apiKey && authDomain && projectId && appId);
}

/**
 * Host of the local Firebase emulators (Auth :9099, Firestore :8086) for
 * end-to-end tests; never set in deployed builds.
 */
export function emulatorHost(): string | null {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || null;
}

/**
 * Set while this browser has a signed-in Firebase user, so pages that don't
 * need accounts can skip loading the SDK for signed-out visitors.
 */
export const SIGNED_IN_HINT_KEY = "aidme-app_signed_in";

/** Remembers which address requested an email link so the link can finish sign-in on this device */
export const EMAIL_FOR_SIGN_IN_KEY = "aidme-app_email_for_sign_in";

/** Tab-scoped storage key for the session this tab streams to */
export const LIVE_SESSION_STORAGE_KEY = "aidme-app_live_session_v1";

/** Routes that always need Firebase, signed in or not */
export function routeNeedsFirebase(pathname: string): boolean {
  return ["/sign-in", "/account", "/auth/", "/s/"].some((prefix) => pathname.startsWith(prefix));
}
