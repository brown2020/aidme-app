import { useState, useEffect, useCallback } from "react";
import {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
} from "@/lib/speechRecognition";
import { ERROR_MESSAGES } from "@/lib/constants";

type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

interface UseMicrophonePermissionResult {
  status: PermissionStatus;
  error: string | null;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook to manage microphone permission state and requests
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
        setStatus(result.state as PermissionStatus);
        result.onchange = () => setStatus(result.state as PermissionStatus);
      })
      .catch(() => {
        // Permission API not supported, leave as unknown
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



