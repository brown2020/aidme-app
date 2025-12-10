import { useState, useEffect, useCallback, useRef } from "react";
import {
  MAX_TRANSCRIPT_LENGTH,
  RECOGNITION_RESTART_DELAY_MS,
} from "@/lib/constants";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface ExtendedWindow {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

let recognitionInstance: SpeechRecognition | null = null;
let isRecognitionActive = false;

/** Check if the browser supports speech recognition */
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(
    window.SpeechRecognition ||
    (window as unknown as ExtendedWindow).webkitSpeechRecognition
  );
};

/** Request microphone permission explicitly */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
};

const getSpeechRecognitionInstance = (
  language = "en-US"
): SpeechRecognition | null => {
  if (typeof window === "undefined") return null;

  const SpeechRecognition = (window.SpeechRecognition ||
    (window as unknown as ExtendedWindow).webkitSpeechRecognition) as
    | SpeechRecognitionConstructor
    | undefined;

  if (!SpeechRecognition) return null;

  if (!recognitionInstance) {
    try {
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;
    } catch {
      return null;
    }
  } else if (recognitionInstance.lang !== language) {
    recognitionInstance.lang = language;
  }

  return recognitionInstance;
};

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
    if (isRecognitionActive) return;
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
    if (!isRecognitionActive) return;
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
        if (shouldListen && !permissionError && !isRecognitionActive) {
          startRecognition(recognition);
        }
      }, RECOGNITION_RESTART_DELAY_MS);
    },
    [permissionError, shouldListen, startRecognition]
  );

  // Request permission when listening starts
  useEffect(() => {
    if (!shouldListen || typeof navigator === "undefined") return;

    requestMicrophonePermission()
      .then((granted) => {
        setPermissionError(
          granted
            ? null
            : "Microphone permission denied. Please allow microphone access in your browser settings."
        );
      })
      .catch(() => {
        setPermissionError(
          "Error requesting microphone permission. Please check your browser settings."
        );
      });
  }, [shouldListen]);

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
        setPermissionError(
          "Microphone access was denied. Please allow microphone access in your browser settings."
        );
        return;
      }
      console.error(`Speech recognition error: ${event.error}`);
      stopRecognition(recognition);
    };

    recognition.onstart = () => {
      isRecognitionActive = true;
      setIsListening(true);
    };

    recognition.onend = () => {
      isRecognitionActive = false;
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
      isRecognitionActive = false;
      // Clear handlers with no-ops to prevent memory leaks
      const noop = () => {};
      recognition.onend = noop;
      recognition.onspeechend = noop;
      recognition.onsoundend = noop;
      recognition.onerror = noop;
      recognition.onresult = noop;
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
