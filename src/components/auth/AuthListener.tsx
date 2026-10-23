"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth, initAnalytics, isFirebaseConfigured } from "@/lib/firebase/client";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/**
 * Keeps the auth store in sync with Firebase (including sign-in/out in other
 * tabs) and stops streaming when the signed-in user changes.
 */
export function AuthListener() {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setFirebaseUser(null);
      return;
    }

    initAnalytics().catch((error: unknown) => logger.warn("Analytics unavailable", error));

    let previousUid: string | null | undefined;
    return onIdTokenChanged(getFirebaseAuth(), (user) => {
      const uid = user?.uid ?? null;
      if (previousUid !== undefined && previousUid !== uid) {
        useLiveSessionStore.getState().setActiveSessionId(null);
      }
      if (previousUid === undefined && !uid) {
        // A tab-scoped session left over from a signed-out state can't be written to.
        useLiveSessionStore.getState().setActiveSessionId(null);
      }
      previousUid = uid;
      setFirebaseUser(user);
    });
  }, [setFirebaseUser]);

  return null;
}
