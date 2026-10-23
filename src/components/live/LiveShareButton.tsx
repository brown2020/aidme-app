"use client";

import { useRef } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useActiveLiveSession } from "@/hooks/useActiveLiveSession";
import { useAuthStore } from "@/zustand/useAuthStore";
import { LiveShareDialog } from "./LiveShareDialog";

const buttonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors px-3 py-2 text-sm text-white";

/**
 * Entry point for live sharing. Signed-out users are sent to sign in first;
 * signed-in users open the share dialog.
 */
export function LiveShareButton() {
  const status = useAuthStore((s) => s.status);
  const session = useActiveLiveSession();
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!isFirebaseConfigured() || status === "unknown") return null;

  if (status === "signedOut") {
    return (
      <Link
        href="/sign-in?redirect=%2F"
        className={`${buttonClassName} bg-slate-800 hover:bg-slate-700`}
      >
        <Radio size={16} aria-hidden />
        Share live
      </Link>
    );
  }

  const isLive = session !== null;
  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`${buttonClassName} ${isLive ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 hover:bg-slate-700"}`}
        aria-haspopup="dialog"
      >
        <Radio size={16} aria-hidden className={isLive ? "animate-pulse" : undefined} />
        {isLive ? `Live · ${session.viewerEmails.length} invited` : "Share live"}
      </button>
      <LiveShareDialog ref={dialogRef} session={session} />
    </>
  );
}
