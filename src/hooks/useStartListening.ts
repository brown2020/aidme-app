"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/zustand/useAppStore";
import { useMicrophonePermission } from "./useMicrophonePermission";
import { ERROR_MESSAGES } from "@/lib/constants";

interface UseStartListeningOptions {
  navigateToHome?: boolean;
}

interface UseStartListeningResult {
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  isListening: boolean;
  isSupported: boolean;
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
  error: string | null;
}

/**
 * Consolidated hook for starting/stopping listening with permission handling
 */
export function useStartListening(
  options: UseStartListeningOptions = {}
): UseStartListeningResult {
  const { navigateToHome = false } = options;
  const { shouldListen, setShouldListen } = useAppStore();
  const { status, error, isSupported, requestPermission } =
    useMicrophonePermission();
  const router = useRouter();

  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const granted = await requestPermission();
    if (!granted) return false;

    setShouldListen(true);
    if (navigateToHome) {
      router.push("/");
    }
    return true;
  }, [isSupported, requestPermission, setShouldListen, navigateToHome, router]);

  const stopListening = useCallback(() => {
    setShouldListen(false);
  }, [setShouldListen]);

  const toggleListening = useCallback(async () => {
    if (shouldListen) {
      stopListening();
      if (navigateToHome) {
        router.push("/");
      }
    } else {
      const started = await startListening();
      if (!started && status === "denied") {
        alert(ERROR_MESSAGES.MIC_NOT_ALLOWED);
      }
    }
  }, [
    shouldListen,
    stopListening,
    startListening,
    status,
    navigateToHome,
    router,
  ]);

  return {
    startListening,
    stopListening,
    toggleListening,
    isListening: shouldListen,
    isSupported,
    permissionStatus: status,
    error,
  };
}


