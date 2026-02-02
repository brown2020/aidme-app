import { useState, useEffect, useCallback, useRef } from "react";
import {
  MAX_TRANSCRIPT_LENGTH,
  RECOGNITION_RESTART_DELAY_MS,
  ERROR_MESSAGES,
} from "@/lib/constants";
import {
  getSpeechRecognitionInstance,
  getIsRecognitionActive,
  setIsRecognitionActive,
} from "@/lib/speechRecognition";
import { logger } from "@/lib/logger";

interface UseListeningResult {
  transcript: string[];
  interimTranscript: string;
  isListening: boolean;
  permissionError: string | null;
  setPermissionError: (error: string | null) => void;
}

/**
 * Hook to manage speech recognition lifecycle and transcription state
 *
 * @param shouldListen - Whether speech recognition should be active
 * @param language - BCP 47 language tag (default: "en-US")
 * @returns Transcript state, listening status, and permission error handling
 */
export default function useListening(
  shouldListen: boolean,
  language = "en-US"
): UseListeningResult {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Refs for cleanup race condition prevention
  const restartTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let newInterimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (!result?.[0]) continue;

      const text = result[0].transcript.trim();
      if (result.isFinal) {
        const finalText = text.charAt(0).toUpperCase() + text.slice(1) + ".";
        setTranscript((prev) =>
          [...prev, finalText].slice(-MAX_TRANSCRIPT_LENGTH)
        );
        newInterimTranscript = "";
      } else {
        newInterimTranscript += text + " ";
      }
    }
    setInterimTranscript(newInterimTranscript);
  }, []);

  const startRecognition = useCallback((recognition: SpeechRecognition) => {
    if (getIsRecognitionActive()) return;
    try {
      recognition.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("already started")) {
        logger.error("Failed to start recognition", error);
      }
    }
  }, []);

  const stopRecognition = useCallback((recognition: SpeechRecognition) => {
    if (!getIsRecognitionActive()) return;
    try {
      recognition.stop();
    } catch (error) {
      logger.error("Failed to stop recognition", error);
    }
  }, []);

  // Main recognition effect
  useEffect(() => {
    if (typeof window === "undefined" || permissionError) return;

    const recognition = getSpeechRecognitionInstance(language);
    if (!recognition) return;

    // Track mount state for this effect instance
    isMountedRef.current = true;

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      // No speech detected - just restart
      if (event.error === "no-speech") {
        stopRecognition(recognition);
        return;
      }

      // Permission denied
      if (event.error === "not-allowed") {
        setPermissionError(ERROR_MESSAGES.MIC_NOT_ALLOWED);
        logger.warn("Microphone permission not allowed");
        return;
      }

      // Network or service errors - show user-visible error
      if (event.error === "network" || event.error === "service-not-allowed") {
        setPermissionError(ERROR_MESSAGES.NETWORK_ERROR);
        logger.error("Speech recognition network error", { error: event.error });
        return;
      }

      // Other errors - log and stop
      logger.error("Speech recognition error", { error: event.error });
      stopRecognition(recognition);
    };

    recognition.onstart = () => {
      setIsRecognitionActive(true);
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsRecognitionActive(false);
      setIsListening(false);

      // Only schedule restart if still mounted and should listen
      if (isMountedRef.current && shouldListen && !permissionError) {
        // Clear any existing timeout
        if (restartTimeoutRef.current !== null) {
          clearTimeout(restartTimeoutRef.current);
        }

        restartTimeoutRef.current = window.setTimeout(() => {
          restartTimeoutRef.current = null;
          // Double-check mount state and conditions before restarting
          if (
            isMountedRef.current &&
            shouldListen &&
            !permissionError &&
            !getIsRecognitionActive()
          ) {
            startRecognition(recognition);
          }
        }, RECOGNITION_RESTART_DELAY_MS);
      }
    };

    if (shouldListen) {
      startRecognition(recognition);
    } else {
      stopRecognition(recognition);
    }

    return () => {
      // Mark as unmounted to prevent restart after cleanup
      isMountedRef.current = false;

      // Clear pending restart
      if (restartTimeoutRef.current !== null) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // Stop recognition
      try {
        recognition.stop();
      } catch {
        // Ignore cleanup errors
      }
      setIsRecognitionActive(false);
    };
  }, [
    language,
    shouldListen,
    permissionError,
    handleResult,
    startRecognition,
    stopRecognition,
  ]);

  return {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  };
}
