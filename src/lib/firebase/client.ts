import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  FirebaseNotConfiguredError,
  emulatorHost,
  firebaseConfig,
  isFirebaseConfigured,
} from "./config";

let protectionsStarted = false;
let authEmulatorConnected = false;

/** App Check proves requests come from this app; emulators don't need it */
function startProtections(app: FirebaseApp): void {
  if (protectionsStarted) return;
  protectionsStarted = true;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (!siteKey || emulatorHost()) return;
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

/** Lazily initializes Firebase on first use */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) throw new FirebaseNotConfiguredError();
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  startProtections(app);
  return app;
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  const host = emulatorHost();
  if (host && !authEmulatorConnected) {
    authEmulatorConnected = true;
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  }
  return auth;
}
