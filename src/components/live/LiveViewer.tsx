"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import type { LiveSession, TranscriptLine } from "@/lib/liveSessionModel";
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

function SharedSessionView({ sessionId, email }: { sessionId: string; email: string | null }) {
  const state = useSharedSession(sessionId);
  if (state.kind === "loading") return <ViewerLoading />;
  if (state.kind === "ready") {
    return <ViewerTranscript session={state.session} lines={state.lines} interim={state.interim} />;
  }
  return <ViewerProblem kind={state.kind} sessionId={sessionId} email={email} />;
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
}: {
  session: LiveSession;
  lines: TranscriptLine[];
  interim: string;
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
        <LiveBadge isLive={isLive} />
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
