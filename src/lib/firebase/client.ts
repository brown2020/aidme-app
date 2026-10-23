import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Each NEXT_PUBLIC_ variable must be referenced literally so Next.js can inline it.
const firebaseConfig = {
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
 * Lazily initializes Firebase on first use, so builds and pages that never
 * touch accounts work without Firebase env vars.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) throw new FirebaseNotConfiguredError();
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

/** Starts Google Analytics in browsers that support it, when a measurement ID is set */
export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) return;
  if (!isFirebaseConfigured()) return;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported()) getAnalytics(getFirebaseApp());
}
