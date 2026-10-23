"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useAuthStore } from "@/zustand/useAuthStore";
import { UserAvatar } from "./UserAvatar";

const linkClassName =
  "flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

/** Header shortcut to the account page, or to sign in when signed out */
export function AccountButton() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (!isFirebaseConfigured()) return null;

  if (status === "signedIn" && user) {
    return (
      <Link href="/account" className={linkClassName} aria-label={`Account for ${user.email ?? "you"}`}>
        <UserAvatar user={user} size={32} />
      </Link>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`${linkClassName} ${status === "unknown" ? "invisible" : ""}`}
      aria-label="Sign in"
      aria-hidden={status === "unknown"}
      tabIndex={status === "unknown" ? -1 : undefined}
    >
      <UserRound size={26} aria-hidden />
    </Link>
  );
}
