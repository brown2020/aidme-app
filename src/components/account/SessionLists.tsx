"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  deleteLiveSession,
  leaveSession,
  setSessionStatus,
  subscribeToOwnedSessions,
  subscribeToSharedSessions,
} from "@/lib/firebase/liveSessions";
import type { LiveSession } from "@/lib/liveSessionModel";
import { useMemberCount } from "@/hooks/useMemberCount";
import { formatSessionDate } from "@/lib/formatDate";
import { LIVE_SESSION_MESSAGES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { reportOperationalEvent } from "@/lib/monitoring";
import { Button } from "../ui/Button";
import { FormMessage } from "../ui/FormMessage";

type ListState =
  | { kind: "loading" }
  | { kind: "ready"; sessions: LiveSession[] }
  | { kind: "failed" };

type Subscribe = (
  key: string,
  onChange: (sessions: LiveSession[]) => void,
  onError: (error: unknown) => void
) => (() => void) | Promise<() => void>;

function useSessionList(subscribe: Subscribe, key: string): ListState {
  const [state, setState] = useState<ListState>({ kind: "loading" });
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    const fail = (error: unknown) => {
      reportOperationalEvent("session_list_failed", error);
      setState({ kind: "failed" });
    };
    Promise.resolve(subscribe(key, (sessions) => setState({ kind: "ready", sessions }), fail))
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch(fail);
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [subscribe, key]);
  return state;
}

function sharedWithLabel(count: number): string {
  if (count === 0) return "Shared with no one";
  return `Shared with ${count} ${count === 1 ? "person" : "people"}`;
}

function StatusBadge({ status }: { status: LiveSession["status"] }) {
  const isLive = status === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        isLive ? "bg-green-900/70 text-green-100" : "bg-slate-800 text-gray-300"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isLive ? "bg-green-400" : "bg-gray-500"}`} aria-hidden />
      {isLive ? "Live" : "Ended"}
    </span>
  );
}

function ListStatus({ state, empty }: { state: ListState; empty: string }) {
  if (state.kind === "loading") {
    return (
      <p className="flex items-center gap-2 text-gray-400" role="status">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Loading…
      </p>
    );
  }
  if (state.kind === "failed") {
    return <FormMessage tone="error">{LIVE_SESSION_MESSAGES.LOAD_FAILED}</FormMessage>;
  }
  return <p className="text-gray-400">{empty}</p>;
}

function OwnedSessionRow({ session }: { session: LiveSession }) {
  const inviteCount = useMemberCount(session.id);
  const [busy, setBusy] = useState<"stop" | "delete" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const stop = async () => {
    setBusy("stop");
    try {
      await setSessionStatus(session.id, "ended");
      toast.success(LIVE_SESSION_MESSAGES.ENDED);
    } catch (error) {
      logger.warn("Failed to end session", error);
      toast.error(LIVE_SESSION_MESSAGES.UPDATE_FAILED);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await deleteLiveSession(session.id);
      toast.success(LIVE_SESSION_MESSAGES.DELETED);
    } catch (error) {
      logger.warn("Failed to delete session", error);
      toast.error(LIVE_SESSION_MESSAGES.UPDATE_FAILED);
      setBusy(null);
      setConfirmingDelete(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{session.title}</span>
          <StatusBadge status={session.status} />
        </div>
        <p className="text-sm text-gray-400">
          {formatSessionDate(session.createdAt)}
          {inviteCount !== null ? ` · ${sharedWithLabel(inviteCount)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/s/${session.id}`}
          className="inline-flex items-center rounded-md bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700"
        >
          View
        </Link>
        {session.status === "live" && (
          <Button size="sm" variant="secondary" onClick={stop} disabled={busy !== null}>
            {busy === "stop" && <Loader2 size={14} className="animate-spin" aria-hidden />}
            Stop sharing
          </Button>
        )}
        {confirmingDelete ? (
          <>
            <Button size="sm" variant="danger" onClick={remove} disabled={busy !== null}>
              {busy === "delete" && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Delete permanently
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)} disabled={busy !== null}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)} disabled={busy !== null}>
            Delete
          </Button>
        )}
      </div>
    </li>
  );
}

const subscribeOwned: Subscribe = (uid, onChange, onError) =>
  subscribeToOwnedSessions(uid, onChange, onError);

export function OwnedSessionsList({ uid }: { uid: string }) {
  const state = useSessionList(subscribeOwned, uid);
  if (state.kind !== "ready" || state.sessions.length === 0) {
    return (
      <ListStatus
        state={state}
        empty="You haven't shared any sessions yet. Tap “Share live” on the transcript screen to start."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {state.sessions.map((session) => (
        <OwnedSessionRow key={session.id} session={session} />
      ))}
    </ul>
  );
}

export function SharedSessionsList({ uid, email }: { uid: string; email: string }) {
  const subscribe = useCallback<Subscribe>(
    (key, onChange, onError) => subscribeToSharedSessions(uid, key, onChange, onError),
    [uid]
  );
  const state = useSessionList(subscribe, email);
  if (state.kind !== "ready" || state.sessions.length === 0) {
    return <ListStatus state={state} empty="Nothing has been shared with you yet." />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {state.sessions.map((session) => (
        <SharedSessionRow key={session.id} session={session} email={email} uid={uid} />
      ))}
    </ul>
  );
}

function SharedSessionRow({
  session,
  email,
  uid,
}: {
  session: LiveSession;
  email: string;
  uid: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const leave = async () => {
    setIsLeaving(true);
    try {
      await leaveSession(session.id, email, uid);
      toast.success(LIVE_SESSION_MESSAGES.LEFT);
    } catch (error) {
      logger.warn("Failed to leave session", error);
      toast.error(LIVE_SESSION_MESSAGES.LEAVE_FAILED);
    } finally {
      setIsLeaving(false);
      setConfirming(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/s/${session.id}`} className="flex min-w-0 flex-col gap-1 hover:underline">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {session.ownerName}
          <StatusBadge status={session.status} />
        </span>
        <span className="text-sm text-gray-400">
          {session.title} · {formatSessionDate(session.createdAt)}
        </span>
      </Link>
      <div className="flex shrink-0 flex-wrap gap-2">
        {confirming ? (
          <>
            <Button size="sm" variant="danger" onClick={() => void leave()} disabled={isLeaving}>
              {isLeaving && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Leave session
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={isLeaving}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            Leave
          </Button>
        )}
      </div>
    </li>
  );
}
