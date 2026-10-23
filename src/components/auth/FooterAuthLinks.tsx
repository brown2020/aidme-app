"use client";

import Link from "next/link";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useSignOut } from "@/hooks/useSignOut";

const itemClassName = "hover:opacity-100 opacity-50";

/** Footer account links, including an always-available hard sign-out */
export function FooterAuthLinks() {
  const status = useAuthStore((s) => s.status);
  const { signOut, isSigningOut } = useSignOut();

  if (!isFirebaseConfigured() || status === "unknown") return null;

  if (status === "signedOut") {
    return (
      <Link href="/sign-in" className={itemClassName}>
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/account" className={itemClassName}>
        Account
      </Link>
      <button
        type="button"
        className={itemClassName}
        onClick={() => void signOut()}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}
