"use client";

import { forwardRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Share2, X } from "lucide-react";
import {
  createLiveSession,
  setSessionStatus,
  updateSessionViewers,
} from "@/lib/firebase/liveSessions";
import {
  buildMailtoUrl,
  buildShareMessage,
  buildShareUrl,
  parseViewerEmails,
  type LiveSession,
} from "@/lib/liveSessionModel";
import { copyTextToClipboard } from "@/lib/transcript";
import { LIVE_SESSION_MESSAGES, MAX_SESSION_VIEWERS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useCanNativeShare, useOrigin } from "@/hooks/useBrowserValue";
import { useAppStore } from "@/zustand/useAppStore";
import { useAuthStore, type AuthUser } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";
import { Button } from "../ui/Button";
import { FormMessage } from "../ui/FormMessage";
import { inputClassName } from "../ui/TextField";

/** Returns valid lowercase emails, or a user-facing error */
function validateInvites(input: string, ownerEmail: string | null): string[] | string {
  const { emails, invalid, tooMany } = parseViewerEmails(input, ownerEmail);
  if (invalid.length > 0) return `Check these addresses: ${invalid.join(", ")}`;
  if (tooMany) return LIVE_SESSION_MESSAGES.TOO_MANY_VIEWERS;
  if (emails.length === 0) return LIVE_SESSION_MESSAGES.NO_VIEWERS;
  return emails;
}

interface LiveShareDialogProps {
  session: LiveSession | null;
}

/** Start, manage, and stop a live shared transcript */
export const LiveShareDialog = forwardRef<HTMLDialogElement, LiveShareDialogProps>(
  function LiveShareDialog({ session }, ref) {
    const user = useAuthStore((s) => s.user);
    const close = () => {
      if (ref && typeof ref !== "function") ref.current?.close();
    };

    if (!user) return null;

    return (
      <dialog
        ref={ref}
        aria-labelledby="live-share-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] max-h-[85dvh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-0 text-base font-normal tracking-normal text-white backdrop:bg-black/70"
      >
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id="live-share-title" className="text-xl font-semibold">
              {session ? "Sharing live" : "Share live captions"}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-md p-1 text-gray-300 hover:bg-slate-800 hover:text-white"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <DialogBody user={user} session={session} onClose={close} />
        </div>
      </dialog>
    );
  }
);

function DialogBody({
  user,
  session,
  onClose,
}: {
  user: AuthUser;
  session: LiveSession | null;
  onClose: () => void;
}) {
  if (!user.emailVerified) {
    return (
      <div className="flex flex-col gap-3">
        <FormMessage tone="info">{LIVE_SESSION_MESSAGES.VERIFY_EMAIL_FIRST}</FormMessage>
        <Link href="/account" className="text-blue-300 underline underline-offset-2 hover:text-blue-200" onClick={onClose}>
          Verify your email on the account page
        </Link>
      </div>
    );
  }
  if (session) return <ActiveSessionPanel user={user} session={session} onClose={onClose} />;
  return <StartSharingForm user={user} onClose={onClose} />;
}

function StartSharingForm({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const recognitionLanguage = useAppStore((s) => s.recognitionLanguage);
  const setActiveSessionId = useLiveSessionStore((s) => s.setActiveSessionId);
  const [invites, setInvites] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emails = validateInvites(invites, user.email);
    if (typeof emails === "string") {
      setError(emails);
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      const id = await createLiveSession(
        { uid: user.uid, email: user.email ?? "", displayName: user.displayName },
        recognitionLanguage,
        emails
      );
      setActiveSessionId(id);
      toast.success(LIVE_SESSION_MESSAGES.STARTED);
    } catch (caught) {
      logger.warn("Failed to start live session", caught);
      setError(LIVE_SESSION_MESSAGES.START_FAILED);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => void handleStart(e)} noValidate>
      <p className="text-gray-300">
        Invite someone to follow your captions on their own phone. Each sentence is
        saved to your account and sent to them live.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="live-share-invites" className="text-sm font-medium text-gray-200">
          Their email addresses
        </label>
        <textarea
          id="live-share-invites"
          rows={2}
          value={invites}
          onChange={(e) => setInvites(e.target.value)}
          placeholder="name@example.com"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="live-share-invites-hint"
          className={inputClassName}
        />
        <p id="live-share-invites-hint" className="text-sm text-gray-400">
          Separate multiple addresses with commas. Only these people, signed in with
          these emails, can read the transcript.
        </p>
      </div>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button type="submit" size="lg" disabled={isBusy} aria-busy={isBusy}>
        {isBusy && <Loader2 size={18} className="animate-spin" aria-hidden />}
        Start sharing
      </Button>
      <p className="text-sm text-gray-400">
        You can stop sharing or delete the transcript anytime from your{" "}
        <Link href="/account" className="text-blue-300 underline underline-offset-2 hover:text-blue-200" onClick={onClose}>
          account
        </Link>
        .
      </p>
    </form>
  );
}

