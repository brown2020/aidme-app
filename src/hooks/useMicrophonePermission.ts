import { useState, useEffect, useCallback } from "react";
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

interface UseMicrophonePermissionResult {
  status: PermissionStatus;
  error: string | null;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook to manage microphone permission state and requests
 * Uses Zod validation for type-safe permission status handling
 * 
 * @returns Permission status, error state, and request function
 * 
 * @example
 * const { status, requestPermission } = useMicrophonePermission();
 * if (status === 'denied') showPermissionError();
 */
export function useMicrophonePermission(): UseMicrophonePermissionResult {
  const [status, setStatus] = useState<PermissionStatus>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check browser support and initial permission status
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsSupported(isSpeechRecognitionSupported());

    // Query current permission status if API is available
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        const validatedStatus = validatePermissionStatus(result.state);
        setStatus(validatedStatus);
        result.onchange = () => {
          const newStatus = validatePermissionStatus(result.state);
          setStatus(newStatus);
          logger.debug("Permission status changed", { status: newStatus });
        };
      })
      .catch((error) => {
        logger.warn("Permission API not supported", error);
      });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const supported = isSpeechRecognitionSupported();
    if (!supported) {
      setIsSupported(false);
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
    } else {
      setError(ERROR_MESSAGES.MIC_NOT_ALLOWED);
      return false;
    }
  }, [status]);

  return {
    status,
    error,
    isSupported,
    requestPermission,
  };
}



