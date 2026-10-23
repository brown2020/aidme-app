"use client";

import { useEffect, useState } from "react";
import { subscribeToInvites } from "@/lib/firebase/liveSessions";
import { emailKey, type LiveSession } from "@/lib/liveSessionModel";
import { reportOperationalEvent } from "@/lib/monitoring";

/**
 * Owner-only: invited emails that still have access. Viewers who left are
 * dropped because their fingerprint is no longer on the session.
 */
export function useSessionInvites(session: LiveSession): string[] {
  const [emails, setEmails] = useState<string[]>([]);
  const [active, setActive] = useState<string[]>([]);
  const keys = session.viewerKeys.join(",");

  useEffect(
    () =>
      subscribeToInvites(session.id, setEmails, (error) =>
        reportOperationalEvent("invites_unavailable", error)
      ),
    [session.id]
  );

  useEffect(() => {
    let cancelled = false;
    const current = new Set(keys.split(","));
    Promise.all(emails.map(async (email) => (current.has(await emailKey(email)) ? email : null)))
      .then((kept) => {
        if (!cancelled) setActive(kept.filter((email): email is string => email !== null));
      })
      .catch((error: unknown) => reportOperationalEvent("invite_hash_failed", error));
    return () => {
      cancelled = true;
    };
  }, [emails, keys]);

  return active;
}
