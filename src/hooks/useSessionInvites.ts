"use client";

import { useEffect, useState } from "react";
import { emailKey, type LiveSession } from "@/lib/liveSessionModel";
import { reportOperationalEvent } from "@/lib/monitoring";

/**
 * Owner-only: invited emails that still have a membership row.
 * Someone who left is dropped because their row is gone.
 */
export function useSessionInvites(session: LiveSession): string[] {
  const [emails, setEmails] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [active, setActive] = useState<string[]>([]);

  useEffect(() => {
    let stopInvites: (() => void) | null = null;
    let stopMembers: (() => void) | null = null;
    let cancelled = false;
    void import("@/lib/firebase/liveSessions")
      .then(({ subscribeToInvites, subscribeToMemberIds }) => {
        if (cancelled) return;
        stopInvites = subscribeToInvites(
          session.id,
          (record) => setEmails(record.emails),
          (error) => reportOperationalEvent("invites_unavailable", error)
        );
        stopMembers = subscribeToMemberIds(
          session.id,
          setMemberIds,
          (error) => reportOperationalEvent("invites_unavailable", error)
        );
      })
      .catch((error: unknown) => reportOperationalEvent("invites_unavailable", error));
    return () => {
      cancelled = true;
      stopInvites?.();
      stopMembers?.();
    };
  }, [session.id]);

  useEffect(() => {
    let cancelled = false;
    const present = new Set(memberIds);
    Promise.all(emails.map(async (email) => (present.has(await emailKey(email)) ? email : null)))
      .then((kept) => {
        if (!cancelled) setActive(kept.filter((email): email is string => email !== null));
      })
      .catch((error: unknown) => reportOperationalEvent("invite_hash_failed", error));
    return () => {
      cancelled = true;
    };
  }, [emails, memberIds]);

  return active;
}
