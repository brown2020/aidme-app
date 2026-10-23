"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { refreshEmailVerification, resendVerificationEmail } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { Button } from "../ui/Button";
import { FormMessage } from "../ui/FormMessage";

interface VerifyEmailNoticeProps {
  email: string | null;
  reason: string;
}

/** Unverified-email state with resend and "I've verified" refresh */
export function VerifyEmailNotice({ email, reason }: VerifyEmailNoticeProps) {
  const [busy, setBusy] = useState<"resend" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resend = async () => {
    setBusy("resend");
    setError(null);
    try {
      await resendVerificationEmail();
      setNotice(`Verification email sent to ${email ?? "your address"}.`);
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    setBusy("refresh");
    setError(null);
    try {
      const verified = await refreshEmailVerification();
      if (verified) {
        toast.success("Email verified");
      } else {
        setNotice("Not verified yet. Open the link in the email we sent, then try again.");
      }
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-500/50 bg-amber-950/40 p-4">
      <h2 className="text-lg font-semibold text-amber-100">Verify your email</h2>
      <p className="text-amber-50/90">
        {reason} We sent a link to <strong>{email}</strong>.
      </p>
      {notice && <FormMessage tone="info">{notice}</FormMessage>}
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={refresh} disabled={busy !== null}>
          {busy === "refresh" && <Loader2 size={16} className="animate-spin" aria-hidden />}
          I&apos;ve verified
        </Button>
        <Button size="sm" variant="secondary" onClick={resend} disabled={busy !== null}>
          {busy === "resend" && <Loader2 size={16} className="animate-spin" aria-hidden />}
          Resend email
        </Button>
      </div>
    </div>
  );
}
