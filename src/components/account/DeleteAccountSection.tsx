"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  AccountRemovalIncompleteError,
  deleteAccountAndData,
  needsRecentSignIn,
  reauthenticateWithGoogle,
  reauthenticateWithPassword,
} from "@/lib/firebase/account";
import { EMAIL_FOR_SIGN_IN_KEY } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { ACCOUNT_DELETE_MESSAGES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useAppStore } from "@/zustand/useAppStore";
import type { AuthUser } from "@/zustand/useAuthStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";
import { Button } from "../ui/Button";
import { FormMessage } from "../ui/FormMessage";
import { TextField } from "../ui/TextField";
import { PasswordField } from "../auth/PasswordField";
import { useSignOut } from "@/hooks/useSignOut";

function clearLocalAccountState() {
  useAppStore.getState().setShouldListen(false);
  useLiveSessionStore.getState().setActiveSessionId(null);
  window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  window.sessionStorage.removeItem("aidme-app_live_session_v1");
}

function errorMessage(error: unknown): string {
  if (error instanceof AccountRemovalIncompleteError) return ACCOUNT_DELETE_MESSAGES.PARTIAL;
  return getAuthErrorMessage(error) ?? ACCOUNT_DELETE_MESSAGES.FAILED;
}

/** Permanently deletes the account, every owned session, and shared-session invites */
export function DeleteAccountSection({ user }: { user: AuthUser }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-red-900/70 p-4" aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="text-xl font-semibold">
        Delete account
      </h2>
      {isOpen ? (
        <DeleteAccountForm user={user} onCancel={() => setIsOpen(false)} />
      ) : (
        <>
          <p className="text-gray-300">
            Permanently delete your account and everything saved with it.
          </p>
          <Button variant="secondary" className="w-fit" onClick={() => setIsOpen(true)}>
            <Trash2 size={16} aria-hidden />
            Delete account…
          </Button>
        </>
      )}
    </section>
  );
}

function DeleteAccountForm({ user, onCancel }: { user: AuthUser; onCancel: () => void }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [needsReauth, setNeedsReauth] = useState(() => needsRecentSignIn());
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isConfirmed = confirmText.trim().toUpperCase() === ACCOUNT_DELETE_MESSAGES.CONFIRM_WORD;

  const confirmWithGoogle = async () => {
    setError(null);
    try {
      await reauthenticateWithGoogle();
      setNeedsReauth(false);
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    }
  };

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirmed) return;
    if (needsReauth && !password) {
      setError(ACCOUNT_DELETE_MESSAGES.REAUTH_REQUIRED);
      return;
    }
    setError(null);
    setIsDeleting(true);
    try {
      if (needsReauth && password) await reauthenticateWithPassword(password);
      await deleteAccountAndData();
      clearLocalAccountState();
      toast.success(ACCOUNT_DELETE_MESSAGES.DELETED);
      router.replace("/");
    } catch (caught) {
      logger.warn("Account deletion failed", caught);
      const cause = caught instanceof AccountRemovalIncompleteError ? caught.cause : caught;
      if ((cause as { code?: string })?.code === "auth/requires-recent-login") setNeedsReauth(true);
      setError(errorMessage(caught));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => void handleDelete(e)} noValidate>
      <div className="text-gray-300">
        <p>This permanently deletes:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Your account ({user.email}) and profile</li>
          <li>Every live session you shared, including all transcript lines</li>
          <li>Your email from sessions other people shared with you</li>
        </ul>
        <p className="mt-2">People you shared with lose access immediately. This can&apos;t be undone.</p>
      </div>

      {needsReauth && <ReauthFields user={user} password={password} onPasswordChange={setPassword} onGoogle={() => void confirmWithGoogle()} />}

      <TextField
        label={`Type ${ACCOUNT_DELETE_MESSAGES.CONFIRM_WORD} to confirm`}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={!isConfirmed || isDeleting} aria-busy={isDeleting}>
          {isDeleting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          Permanently delete account
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReauthFields({
  user,
  password,
  onPasswordChange,
  onGoogle,
}: {
  user: AuthUser;
  password: string;
  onPasswordChange: (value: string) => void;
  onGoogle: () => void;
}) {
  const { signOut } = useSignOut();
  return (
    <div className="flex flex-col gap-3 rounded-md bg-slate-900 p-3">
      <p className="text-sm text-gray-200">{ACCOUNT_DELETE_MESSAGES.REAUTH_REQUIRED}</p>
      {user.usesGoogle && (
        <Button type="button" variant="secondary" size="sm" className="w-fit" onClick={onGoogle}>
          Confirm with Google
        </Button>
      )}
      {user.usesPassword && (
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      )}
      <p className="text-sm text-gray-400">
        Signed in with an email link?{" "}
        <button
          type="button"
          className="text-blue-300 underline underline-offset-2 hover:text-blue-200"
          onClick={() => void signOut("/sign-in?redirect=%2Faccount")}
        >
          Sign in again
        </button>
        , then come back here within 5 minutes.
      </p>
    </div>
  );
}
