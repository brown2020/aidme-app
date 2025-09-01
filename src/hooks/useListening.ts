import { useState, useEffect, useCallback, useRef } from "react";

// Create a type alias for the global SpeechRecognition constructor
type SpeechRecognitionConstructor = new () => SpeechRecognition;

// Define a type for the window with webkitSpeechRecognition
interface ExtendedWindow {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

// Ensure recognitionInstance is typed correctly
let recognitionInstance: SpeechRecognition | null = null;
let isRecognitionActive = false;

// Check if the browser supports speech recognition
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(
    window.SpeechRecognition ||
    (window as unknown as ExtendedWindow).webkitSpeechRecognition
  );
};

// Request microphone permission explicitly
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks to release the microphone
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error("Error requesting microphone permission:", error);
    return false;
  }
};

export const getSpeechRecognitionInstance = (
  language = "en-US"
): SpeechRecognition | null => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return null;
  }

  // Explicitly type SpeechRecognition as SpeechRecognitionConstructor or undefined
  const SpeechRecognition = (window.SpeechRecognition ||
    (window as unknown as ExtendedWindow).webkitSpeechRecognition) as
    | SpeechRecognitionConstructor
    | undefined;

  if (!recognitionInstance) {
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return null;
    }
    try {
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      return null;
    }
  } else if (recognitionInstance.lang !== language) {
    recognitionInstance.lang = language;
  }
  return recognitionInstance;
};

const useListening = (shouldListen: boolean, language = "en-US") => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  const handleResult = (event: SpeechRecognitionEvent) => {
    let newInterimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i] && event.results[i][0]) {
        const transcriptPart = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          const finalTranscript =
            transcriptPart.charAt(0).toUpperCase() +
            transcriptPart.slice(1) +
            ".";
          setTranscript((prev) => [...prev, finalTranscript].slice(-200));
          newInterimTranscript = "";
        } else {
          newInterimTranscript += transcriptPart + " ";
        }
      }
    }
    setInterimTranscript(newInterimTranscript);
  };

  const startRecognitionSafe = useCallback((recognition: SpeechRecognition) => {
    if (isRecognitionActive) return;
    try {
      recognition.start();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (typeof message === "string" && message.includes("already started")) {
        return; // Ignore benign race
      }
      console.error(`Failed to start recognition: ${message}`);
    }
  }, []);

  const stopRecognitionSafe = useCallback((recognition: SpeechRecognition) => {
    if (!isRecognitionActive) return;
    try {
      recognition.stop();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to stop recognition: ${message}`);
    }
  }, []);

  const scheduleRestart = useCallback(
    (recognition: SpeechRecognition) => {
      if (restartTimeoutRef.current !== null) return;
      restartTimeoutRef.current = window.setTimeout(() => {
        restartTimeoutRef.current = null;
        if (shouldListen && !permissionError && !isRecognitionActive) {
          startRecognitionSafe(recognition);
        }
      }, 250);
    },
    [permissionError, shouldListen, startRecognitionSafe]
  );

  // Request microphone permission when shouldListen changes to true
  useEffect(() => {
    if (
      shouldListen &&
      typeof navigator !== "undefined" &&
      navigator.mediaDevices
    ) {
      requestMicrophonePermission()
        .then((granted) => {
          if (!granted) {
            setPermissionError(
              "Microphone permission denied. Please allow microphone access in your browser settings."
            );
          } else {
            setPermissionError(null);
          }
        })
        .catch((error) => {
          console.error("Error requesting microphone permission:", error);
          setPermissionError(
            "Error requesting microphone permission. Please check your browser settings."
          );
        });
    }
  }, [shouldListen]);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Don't try to start recognition if we have a permission error
    if (permissionError) return;

    const recognition = getSpeechRecognitionInstance(language);
    if (!recognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        // Expected when silent; treat as info and let onend restart
        console.debug("Speech recognition: no-speech (will restart)");
        stopRecognitionSafe(recognition);
        return;
      }

      if (event.error === "not-allowed") {
        setPermissionError(
          "Microphone access was denied. Please allow microphone access in your browser settings."
        );
        return;
      }

      // Log unexpected errors and stop; onend will restart if allowed
      console.error(`Speech recognition error: ${event.error}`);
      stopRecognitionSafe(recognition);
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
      console.log("Starting recognition");
      startRecognitionSafe(recognition);
    } else {
      console.log("Stopping recognition");
      stopRecognitionSafe(recognition);
    }

    return () => {
      if (restartTimeoutRef.current !== null) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping recognition during cleanup:", error);
      }
      isRecognitionActive = false;
      recognition.onend = () => {};
      recognition.onspeechend = () => {};
      recognition.onsoundend = () => {};
      recognition.onerror = () => {};
      recognition.onresult = () => {};
    };
  }, [
    language,
    shouldListen,
    permissionError,
    startRecognitionSafe,
    stopRecognitionSafe,
    scheduleRestart,
  ]);

  return {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  };
};

export default useListening;
