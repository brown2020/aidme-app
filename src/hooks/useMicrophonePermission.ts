import { useEffect, useCallback } from "react";
import {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
} from "@/lib/speechRecognition";
import { ERROR_MESSAGES } from "@/lib/constants";
import {
  validatePermissionStatus,
  type PermissionStatus,
} from "@/lib/validation";
import { logger } from "@/lib/logger";
import { useAppStore } from "@/zustand/useAppStore";
import { useSpeechRecognitionSupported } from "./useSpeechRecognitionSupported";

interface UseMicrophonePermissionResult {
  status: PermissionStatus;
  error: string | null;
  /** `null` until mounted; then whether the browser supports speech recognition */
  isSupported: boolean | null;
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook to manage microphone permission state and requests.
 * Status and errors are stored in Zustand so Header and Listen stay in sync.
 */
export function useMicrophonePermission(): UseMicrophonePermissionResult {
  const {
    micPermissionStatus: status,
    micPermissionError: error,
    setMicPermissionStatus: setStatus,
    setMicPermissionError: setError,
  } = useAppStore();

  const isSupported = useSpeechRecognitionSupported();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let removeChangeListener: (() => void) | undefined;
    let isCancelled = false;

    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (isCancelled) return;

        const validatedStatus = validatePermissionStatus(result.state);
        setStatus(validatedStatus);

        const handleChange = () => {
          const newStatus = validatePermissionStatus(result.state);
          setStatus(newStatus);
          if (newStatus === "granted") {
            setError(null);
          }
          logger.debug("Permission status changed", { status: newStatus });
        };

        result.addEventListener("change", handleChange);
        removeChangeListener = () =>
          result.removeEventListener("change", handleChange);
      })
      .catch((err) => {
        if (isCancelled) return;
        logger.warn("Permission API not supported", err);
      });

    return () => {
      isCancelled = true;
      removeChangeListener?.();
    };
  }, [setStatus, setError]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const supported = isSpeechRecognitionSupported();
    if (!supported) {
      setError(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      return false;
    }

    if (status === "denied") {
      setError(ERROR_MESSAGES.MIC_DENIED);
      return false;
    }

    const granted = await requestMicrophonePermission();

    if (granted) {
      setStatus("granted");
      setError(null);
      return true;
    }

    setError(ERROR_MESSAGES.MIC_NOT_ALLOWED);
    return false;
  }, [status, setStatus, setError]);

  return {
    status,
    error,
    isSupported,
    requestPermission,
  };
}
