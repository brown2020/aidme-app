"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Radio } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useActiveLiveSession } from "@/hooks/useActiveLiveSession";
import { useMemberCount } from "@/hooks/useMemberCount";
import { useAuthStore } from "@/zustand/useAuthStore";

// Loaded on first open so the transcript screen doesn't ship Firestore up front.
const LiveShareDialog = dynamic(() => import("./LiveShareDialog"), { ssr: false });

const buttonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors px-3 py-2 text-sm text-white";

/**
 * Entry point for live sharing. Signed-out users are sent to sign in first;
 * signed-in users open the share dialog.
 */
export function LiveShareButton() {
  const status = useAuthStore((s) => s.status);
  const session = useActiveLiveSession();
  const inviteCount = useMemberCount(session?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);

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
        onClick={() => setIsOpen(true)}
        className={`${buttonClassName} ${isLive ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 hover:bg-slate-700"}`}
        aria-haspopup="dialog"
      >
        <Radio size={16} aria-hidden className={isLive ? "animate-pulse" : undefined} />
        {isLive
          ? inviteCount === null
            ? "Live"
            : `Live · ${inviteCount} invited`
          : "Share live"}
      </button>
      {isOpen && <LiveShareDialog session={session} onClose={() => setIsOpen(false)} />}
    </>
  );
}
