"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { appendTranscriptLine, setInterimText } from "@/lib/firebase/liveSessions";
import { createThrottledLatest } from "@/lib/throttledLatest";
import { INTERIM_SYNC_INTERVAL_MS, LIVE_SESSION_MESSAGES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

interface LiveTranscriptSync {
  onFinalSentence: (text: string) => void;
  onInterim: (text: string) => void;
}

/**
 * Streams speech to the active live session: in-progress words (throttled)
 * and each finalized sentence. A no-op when signed out or not sharing.
 */
export function useLiveTranscriptSync(isListening: boolean): LiveTranscriptSync {
  const activeSessionId = useLiveSessionStore((s) => s.activeSessionId);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const sessionId = uid ? activeSessionId : null;
  const hasWarnedRef = useRef(false);

  const reportFailure = useCallback((error: unknown) => {
    logger.warn("Failed to stream transcript", error);
    if (hasWarnedRef.current) return;
    hasWarnedRef.current = true;
    toast.error(LIVE_SESSION_MESSAGES.WRITE_FAILED);
  }, []);

  const interimWriter = useMemo(
    () =>
      sessionId
        ? createThrottledLatest(
            (text: string) => void setInterimText(sessionId, text).catch(reportFailure),
            INTERIM_SYNC_INTERVAL_MS
          )
        : null,
    [sessionId, reportFailure]
  );

  useEffect(() => {
    hasWarnedRef.current = false;
    return () => interimWriter?.cancel();
  }, [interimWriter]);

  // Clear viewers' in-progress line when the mic stops mid-sentence.
  useEffect(() => {
    if (isListening || !sessionId || !interimWriter) return;
    interimWriter.cancel();
    setInterimText(sessionId, "").catch((error: unknown) =>
      logger.warn("Failed to clear in-progress text", error)
    );
  }, [isListening, sessionId, interimWriter]);

  const onInterim = useCallback((text: string) => interimWriter?.push(text), [interimWriter]);

  const onFinalSentence = useCallback(
    (text: string) => {
      if (!sessionId) return;
      interimWriter?.cancel();
      appendTranscriptLine(sessionId, text).catch(reportFailure);
    },
    [sessionId, interimWriter, reportFailure]
  );

  return { onFinalSentence, onInterim };
}
