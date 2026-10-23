"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeEmailLinkSignIn, isEmailSignInLink } from "@/lib/firebase/auth";
import { EMAIL_FOR_SIGN_IN_KEY } from "@/lib/firebase/config";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { AUTH_ERROR_MESSAGES } from "@/lib/constants";
import { getSafeRedirect } from "@/lib/redirect";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { FormMessage } from "../ui/FormMessage";

type Step = "checking" | "needEmail" | "signingIn" | "failed";

/** Finishes passwordless sign-in when the user opens the emailed link */
export default function EmailLinkCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const [step, setStep] = useState<Step>("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const finish = useCallback(
    async (address: string) => {
      setStep("signingIn");
      setError(null);
      try {
        await completeEmailLinkSignIn(address, window.location.href);
        router.replace(redirect);
      } catch (caught) {
        setError(getAuthErrorMessage(caught));
        setStep("needEmail");
      }
    },
    [redirect, router]
  );

  useEffect(() => {
    // The link is single-use, so only attempt it once per page load.
    if (startedRef.current) return;
    startedRef.current = true;
    let isLink = false;
    try {
      isLink = isEmailSignInLink(window.location.href);
    } catch {
      isLink = false;
    }
    if (!isLink) {
      setError(AUTH_ERROR_MESSAGES.LINK_INVALID);
      setStep("failed");
      return;
    }
    const savedEmail = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
    if (savedEmail) {
      void finish(savedEmail);
    } else {
      setStep("needEmail");
    }
  }, [finish]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void finish(email);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-white">
      <h1 className="text-2xl font-semibold">Finishing sign-in</h1>

      {(step === "checking" || step === "signingIn") && (
        <p className="flex items-center gap-2 text-gray-300" role="status">
          <Loader2 size={18} className="animate-spin" aria-hidden />
          Signing you in…
        </p>
      )}

      {step === "needEmail" && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <p className="text-gray-300">
            For security, confirm the email address this link was sent to.
          </p>
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <Button type="submit" size="lg">
            Sign in
          </Button>
        </form>
      )}

      {step === "failed" && (
        <div className="flex flex-col gap-4">
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(redirect)}`}
            className="text-blue-300 underline underline-offset-2 hover:text-blue-200"
          >
            Request a new sign-in link
          </Link>
        </div>
      )}
    </div>
  );
}
