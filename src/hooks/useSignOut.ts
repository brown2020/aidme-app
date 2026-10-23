"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { EMAIL_FOR_SIGN_IN_KEY, signOutUser } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { setSessionStatus } from "@/lib/firebase/liveSessions";
import { logger } from "@/lib/logger";
import { getSafeRedirect } from "@/lib/redirect";
import { useAppStore } from "@/zustand/useAppStore";
import { useLiveSessionStore } from "@/zustand/useLiveSessionStore";

/**
 * Hard sign-out: stops listening, ends any live share, signs out of Firebase,
 * clears auth-related local state, and reloads to a clean signed-out home.
 */
export function useSignOut(): {
  signOut: (redirectTo?: string) => Promise<void>;
  isSigningOut: boolean;
} {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async (redirectTo = "/") => {
    setIsSigningOut(true);
    useAppStore.getState().setShouldListen(false);

    const { activeSessionId, setActiveSessionId } = useLiveSessionStore.getState();
    if (activeSessionId) {
      await setSessionStatus(activeSessionId, "ended").catch((error: unknown) =>
        logger.warn("Could not end live session during sign-out", error)
      );
      setActiveSessionId(null);
    }

    try {
      await signOutUser();
    } catch (error) {
      setIsSigningOut(false);
      toast.error(getAuthErrorMessage(error) ?? "Couldn't sign out. Please try again.");
      return;
    }

    window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
    window.sessionStorage.removeItem("aidme-app_live_session_v1");
    window.location.assign(getSafeRedirect(redirectTo));
  }, []);

  return { signOut, isSigningOut };
}
