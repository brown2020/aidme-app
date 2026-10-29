"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/zustand/useAppStore";
import { useMicrophonePermission } from "./useMicrophonePermission";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { PermissionStatus } from "@/lib/validation";

let microphoneStartCount = 0;

function markMicrophoneStart(active: boolean) {
  if (active) {
    microphoneStartCount += 1;
    useAppStore.getState().setMicStarting(true);
    return;
  }
  microphoneStartCount = Math.max(0, microphoneStartCount - 1);
  if (microphoneStartCount === 0) {
    useAppStore.getState().setMicStarting(false);
  }
}

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
  const { shouldListen, setShouldListen, micStarting: isStarting, setMicPermissionError } =
    useAppStore();
  const { status, error, isSupported, requestPermission } =
    useMicrophonePermission();
  const router = useRouter();
  const toggleInFlightRef = useRef(false);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (isSupported === false) {
      setMicPermissionError(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      toast.error(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      return false;
    }

    if (useAppStore.getState().micStarting) return false;

    markMicrophoneStart(true);
    try {
      const granted = await requestPermission();
      if (!granted) {
        toast.error(
          useAppStore.getState().micPermissionError ??
            ERROR_MESSAGES.MIC_PERMISSION_ERROR
        );
        return false;
      }

      setShouldListen(true);
      if (navigateToHome) {
        router.push("/");
      }
      return true;
    } finally {
      markMicrophoneStart(false);
    }
  }, [
    isSupported,
    requestPermission,
    setShouldListen,
    setMicPermissionError,
    navigateToHome,
    router,
  ]);

  const stopListening = useCallback(() => {
    setShouldListen(false);
  }, [setShouldListen]);

  const toggleListening = useCallback(async () => {
    if (toggleInFlightRef.current) return;
    toggleInFlightRef.current = true;

    try {
      if (shouldListen) {
        stopListening();
        if (navigateToHome) {
          router.push("/");
        }
      } else {
        await startListening();
      }
    } finally {
      toggleInFlightRef.current = false;
    }
  }, [shouldListen, stopListening, startListening, navigateToHome, router]);

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
