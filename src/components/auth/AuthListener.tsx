"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { User } from "firebase/auth";
import { isFirebaseConfigured, routeNeedsFirebase, SIGNED_IN_HINT_KEY } from "@/lib/firebase/config";
import { reportOperationalEvent } from "@/lib/monitoring";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

function startAnalyticsWhenIdle(): () => void {
  const start = () =>
    void import("@/lib/firebase/analytics")
      .then(({ startAnalytics }) => startAnalytics())
      .catch((error: unknown) => reportOperationalEvent("analytics_unavailable", error));
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(start, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(start, 3000);
  return () => window.clearTimeout(id);
}

/**
 * Keeps the auth store in sync with Firebase. The Firebase SDK is only
 * loaded on account pages, for browsers that have signed in before, or when
 * another tab signs in, so signed-out caption users never download it.
 */
export function AuthListener() {
  const pathname = usePathname();
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const cancelAnalytics = startAnalyticsWhenIdle();
    return () => {
      cancelAnalytics();
      unsubscribeRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setFirebaseUser(null);
      return;
    }

    let previousUid: string | null | undefined;
    const handleUser = (user: User | null) => {
      const uid = user?.uid ?? null;
      // A different (or no) user must not keep streaming to the last user's session.
      if (previousUid !== uid && (previousUid !== undefined || !uid)) {
        useLiveSessionStore.getState().setActiveSessionId(null);
      }
      previousUid = uid;
      setFirebaseUser(user);
    };

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      import("@/lib/firebase/session")
        .then(({ watchAuth }) => {
          unsubscribeRef.current = watchAuth(handleUser);
        })
        .catch((error: unknown) => {
          reportOperationalEvent("auth_load_failed", error);
          setFirebaseUser(null);
        });
    };

    if (routeNeedsFirebase(pathname) || window.localStorage.getItem(SIGNED_IN_HINT_KEY)) {
      start();
    } else if (!startedRef.current) {
      setFirebaseUser(null);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === SIGNED_IN_HINT_KEY && event.newValue) start();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname, setFirebaseUser]);

  return null;
}
