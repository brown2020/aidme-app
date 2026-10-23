import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { firebaseConfig, isFirebaseConfigured } from "./config";

let analytics: Analytics | null = null;

/** Starts Google Analytics without loading Auth or Firestore */
export async function startAnalytics(): Promise<void> {
  if (analytics || !firebaseConfig.measurementId || !isFirebaseConfigured()) return;
  if (!(await isSupported())) return;
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
}

/** Records an operational event (e.g. a failed live-sharing write) when analytics is running */
export function trackEvent(name: string, params?: Record<string, string | number>): void {
  if (analytics) logEvent(analytics, name, params);
}
