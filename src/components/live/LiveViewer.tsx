"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, Play, Square } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { leaveSession } from "@/lib/firebase/liveSessions";
import { normalizeEmail, type LiveSession, type TranscriptLine } from "@/lib/liveSessionModel";
import { logger } from "@/lib/logger";
import { getCaptionTextClassName } from "@/lib/captionSize";
import { AUTH_ERROR_MESSAGES, LIVE_SESSION_MESSAGES } from "@/lib/constants";
import { useAppStore } from "@/zustand/useAppStore";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useSharedSession } from "@/hooks/useSharedSession";
import { useSignOut } from "@/hooks/useSignOut";
import { Button } from "../ui/Button";
import { FormMessage } from "../ui/FormMessage";
import { VerifyEmailNotice } from "../auth/VerifyEmailNotice";

interface LiveViewerProps {
  sessionId: string;
}

const PROBLEM_MESSAGES = {
  noAccess: LIVE_SESSION_MESSAGES.NO_ACCESS,
  notFound: LIVE_SESSION_MESSAGES.NOT_FOUND,
  failed: LIVE_SESSION_MESSAGES.LOAD_FAILED,
} as const;

/** Read-only, live-updating view of a transcript shared with the signed-in user */
export default function LiveViewer({ sessionId }: LiveViewerProps) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (!isFirebaseConfigured()) {
    return (
      <CenteredPanel>
        <FormMessage tone="info">{AUTH_ERROR_MESSAGES.NOT_CONFIGURED}</FormMessage>
      </CenteredPanel>
    );
  }
  if (status === "unknown") return <ViewerLoading />;
  if (status === "signedOut" || !user) return <ViewerSignedOut sessionId={sessionId} />;
  if (!user.emailVerified) {
    return (
      <CenteredPanel>
        <VerifyEmailNotice
          email={user.email}
          reason="To protect shared conversations, verify your email before viewing captions."
        />
      </CenteredPanel>
    );
  }
  // A different account must start from a fresh subscription.
  return <SharedSessionView key={user.uid} sessionId={sessionId} email={user.email} />;
}

/** Who the viewer stopped listening to, kept so the paused screen can name them */
interface StoppedSession {
  ownerName: string;
  isOwner: boolean;
}

function SharedSessionView({ sessionId, email }: { sessionId: string; email: string | null }) {
  const [stopped, setStopped] = useState<StoppedSession | null>(null);
  // While stopped, the subscribing component is unmounted, so nothing streams in.
  if (stopped) {
    return (
      <ViewerStopped
        sessionId={sessionId}
        email={email}
        stopped={stopped}
        onResume={() => setStopped(null)}
      />
    );
  }
  return <ListeningView sessionId={sessionId} email={email} onStop={setStopped} />;
}

function ListeningView({
  sessionId,
  email,
  onStop,
}: {
  sessionId: string;
  email: string | null;
  onStop: (stopped: StoppedSession) => void;
}) {
  const state = useSharedSession(sessionId);
  if (state.kind === "loading") return <ViewerLoading />;
  if (state.kind === "ready") {
    const { session } = state;
    const isOwner = Boolean(email) && normalizeEmail(email ?? "") === session.ownerEmail;
    return (
      <ViewerTranscript
        session={session}
        lines={state.lines}
        interim={state.interim}
        onStop={() => onStop({ ownerName: session.ownerName, isOwner })}
      />
    );
  }
  return <ViewerProblem kind={state.kind} sessionId={sessionId} email={email} />;
}

function ViewerStopped({
  sessionId,
  email,
  stopped,
  onResume,
}: {
  sessionId: string;
  email: string | null;
  stopped: StoppedSession;
  onResume: () => void;
}) {
  const [leaveState, setLeaveState] = useState<"idle" | "leaving" | "left" | "failed">("idle");

  const leave = async () => {
    if (!email) return;
    setLeaveState("leaving");
    try {
      await leaveSession(sessionId, email);
      setLeaveState("left");
    } catch (error) {
      logger.warn("Failed to leave session", error);
      setLeaveState("failed");
    }
  };

  if (leaveState === "left") {
    return (
      <CenteredPanel>
        <FormMessage tone="success">{LIVE_SESSION_MESSAGES.LEFT}</FormMessage>
        <Link href="/" className="text-blue-300 underline underline-offset-2 hover:text-blue-200">
          Go to my captions
        </Link>
      </CenteredPanel>
    );
  }

  return (
    <CenteredPanel>
      <h1 className="text-2xl font-semibold">You stopped listening</h1>
      <p className="text-gray-300">
        Captions from {stopped.ownerName} are no longer streaming to this device.
      </p>
      <Button size="lg" onClick={onResume}>
        <Play size={18} aria-hidden />
        Resume listening
      </Button>
      {!stopped.isOwner && (
        <>
          <Button variant="secondary" onClick={() => void leave()} disabled={leaveState === "leaving"}>
            {leaveState === "leaving" && <Loader2 size={16} className="animate-spin" aria-hidden />}
            Remove me from this session
          </Button>
          <p className="text-sm text-gray-400">
            Removing yourself ends your access. {stopped.ownerName} would need to invite you again.
          </p>
        </>
      )}
      {leaveState === "failed" && (
        <FormMessage tone="error">{LIVE_SESSION_MESSAGES.LEAVE_FAILED}</FormMessage>
      )}
    </CenteredPanel>
  );
}

function CenteredPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-5 text-white">
      <div className="flex w-full max-w-md flex-col gap-4">{children}</div>
    </div>
  );
}

function ViewerLoading() {
  return (
    <CenteredPanel>
      <p className="flex items-center gap-2 text-gray-300" role="status">
        <Loader2 size={18} className="animate-spin" aria-hidden />
        Loading live captions…
      </p>
    </CenteredPanel>
  );
}

function ViewerSignedOut({ sessionId }: { sessionId: string }) {
  const redirect = encodeURIComponent(`/s/${sessionId}`);
  return (
    <CenteredPanel>
      <h1 className="text-2xl font-semibold">Live captions shared with you</h1>
      <p className="text-gray-300">
        Sign in with the email address this link was sent to. You&apos;ll see each
        sentence as soon as it&apos;s spoken.
      </p>
      <Link
        href={`/sign-in?redirect=${redirect}`}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-lg font-medium hover:bg-blue-700"
      >
        Sign in
      </Link>
      <Link
        href={`/sign-in?mode=signup&redirect=${redirect}`}
        className="text-center text-blue-300 underline underline-offset-2 hover:text-blue-200"
      >
        New here? Create an account
      </Link>
    </CenteredPanel>
  );
}

function ViewerProblem({
  kind,
  sessionId,
  email,
}: {
  kind: keyof typeof PROBLEM_MESSAGES;
  sessionId: string;
  email: string | null;
}) {
  const { signOut, isSigningOut } = useSignOut();
  return (
    <CenteredPanel>
      <FormMessage tone={kind === "failed" ? "error" : "info"}>{PROBLEM_MESSAGES[kind]}</FormMessage>
      {kind === "noAccess" && (
        <>
          <p className="text-gray-300">
            You&apos;re signed in as <strong>{email}</strong>.
          </p>
          <Button
            variant="secondary"
            disabled={isSigningOut}
            onClick={() =>
              void signOut(`/sign-in?redirect=${encodeURIComponent(`/s/${sessionId}`)}`)
            }
          >
            Sign in with a different email
          </Button>
        </>
      )}
    </CenteredPanel>
  );
}

function LiveBadge({ isLive }: { isLive: boolean }) {
  return (
    <p
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        isLive ? "bg-green-900/70 text-green-100" : "bg-slate-800 text-gray-300"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${isLive ? "animate-pulse bg-green-400" : "bg-gray-500"}`}
        aria-hidden
      />
      {isLive ? "Live" : "Ended"}
    </p>
  );
}

function ViewerTranscript({
  session,
  lines,
  interim,
  onStop,
}: {
  session: LiveSession;
  lines: TranscriptLine[];
  interim: string;
  onStop: () => void;
}) {
  const captionSize = useAppStore((s) => s.captionSize);
  const endRef = useRef<HTMLDivElement>(null);
  const isLive = session.status === "live";
  const inProgress = isLive ? interim : "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines.length, inProgress]);

  const emptyMessage = isLive
    ? `Waiting for ${session.ownerName} to start speaking…`
    : "No captions were recorded in this session.";

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-black p-5 text-white">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{session.ownerName}</h1>
          <p className="text-gray-400">{session.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge isLive={isLive} />
          <Button variant="secondary" size="sm" onClick={onStop}>
            <Square size={14} aria-hidden />
            Stop listening
          </Button>
        </div>
      </div>

      <section
        aria-label={`Captions from ${session.ownerName}`}
        aria-live="polite"
        aria-relevant="additions"
        lang={session.language || undefined}
        className={`flex flex-col gap-4 font-semibold tracking-tight ${getCaptionTextClassName(captionSize)}`}
      >
        {lines.length === 0 && !inProgress ? (
          <p className="text-xl font-normal text-gray-400">{emptyMessage}</p>
        ) : (
          lines.map((line) => <p key={line.id}>{line.text}</p>)
        )}
      </section>

      {inProgress && (
        // Kept outside the live region so screen readers announce finished sentences only.
        <p className={`mt-4 font-semibold tracking-tight text-gray-300 ${getCaptionTextClassName(captionSize)}`}>
          {inProgress}
        </p>
      )}

      {!isLive && lines.length > 0 && (
        <p className="mt-6 text-gray-400" role="status">
          {session.ownerName} stopped sharing.
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
