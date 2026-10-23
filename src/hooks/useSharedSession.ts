"use client";

import { useEffect, useState } from "react";
import { subscribeToLines, subscribeToSession } from "@/lib/firebase/liveSessions";
import type { LiveSession, TranscriptLine } from "@/lib/liveSessionModel";
import { logger } from "@/lib/logger";

export type SharedSessionState =
  | { kind: "loading" }
  | { kind: "ready"; session: LiveSession; lines: TranscriptLine[] }
  | { kind: "noAccess" | "notFound" | "failed" };

/** Live subscription to a shared session and its lines */
export function useSharedSession(sessionId: string): SharedSessionState {
  const [session, setSession] = useState<LiveSession | null | undefined>(undefined);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [failure, setFailure] = useState<"noAccess" | "failed" | null>(null);

  useEffect(() => {
    const fail = (error: { code?: string }) => {
      logger.warn("Live session read failed", error);
      setFailure(error.code === "permission-denied" ? "noAccess" : "failed");
    };
    const unsubscribeSession = subscribeToSession(sessionId, setSession, fail);
    const unsubscribeLines = subscribeToLines(sessionId, setLines, fail);
    return () => {
      unsubscribeSession();
      unsubscribeLines();
    };
  }, [sessionId]);

  if (failure) return { kind: failure };
  if (session === undefined) return { kind: "loading" };
  if (session === null) return { kind: "notFound" };
  return { kind: "ready", session, lines };
}