function ActiveSessionPanel({
  user,
  session,
  onClose,
}: {
  user: AuthUser;
  session: LiveSession;
  onClose: () => void;
}) {
  const setActiveSessionId = useLiveSessionStore((s) => s.setActiveSessionId);
  const [error, setError] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await setSessionStatus(session.id, "ended");
      setActiveSessionId(null);
      toast.success(LIVE_SESSION_MESSAGES.ENDED);
      onClose();
    } catch (caught) {
      logger.warn("Failed to end live session", caught);
      setError(LIVE_SESSION_MESSAGES.UPDATE_FAILED);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <>
      <p className="text-gray-300">
        Each sentence you say is sent to the people below as soon as it&apos;s
        recognized. They must sign in with the invited email to see it.
      </p>
      <ShareLinkActions
        session={session}
        ownerName={user.displayName || user.email || "Someone"}
      />
      <InvitedList user={user} session={session} onError={setError} />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button variant="danger" onClick={() => void handleStop()} disabled={isStopping}>
        {isStopping && <Loader2 size={16} className="animate-spin" aria-hidden />}
        Stop sharing
      </Button>
    </>
  );
}

function ShareLinkActions({ session, ownerName }: { session: LiveSession; ownerName: string }) {
  const origin = useOrigin();
  const canNativeShare = useCanNativeShare();
  const shareUrl = buildShareUrl(origin, session.id);
  const shareMessage = buildShareMessage(ownerName, shareUrl);

  const handleCopy = async () => {
    if (await copyTextToClipboard(shareUrl)) toast.success(LIVE_SESSION_MESSAGES.LINK_COPIED);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: LIVE_SESSION_MESSAGES.SHARE_SUBJECT, text: shareMessage, url: shareUrl });
    } catch {
      // The user dismissed the share sheet.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-200">Link</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={shareUrl}
          aria-label="Share link"
          className={`${inputClassName} text-sm`}
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button variant="secondary" size="sm" onClick={() => void handleCopy()} aria-label="Copy link">
          <Copy size={16} aria-hidden />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={buildMailtoUrl(session.viewerEmails, LIVE_SESSION_MESSAGES.SHARE_SUBJECT, shareMessage)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-700"
        >
          <Mail size={16} aria-hidden />
          Email invite
        </a>
        {canNativeShare && (
          <Button variant="secondary" size="sm" onClick={() => void handleNativeShare()}>
            <Share2 size={16} aria-hidden />
            Share…
          </Button>
        )}
      </div>
    </div>
  );
}

function InvitedList({
  user,
  session,
  onError,
}: {
  user: AuthUser;
  session: LiveSession;
  onError: (message: string | null) => void;
}) {
  const [invites, setInvites] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveViewers = async (emails: string[]) => {
    onError(null);
    setIsSaving(true);
    try {
      await updateSessionViewers(session.id, emails);
      toast.success(LIVE_SESSION_MESSAGES.VIEWERS_UPDATED);
      setInvites("");
    } catch (caught) {
      logger.warn("Failed to update viewers", caught);
      onError(LIVE_SESSION_MESSAGES.UPDATE_FAILED);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emails = validateInvites(invites, user.email);
    if (typeof emails === "string") {
      onError(emails);
      return;
    }
    const merged = [...new Set([...session.viewerEmails, ...emails])];
    if (merged.length > MAX_SESSION_VIEWERS) {
      onError(LIVE_SESSION_MESSAGES.TOO_MANY_VIEWERS);
      return;
    }
    void saveViewers(merged);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-200">
        Invited ({session.viewerEmails.length}/{MAX_SESSION_VIEWERS})
      </span>
      <ul className="flex flex-col gap-1">
        {session.viewerEmails.map((email) => (
          <li
            key={email}
            className="flex items-center justify-between gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm"
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              disabled={isSaving || session.viewerEmails.length === 1}
              onClick={() => void saveViewers(session.viewerEmails.filter((e) => e !== email))}
              aria-label={`Remove ${email}`}
              className="rounded p-1 text-gray-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
            >
              <X size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form className="flex gap-2" onSubmit={handleAdd} noValidate>
        <input
          type="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={invites}
          onChange={(e) => setInvites(e.target.value)}
          placeholder="Add email"
          aria-label="Add another email"
          className={`${inputClassName} text-sm`}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={isSaving || !invites.trim()}>
          Add
        </Button>
      </form>
    </div>
  );
}
