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

  const restartTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const shouldListenRef = useRef(shouldListen);
  const permissionErrorRef = useRef(permissionError);
  const recognitionEffectIdRef = useRef(0);

  useEffect(() => {
    shouldListenRef.current = shouldListen;
  }, [shouldListen]);

  useEffect(() => {
    permissionErrorRef.current = permissionError;
  }, [permissionError]);

  useEffect(() => {
    setInterimTranscript("");
  }, [language]);

  // Clear blocking errors when listening stops so transcript remains visible
  useEffect(() => {
    if (!shouldListen) {
      setPermissionError(null);
      setInterimTranscript("");
    }
  }, [shouldListen]);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let newInterimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (!result?.[0]) continue;

      const text = result[0].transcript.trim();
      if (result.isFinal) {
        if (!text) continue;
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

  const canRestartListening = useCallback(() => {
    return (
      isMountedRef.current &&
      shouldListenRef.current &&
      !permissionErrorRef.current &&
      !getIsRecognitionActive()
    );
  }, []);

  // Main recognition effect
  useEffect(() => {
    if (typeof window === "undefined" || permissionError) return;

    const recognition = getSpeechRecognitionInstance(language);
    if (!recognition) return;

    const effectId = recognitionEffectIdRef.current + 1;
    recognitionEffectIdRef.current = effectId;
    isMountedRef.current = true;

    const isCurrentRecognitionEffect = () =>
      recognitionEffectIdRef.current === effectId && isMountedRef.current;

    recognition.onresult = handleResult;

    const setBlockingError = (message: string) => {
      permissionErrorRef.current = message;
      setPermissionError(message);
      stopRecognition(recognition);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        stopRecognition(recognition);
        return;
      }

      if (event.error === "not-allowed") {
        setBlockingError(ERROR_MESSAGES.MIC_NOT_ALLOWED);
        logger.warn("Microphone permission not allowed");
        return;
      }

      if (event.error === "network" || event.error === "service-not-allowed") {
        setBlockingError(ERROR_MESSAGES.NETWORK_ERROR);
        logger.warn("Speech recognition service unavailable", {
          code: event.error,
          message: event.message,
        });
        return;
      }

      if (event.error === "language-not-supported") {
        setBlockingError(ERROR_MESSAGES.LANGUAGE_NOT_SUPPORTED);
        logger.warn("Speech recognition language not supported", { language });
        return;
      }

      logger.error("Speech recognition error", {
        code: event.error,
        message: event.message,
      });
      stopRecognition(recognition);
    };

    recognition.onstart = () => {
      setIsRecognitionActive(true);
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsRecognitionActive(false);
      setIsListening(false);

      if (!isCurrentRecognitionEffect() || !canRestartListening()) return;

      if (restartTimeoutRef.current !== null) {
        clearTimeout(restartTimeoutRef.current);
      }

      restartTimeoutRef.current = window.setTimeout(() => {
        restartTimeoutRef.current = null;
        if (isCurrentRecognitionEffect() && canRestartListening()) {
          startRecognition(recognition);
        }
      }, RECOGNITION_RESTART_DELAY_MS);
    };

    if (shouldListen) {
      startRecognition(recognition);
    } else {
      stopRecognition(recognition);
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionEffectIdRef.current === effectId) {
        recognitionEffectIdRef.current += 1;
      }

      if (restartTimeoutRef.current !== null) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

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
    canRestartListening,
  ]);

  return {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  };
}
