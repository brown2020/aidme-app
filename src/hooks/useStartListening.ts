"use client";

import { useCallback, useRef, useState } from "react";
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
  isStarting: boolean;
  isSupported: boolean | null;
  permissionStatus: PermissionStatus;
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
  const [isStarting, setIsStarting] = useState(false);
  const toggleInFlightRef = useRef(false);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (isSupported === false) return false;

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
    if (toggleInFlightRef.current) return;
    toggleInFlightRef.current = true;
    setIsStarting(true);

    try {
      if (shouldListen) {
        stopListening();
        if (navigateToHome) {
          router.push("/");
        }
      } else {
        const started = await startListening();
        if (!started && status === "denied") {
          toast.error(ERROR_MESSAGES.MIC_NOT_ALLOWED, {
            description:
              "Please check your browser settings to allow microphone access.",
            duration: 5000,
          });
        }
      }
    } finally {
      toggleInFlightRef.current = false;
      setIsStarting(false);
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
    isStarting,
    isSupported,
    permissionStatus: status,
    error,
  };
}
