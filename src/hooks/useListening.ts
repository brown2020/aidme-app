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

interface UseListeningResult {
  transcript: string[];
  interimTranscript: string;
  isListening: boolean;
  permissionError: string | null;
  setPermissionError: (error: string | null) => void;
}

export default function useListening(
  shouldListen: boolean,
  language = "en-US"
): UseListeningResult {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

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
        console.error(`Failed to start recognition: ${message}`);
      }
    }
  }, []);

  const stopRecognition = useCallback((recognition: SpeechRecognition) => {
    if (!getIsRecognitionActive()) return;
    try {
      recognition.stop();
    } catch (error) {
      console.error("Failed to stop recognition:", error);
    }
  }, []);

  const scheduleRestart = useCallback(
    (recognition: SpeechRecognition) => {
      if (restartTimeoutRef.current !== null) return;
      restartTimeoutRef.current = window.setTimeout(() => {
        restartTimeoutRef.current = null;
        if (shouldListen && !permissionError && !getIsRecognitionActive()) {
          startRecognition(recognition);
        }
      }, RECOGNITION_RESTART_DELAY_MS);
    },
    [permissionError, shouldListen, startRecognition]
  );

  // Main recognition effect
  useEffect(() => {
    if (typeof window === "undefined" || permissionError) return;

    const recognition = getSpeechRecognitionInstance(language);
    if (!recognition) return;

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        stopRecognition(recognition);
        return;
      }
      if (event.error === "not-allowed") {
        setPermissionError(ERROR_MESSAGES.MIC_NOT_ALLOWED);
        return;
      }
      console.error(`Speech recognition error: ${event.error}`);
      stopRecognition(recognition);
    };

    recognition.onstart = () => {
      setIsRecognitionActive(true);
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsRecognitionActive(false);
      setIsListening(false);
      if (shouldListen && !permissionError) {
        scheduleRestart(recognition);
      }
    };

    if (shouldListen) {
      startRecognition(recognition);
    } else {
      stopRecognition(recognition);
    }

    return () => {
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
    scheduleRestart,
  ]);

  return {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  };
}
