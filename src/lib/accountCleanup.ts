import {
  EMAIL_FOR_SIGN_IN_KEY,
  LIVE_SESSION_STORAGE_KEY,
  SIGNED_IN_HINT_KEY,
} from "@/lib/firebase/config";
import { useAppStore } from "@/zustand/useAppStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/** Clears everything this device stores about the signed-in account (not caption preferences) */
export function clearLocalAccountState(): void {
  useAppStore.getState().setShouldListen(false);
  useLiveSessionStore.getState().setActiveSessionId(null);
  window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  window.localStorage.removeItem(SIGNED_IN_HINT_KEY);
  window.sessionStorage.removeItem(LIVE_SESSION_STORAGE_KEY);
}
