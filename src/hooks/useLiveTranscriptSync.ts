"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createThrottledLatest } from "@/lib/throttledLatest";
import { INTERIM_SYNC_INTERVAL_MS, LIVE_SESSION_MESSAGES } from "@/lib/constants";
import { reportOperationalEvent } from "@/lib/monitoring";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

interface LiveTranscriptSync {
  onFinalSentence: (text: string) => void;
  onInterim: (text: string) => void;
}

const loadLiveSessions = () => import("@/lib/firebase/liveSessions");

let lastSeq = 0;
/**
 * Starts from the current time (so a reloaded page still outranks its older
 * writes) and then counts up by one, so consecutive writes rotate through
 * the interim slots evenly.
 */
function nextSeq(): number {
  lastSeq = lastSeq === 0 ? Date.now() : lastSeq + 1;
  return lastSeq;
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
  const interimWriterRef = useRef<ReturnType<typeof createThrottledLatest<string>> | null>(
    null
  );

  const reportFailure = useCallback((error: unknown) => {
    reportOperationalEvent("live_write_failed", error);
    if (hasWarnedRef.current) return;
    hasWarnedRef.current = true;
    toast.error(LIVE_SESSION_MESSAGES.WRITE_FAILED);
  }, []);

  // Build the throttled writer in an effect. Creating it during render
  // hands a ref-reading callback to createThrottledLatest, which the
  // react-hooks/refs rule rejects.
  useEffect(() => {
    hasWarnedRef.current = false;
    if (!sessionId) {
      interimWriterRef.current = null;
      return;
    }
    const writer = createThrottledLatest((text: string) => {
      const seq = nextSeq();
      loadLiveSessions()
        .then(({ setInterimText }) => setInterimText(sessionId, text, seq))
        .catch(reportFailure);
    }, INTERIM_SYNC_INTERVAL_MS);
    interimWriterRef.current = writer;
    return () => {
      writer.cancel();
      if (interimWriterRef.current === writer) interimWriterRef.current = null;
    };
  }, [sessionId, reportFailure]);

  // Clear viewers' in-progress line when the mic stops mid-sentence.
  useEffect(() => {
    if (isListening || !sessionId) return;
    interimWriterRef.current?.cancel();
    const seq = nextSeq();
    loadLiveSessions()
      .then(({ setInterimText }) => setInterimText(sessionId, "", seq))
      .catch((error: unknown) => reportOperationalEvent("interim_clear_failed", error));
  }, [isListening, sessionId]);

  const onInterim = useCallback((text: string) => interimWriterRef.current?.push(text), []);

  const onFinalSentence = useCallback(
    (text: string) => {
      if (!sessionId) return;
      interimWriterRef.current?.cancel();
      const seq = nextSeq();
      loadLiveSessions()
        .then(({ appendTranscriptLine }) => appendTranscriptLine(sessionId, text, seq))
        .catch(reportFailure);
    },
    [sessionId, reportFailure]
  );

  return { onFinalSentence, onInterim };
}
