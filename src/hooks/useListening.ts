import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  MAX_TRANSCRIPT_LENGTH,
  MIC_START_TIMEOUT_MS,
  RECOGNITION_RESTART_DELAY_MS,
  ERROR_MESSAGES,
} from "@/lib/constants";
import {
  getSpeechRecognitionInstance,
  getIsRecognitionActive,
  setIsRecognitionActive,
} from "@/lib/speechRecognition";
import { logger } from "@/lib/logger";
import { handleRecognitionEnd } from "@/lib/recognitionLifecycle";
import {
  microphoneFailureMessage,
  recognitionStartupFailure,
  type MicrophoneFailureReason,
} from "@/lib/microphoneAccess";
import { useAppStore } from "@/zustand/useAppStore";
import type { PermissionStatus } from "@/lib/validation";

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
 * @param callbacks - Live sharing hooks: each finalized sentence, and the
 *   in-progress words after every recognition result
 * @returns Transcript state, listening status, and permission error handling
 */
export default function useListening(
  shouldListen: boolean,
  language = "en-US",
  callbacks: {
    onFinalSentence?: (text: string) => void;
    onInterim?: (text: string) => void;
  } = {}
): UseListeningResult {
  const { onFinalSentence, onInterim } = callbacks;
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const restartTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const shouldListenRef = useRef(shouldListen);
  const permissionErrorRef = useRef(permissionError);
  const recognitionEffectIdRef = useRef(0);
  // Kept in refs so a new callback never restarts recognition.
  const onFinalSentenceRef = useRef(onFinalSentence);
  const onInterimRef = useRef(onInterim);

  // React-recommended: adjust related state during render when the listen flag
  // changes (not in an Effect) — clears blocking error/interim on stop or restart.
  const [prevShouldListen, setPrevShouldListen] = useState(shouldListen);
  if (prevShouldListen !== shouldListen) {
    setPrevShouldListen(shouldListen);
    setPermissionError(null);
    setInterimTranscript("");
  }

  useEffect(() => {
    shouldListenRef.current = shouldListen;
  }, [shouldListen]);

  useEffect(() => {
    permissionErrorRef.current = permissionError;
  }, [permissionError]);

  useEffect(() => {
    onFinalSentenceRef.current = onFinalSentence;
    onInterimRef.current = onInterim;
  }, [onFinalSentence, onInterim]);

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
        onFinalSentenceRef.current?.(finalText);
        newInterimTranscript = "";
      } else {
        newInterimTranscript += text + " ";
      }
    }
    setInterimTranscript(newInterimTranscript);
    const interim = newInterimTranscript.trim();
    if (interim) onInterimRef.current?.(interim);
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
    if (!recognition) {
      if (shouldListen) {
        useAppStore.getState().setMicStarting(false);
        useAppStore.getState().setMicPermissionError(
          ERROR_MESSAGES.BROWSER_NOT_SUPPORTED
        );
        useAppStore.getState().setShouldListen(false);
        toast.error(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      }
      return;
    }

    const effectId = recognitionEffectIdRef.current + 1;
    recognitionEffectIdRef.current = effectId;
    isMountedRef.current = true;

    const isCurrentRecognitionEffect = () =>
      recognitionEffectIdRef.current === effectId && isMountedRef.current;

    recognition.onresult = handleResult;

    let attempt = 0;
    let startedAttempt = -1;
    let settled = false;
    let armed = false;
    let startTimer: number | null = null;

    const clearStartTimer = () => {
      if (startTimer !== null) {
        clearTimeout(startTimer);
        startTimer = null;
      }
    };

    const leaveStarting = () => {
      useAppStore.getState().setMicStarting(false);
    };

    const failStartup = (
      reason: MicrophoneFailureReason,
      status?: PermissionStatus
    ) => {
      if (settled || !isCurrentRecognitionEffect()) return;
      settled = true;
      clearStartTimer();
      const message = microphoneFailureMessage(reason);
      permissionErrorRef.current = message;
      setPermissionError(message);
      useAppStore.getState().setMicPermissionError(message);
      if (status) useAppStore.getState().setMicPermissionStatus(status);
      leaveStarting();
      toast.error(message);
      try {
        recognition.abort();
      } catch {
        // Some engines only implement stop().
      }
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors while tearing down a start that never began.
      }
      setIsRecognitionActive(false);
      setIsListening(false);
      useAppStore.getState().setShouldListen(false);
    };

    const setBlockingError = (
      message: string,
      status?: PermissionStatus
    ) => {
      if (settled || !isCurrentRecognitionEffect()) return;
      settled = true;
      clearStartTimer();
      permissionErrorRef.current = message;
      setPermissionError(message);
      useAppStore.getState().setMicPermissionError(message);
      if (status) useAppStore.getState().setMicPermissionStatus(status);
      leaveStarting();
      toast.error(message);
      stopRecognition(recognition);
      setIsListening(false);
    };

    const beginRecognition = () => {
      if (settled || getIsRecognitionActive() || !isCurrentRecognitionEffect()) {
        return;
      }
      armed = true;
      const id = ++attempt;
      clearStartTimer();
      startTimer = window.setTimeout(() => {
        startTimer = null;
        if (startedAttempt === id) return;
        const reason = recognitionStartupFailure({
          type: "timeout",
          hasStarted: false,
        });
        if (reason) failStartup(reason);
      }, MIC_START_TIMEOUT_MS);

      try {
        recognition.start();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("already started")) return;
        logger.error("Failed to start recognition", error);
        failStartup("timeout");
      }
    };

    recognition.onerror = (event) => {
      if (!isCurrentRecognitionEffect() || settled) return;

      const hasStarted = startedAttempt === attempt;
      const startup = recognitionStartupFailure({
        type: "error",
        code: event.error,
        hasStarted,
      });
      if (startup) {
        logger.warn("Speech recognition did not start", { code: event.error });
        failStartup(startup, startup === "denied" ? "denied" : undefined);
        return;
      }

      if (event.error === "no-speech" || event.error === "aborted") {
        stopRecognition(recognition);
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
      leaveStarting();
      stopRecognition(recognition);
    };

    recognition.onstart = () => {
      if (!isCurrentRecognitionEffect() || settled) return;
      startedAttempt = attempt;
      clearStartTimer();
      setIsRecognitionActive(true);
      setIsListening(true);
      leaveStarting();
    };

    recognition.onend = () => {
      if (!isCurrentRecognitionEffect() || settled) return;

      const endedBeforeStart = recognitionStartupFailure({
        type: "end",
        hasStarted: startedAttempt === attempt,
      });
      if (endedBeforeStart) {
        logger.warn("Speech recognition ended before it started");
        failStartup(endedBeforeStart);
        return;
      }

      handleRecognitionEnd(
        isCurrentRecognitionEffect(),
        canRestartListening(),
        () => {
          setIsRecognitionActive(false);
          setIsListening(false);
        },
        () => {
          if (restartTimeoutRef.current !== null) {
            clearTimeout(restartTimeoutRef.current);
          }

          restartTimeoutRef.current = window.setTimeout(() => {
            restartTimeoutRef.current = null;
            if (isCurrentRecognitionEffect() && canRestartListening()) {
              beginRecognition();
            }
          }, RECOGNITION_RESTART_DELAY_MS);
        }
      );
    };

    if (shouldListen) {
      beginRecognition();
    } else {
      stopRecognition(recognition);
    }

    return () => {
      const abandonStart = armed && startedAttempt !== attempt;
      isMountedRef.current = false;
      settled = true;
      if (recognitionEffectIdRef.current === effectId) {
        recognitionEffectIdRef.current += 1;
      }
      if (abandonStart) leaveStarting();

      clearStartTimer();
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
