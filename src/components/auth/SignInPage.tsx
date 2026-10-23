"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getSafeRedirect } from "@/lib/redirect";
import { AUTH_ERROR_MESSAGES, MIN_PASSWORD_LENGTH } from "@/lib/constants";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useIsNativeWebView } from "@/hooks/useBrowserValue";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { FormMessage } from "../ui/FormMessage";
import { PasswordField } from "./PasswordField";
import { GoogleIcon } from "./GoogleIcon";
import {
  AUTH_DESCRIPTIONS,
  AUTH_SUBMIT_LABELS,
  AUTH_TITLES,
  submitAuthForm,
  validateAuthFields,
  type AuthFields,
  type AuthMode,
} from "./authFormModel";

const EMPTY_FIELDS: AuthFields = { name: "", email: "", password: "", confirmPassword: "" };
const linkButtonClassName = "text-left text-blue-300 underline underline-offset-2 hover:text-blue-200";

/** Sign in, create account, password reset, and passwordless email link */
export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const initialMode: AuthMode = searchParams.get("mode") === "signup" ? "signUp" : "signIn";
  const status = useAuthStore((s) => s.status);
  const email = useAuthStore((s) => s.user?.email ?? null);

  if (!isFirebaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-md text-white">
        <FormMessage tone="info">{AUTH_ERROR_MESSAGES.NOT_CONFIGURED}</FormMessage>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-white">
      {status === "signedIn" ? (
        <AlreadySignedIn email={email} redirect={redirect} />
      ) : (
        <AuthForm initialMode={initialMode} redirect={redirect} />
      )}
      <p className="text-sm text-gray-400">
        You don&apos;t need an account for captions on this device.{" "}
        <Link href="/" className="text-blue-300 underline underline-offset-2 hover:text-blue-200">
          Start transcribing
        </Link>
        .
      </p>
    </div>
  );
}

function AlreadySignedIn({ email, redirect }: { email: string | null; redirect: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">You&apos;re signed in</h1>
      <p className="text-gray-300">Signed in as {email}.</p>
      <Link
        href={redirect}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-lg font-medium hover:bg-blue-700"
      >
        Continue
      </Link>
    </div>
  );
}

function AuthForm({ initialMode, redirect }: { initialMode: AuthMode; redirect: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fields, setFields] = useState<AuthFields>(EMPTY_FIELDS);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: keyof AuthFields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSentTo(null);
    setFields((current) => ({ ...current, password: "", confirmPassword: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = validateAuthFields(mode, fields);
    setError(invalid);
    if (invalid) return;
    setIsSubmitting(true);
    try {
      const outcome = await submitAuthForm(mode, fields, redirect);
      if (outcome === "emailSent") {
        setSentTo(fields.email.trim());
        return;
      }
      if (mode === "signUp") toast.success("Account created. Check your email to verify your address.");
      router.replace(redirect);
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace(redirect);
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{AUTH_TITLES[mode]}</h1>
        <p className="text-gray-300">{AUTH_DESCRIPTIONS[mode]}</p>
      </div>

      {sentTo ? (
        <EmailSentNotice mode={mode} sentTo={sentTo} onBack={() => switchMode("signIn")} />
      ) : (
        <>
          {(mode === "signIn" || mode === "signUp") && (
            <GoogleSignIn disabled={isSubmitting} onClick={() => void handleGoogle()} />
          )}
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
            <AuthFormFields mode={mode} fields={fields} onChange={updateField} />
            {error && <FormMessage tone="error">{error}</FormMessage>}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && <Loader2 size={18} className="animate-spin" aria-hidden />}
              {AUTH_SUBMIT_LABELS[mode]}
            </Button>
          </form>
          <AuthModeLinks mode={mode} onSwitch={switchMode} />
        </>
      )}
    </>
  );
}

function GoogleSignIn({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const isNativeWebView = useIsNativeWebView();
  if (isNativeWebView) return null;
  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        className="w-full border border-slate-600"
        disabled={disabled}
        onClick={onClick}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-sm text-gray-400" aria-hidden>
        <span className="h-px flex-1 bg-slate-700" />
        or
        <span className="h-px flex-1 bg-slate-700" />
      </div>
    </>
  );
}

interface AuthFormFieldsProps {
  mode: AuthMode;
  fields: AuthFields;
  onChange: (key: keyof AuthFields, value: string) => void;
}

function AuthFormFields({ mode, fields, onChange }: AuthFormFieldsProps) {
  const isSignUp = mode === "signUp";
  const usesPassword = mode === "signIn" || isSignUp;
  return (
    <>
      {isSignUp && (
        <TextField
          label="Your name"
          name="name"
          autoComplete="name"
          value={fields.name}
          onChange={(e) => onChange("name", e.target.value)}
          hint="Shown to people you share captions with."
          maxLength={100}
        />
      )}
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={fields.email}
        onChange={(e) => onChange("email", e.target.value)}
      />
      {usesPassword && (
        <PasswordField
          label="Password"
          name="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          value={fields.password}
          onChange={(e) => onChange("password", e.target.value)}
          hint={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
        />
      )}
      {isSignUp && (
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={fields.confirmPassword}
          onChange={(e) => onChange("confirmPassword", e.target.value)}
        />
      )}
    </>
  );
}

function EmailSentNotice({
  mode,
  sentTo,
  onBack,
}: {
  mode: AuthMode;
  sentTo: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FormMessage tone="success">
        {mode === "reset"
          ? `If an account exists for ${sentTo}, a password reset link is on its way.`
          : `Check your inbox at ${sentTo} and open the link on this device to finish signing in.`}
      </FormMessage>
      <Button variant="secondary" onClick={onBack}>
        Back to sign in
      </Button>
    </div>
  );
}

function AuthModeLinks({ mode, onSwitch }: { mode: AuthMode; onSwitch: (mode: AuthMode) => void }) {
  if (mode !== "signIn") {
    return (
      <p className="text-sm text-gray-300">
        {mode === "signUp" && "Already have an account? "}
        <button type="button" className={linkButtonClassName} onClick={() => onSwitch("signIn")}>
          {mode === "signUp" ? "Sign in" : "Back to sign in"}
        </button>
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <button type="button" className={linkButtonClassName} onClick={() => onSwitch("reset")}>
        Forgot your password?
      </button>
      <button
        type="button"
        className={`flex items-center gap-2 ${linkButtonClassName}`}
        onClick={() => onSwitch("emailLink")}
      >
        <Mail size={16} aria-hidden />
        Email me a sign-in link instead
      </button>
      <p className="text-gray-300">
        New to Aid.me?{" "}
        <button type="button" className={linkButtonClassName} onClick={() => onSwitch("signUp")}>
          Create an account
        </button>
      </p>
    </div>
  );
}
