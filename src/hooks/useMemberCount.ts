"use client";

import { useEffect, useState } from "react";
import { reportOperationalEvent } from "@/lib/monitoring";

/** How many people are invited. Null until the owner's membership list loads. */
export function useMemberCount(sessionId: string | null): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    void import("@/lib/firebase/liveSessions")
      .then(({ subscribeToMemberCount }) => {
        if (cancelled) return;
        unsubscribe = subscribeToMemberCount(sessionId, setCount, (error) =>
          reportOperationalEvent("member_count_failed", error)
        );
      })
      .catch((error: unknown) => reportOperationalEvent("member_count_failed", error));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [sessionId]);

  return sessionId ? count : null;
}
