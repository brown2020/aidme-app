"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { appendTranscriptLine } from "@/lib/firebase/liveSessions";
import { LIVE_SESSION_MESSAGES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/**
 * Returns a callback for finalized sentences that streams them to the active
 * live session. A no-op when signed out or not sharing.
 */
export function useLiveTranscriptSync(): (text: string) => void {
  const activeSessionId = useLiveSessionStore((s) => s.activeSessionId);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    hasWarnedRef.current = false;
  }, [activeSessionId]);

  return useCallback(
    (text: string) => {
      if (!activeSessionId || !uid) return;
      appendTranscriptLine(activeSessionId, text).catch((error: unknown) => {
        logger.warn("Failed to stream transcript line", error);
        if (hasWarnedRef.current) return;
        hasWarnedRef.current = true;
        toast.error(LIVE_SESSION_MESSAGES.WRITE_FAILED);
      });
    },
    [activeSessionId, uid]
  );
}
