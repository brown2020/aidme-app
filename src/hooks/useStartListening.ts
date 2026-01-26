"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/zustand/useAppStore";
import { useMicrophonePermission } from "./useMicrophonePermission";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { PermissionStatus } from "@/lib/validation";

interface UseStartListeningOptions {
  navigateToHome?: boolean;
}

interface UseStartListeningResult {
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  isListening: boolean;
  isSupported: boolean;
  permissionStatus: PermissionStatus;
  error: string | null;
}

/**
 * Consolidated hook for starting/stopping listening with permission handling
 * Uses Sonner toast for user feedback instead of browser alerts
 * 
 * @param options - Configuration options
 * @param options.navigateToHome - Whether to navigate to home after starting
 * @returns Listening control functions and state
 * 
 * @example
 * const { startListening, isListening } = useStartListening({ navigateToHome: true });
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
        toast.error(ERROR_MESSAGES.MIC_NOT_ALLOWED, {
          description: "Please check your browser settings to allow microphone access.",
          duration: 5000,
        });
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




