"use client";

import { useEffect, useState } from "react";
import { subscribeToSession } from "@/lib/firebase/liveSessions";
import type { LiveSession } from "@/lib/liveSessionModel";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/**
 * Subscribes to the session this tab streams to, and stops streaming if it
 * was ended or deleted elsewhere (e.g. from the account page on another device).
 */
export function useActiveLiveSession(): LiveSession | null {
  const activeSessionId = useLiveSessionStore((s) => s.activeSessionId);
  const setActiveSessionId = useLiveSessionStore((s) => s.setActiveSessionId);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const [session, setSession] = useState<LiveSession | null>(null);

  useEffect(() => {
    if (!activeSessionId || !uid) return;
    return subscribeToSession(
      activeSessionId,
      (next) => {
        if (!next || next.status !== "live" || next.ownerUid !== uid) {
          setActiveSessionId(null);
          setSession(null);
          return;
        }
        setSession(next);
      },
      (error) => {
        logger.warn("Active live session unavailable", error);
        setActiveSessionId(null);
        setSession(null);
      }
    );
  }, [activeSessionId, uid, setActiveSessionId]);

  return activeSessionId && uid ? session : null;
}
