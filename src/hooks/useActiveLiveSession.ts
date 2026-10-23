"use client";

import { useEffect, useState } from "react";
import type { LiveSession } from "@/lib/liveSessionModel";
import { reportOperationalEvent } from "@/lib/monitoring";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/**
 * Subscribes to the session this tab streams to, and stops streaming if it
 * was ended or deleted elsewhere (e.g. from the account page on another
 * device). Firestore is loaded only once there is a session to watch.
 */
export function useActiveLiveSession(): LiveSession | null {
  const activeSessionId = useLiveSessionStore((s) => s.activeSessionId);
  const setActiveSessionId = useLiveSessionStore((s) => s.setActiveSessionId);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const [session, setSession] = useState<LiveSession | null>(null);

  useEffect(() => {
    if (!activeSessionId || !uid) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    const stop = () => {
      setActiveSessionId(null);
      setSession(null);
    };
    import("@/lib/firebase/liveSessions")
      .then(({ subscribeToSession }) => {
        if (cancelled) return;
        unsubscribe = subscribeToSession(
          activeSessionId,
          (next) => {
            if (!next || next.status !== "live" || next.ownerUid !== uid) stop();
            else setSession(next);
          },
          (error) => {
            reportOperationalEvent("active_session_unavailable", error);
            stop();
          }
        );
      })
      .catch((error: unknown) => reportOperationalEvent("firestore_load_failed", error));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [activeSessionId, uid, setActiveSessionId]);

  return activeSessionId && uid ? session : null;
}
