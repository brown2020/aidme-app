"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { clearLocalAccountState } from "@/lib/accountCleanup";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { reportOperationalEvent } from "@/lib/monitoring";
import { getSafeRedirect } from "@/lib/redirect";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/**
 * Hard sign-out: ends any live share, signs out of Firebase, clears
 * account-related local state, and reloads to a clean signed-out page.
 */
export function useSignOut(): {
  signOut: (redirectTo?: string) => Promise<void>;
  isSigningOut: boolean;
} {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async (redirectTo = "/") => {
    setIsSigningOut(true);
    const activeSessionId = useLiveSessionStore.getState().activeSessionId;
    try {
      if (activeSessionId) {
        const { setSessionStatus } = await import("@/lib/firebase/liveSessions");
        await setSessionStatus(activeSessionId, "ended").catch((error: unknown) =>
          reportOperationalEvent("end_session_on_sign_out_failed", error)
        );
      }
      const { signOutUser } = await import("@/lib/firebase/auth");
      await signOutUser();
    } catch (error) {
      setIsSigningOut(false);
      toast.error(getAuthErrorMessage(error) ?? "Couldn't sign out. Please try again.");
      return;
    }
    clearLocalAccountState();
    window.location.assign(getSafeRedirect(redirectTo));
  }, []);

  return { signOut, isSigningOut };
}
