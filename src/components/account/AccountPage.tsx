"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { updateDisplayName } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { AUTH_ERROR_MESSAGES } from "@/lib/constants";
import { useAuthStore, type AuthUser } from "@/zustand/useAuthStore";
import { useSignOut } from "@/hooks/useSignOut";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { FormMessage } from "../ui/FormMessage";
import { UserAvatar } from "../auth/UserAvatar";
import { VerifyEmailNotice } from "../auth/VerifyEmailNotice";
import { OwnedSessionsList, SharedSessionsList } from "./SessionLists";

function ProfileSection({ user }: { user: AuthUser }) {
  const [name, setName] = useState(user.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isChanged = name.trim() !== (user.displayName ?? "");

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await updateDisplayName(name);
      toast.success("Name updated");
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="profile-heading">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size={56} />
        <div className="min-w-0">
          <h2 id="profile-heading" className="truncate text-xl font-semibold">
            {user.displayName || "Your account"}
          </h2>
          <p className="truncate text-gray-300">{user.email}</p>
        </div>
      </div>
      <form className="flex max-w-md flex-col gap-3" onSubmit={handleSave}>
        <TextField
          label="Name shown to viewers"
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Button type="submit" variant="secondary" size="sm" className="w-fit" disabled={!isChanged || isSaving}>
          {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden />}
          Save name
        </Button>
      </form>
    </section>
  );
}

function SignedOutAccount() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 text-white">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="text-gray-300">
        Sign in to share live captions and see captions shared with you.
      </p>
      <Link
        href="/sign-in?redirect=%2Faccount"
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-lg font-medium hover:bg-blue-700"
      >
        Sign in
      </Link>
    </div>
  );
}

/** Signed-in account hub: profile, verification, sessions, sign out */
export default function AccountPage() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (!isFirebaseConfigured()) {
    return <FormMessage tone="info">{AUTH_ERROR_MESSAGES.NOT_CONFIGURED}</FormMessage>;
  }
  if (status === "signedOut") return <SignedOutAccount />;
  if (status !== "signedIn" || !user) {
    return (
      <p className="flex items-center gap-2 text-gray-300" role="status">
        <Loader2 size={18} className="animate-spin" aria-hidden />
        Loading your account…
      </p>
    );
  }

  return <SignedInAccount user={user} />;
}

function SignedInAccount({ user }: { user: AuthUser }) {
  const { signOut, isSigningOut } = useSignOut();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 text-white">
      <h1 className="text-2xl font-semibold">Account</h1>

      {!user.emailVerified && (
        <VerifyEmailNotice
          email={user.email}
          reason="Verify your email to share live captions and view captions shared with you."
        />
      )}

      <ProfileSection key={user.displayName ?? ""} user={user} />

      <section className="flex flex-col gap-3" aria-labelledby="owned-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="owned-heading" className="text-xl font-semibold">
            Your shared sessions
          </h2>
          <Link href="/" className="text-sm text-blue-300 underline underline-offset-2 hover:text-blue-200">
            Start a new session
          </Link>
        </div>
        <OwnedSessionsList uid={user.uid} />
      </section>

      {user.email && user.emailVerified && (
        <section className="flex flex-col gap-3" aria-labelledby="shared-heading">
          <h2 id="shared-heading" className="text-xl font-semibold">
            Shared with you
          </h2>
          <SharedSessionsList email={user.email} />
        </section>
      )}

      <section className="flex flex-col gap-3 border-t border-slate-800 pt-6">
        <Button
          variant="secondary"
          className="w-fit"
          onClick={() => void signOut()}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <LogOut size={16} aria-hidden />
          )}
          Sign out
        </Button>
      </section>
    </div>
  );
}
