"use client";

import { useEffect, useState } from "react";
import type { LiveSession } from "@/lib/liveSessionModel";
import { activeSessionStopReason } from "@/lib/activeSessionStop";
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
    let retryTimer: number | null = null;
    let cancelled = false;
    let attempt = 0;
    const stop = () => {
      setActiveSessionId(null);
      setSession(null);
    };
    const listen = () => {
      import("@/lib/firebase/liveSessions")
        .then(({ subscribeToSession, migrateLegacySession }) => {
          if (cancelled) return;
          unsubscribe?.();
          unsubscribe = subscribeToSession(
            activeSessionId,
            (watched) => {
              attempt = 0;
              if (watched.legacyKeys.length && watched.session?.ownerUid === uid) {
                void migrateLegacySession(activeSessionId, watched.legacyKeys);
              }
              const reason = activeSessionStopReason({
                exists: watched.exists,
                session: watched.session,
                uid,
              });
              if (reason === "stop") stop();
              else if (watched.session) setSession(watched.session);
            },
            (error) => {
              const reason = activeSessionStopReason({
                exists: true,
                session: null,
                uid,
                errorCode: error.code,
              });
              reportOperationalEvent("active_session_unavailable", error);
              if (reason === "stop") {
                stop();
                return;
              }
              const delay = Math.min(30_000, 1000 * 2 ** attempt);
              attempt += 1;
              retryTimer = window.setTimeout(() => {
                retryTimer = null;
                if (!cancelled) listen();
              }, delay);
            }
          );
        })
        .catch((error: unknown) => reportOperationalEvent("firestore_load_failed", error));
    };
    listen();
    return () => {
      cancelled = true;
      unsubscribe?.();
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [activeSessionId, uid, setActiveSessionId]);

  return activeSessionId && uid ? session : null;
}
