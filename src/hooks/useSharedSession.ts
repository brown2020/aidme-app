"use client";

import { useEffect, useState } from "react";
import {
  subscribeToInterim,
  subscribeToLines,
  subscribeToSession,
} from "@/lib/firebase/liveSessions";
import type { LiveSession, TranscriptLine } from "@/lib/liveSessionModel";
import { logger } from "@/lib/logger";

export type SharedSessionState =
  | { kind: "loading" }
  | { kind: "ready"; session: LiveSession; lines: TranscriptLine[]; interim: string }
  | { kind: "noAccess" | "notFound" | "failed" };

/** Live subscription to a shared session, its lines, and the words being spoken */
export function useSharedSession(sessionId: string): SharedSessionState {
  const [session, setSession] = useState<LiveSession | null | undefined>(undefined);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [failure, setFailure] = useState<"noAccess" | "failed" | null>(null);

  useEffect(() => {
    const fail = (error: { code?: string }) => {
      logger.warn("Live session read failed", error);
      setFailure(error.code === "permission-denied" ? "noAccess" : "failed");
    };
    const unsubscribers = [
      subscribeToSession(sessionId, (watched) => {
        if (!watched.exists) setSession(null);
        else if (!watched.session) setFailure("failed");
        else setSession(watched.session);
      }, fail),
      subscribeToLines(sessionId, setLines, fail),
      subscribeToInterim(sessionId, setInterim, fail),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [sessionId]);

  if (failure) return { kind: failure };
  if (session === undefined) return { kind: "loading" };
  if (session === null) return { kind: "notFound" };
  return { kind: "ready", session, lines, interim };
}
