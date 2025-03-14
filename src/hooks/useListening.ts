import { useState, useEffect, useCallback } from "react";

// Create a type alias for the global SpeechRecognition constructor
type SpeechRecognitionConstructor = new () => SpeechRecognition;

// Define a type for the window with webkitSpeechRecognition
interface ExtendedWindow {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

// Ensure recognitionInstance is typed correctly
let recognitionInstance: SpeechRecognition | null = null;

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

  const restartRecognition = useCallback(
    (recognition: SpeechRecognition, shouldListen: boolean) => {
      if (shouldListen && !permissionError) {
        try {
          recognition.start();
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? `Recognition error: ${error.message}`
              : "Unknown recognition error occurred";
          console.error(errorMessage);
        }
      }
    },
    [permissionError]
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
      console.error(`Speech recognition error: ${event.error}`);

      // Handle specific error types
      if (event.error === "not-allowed") {
        setPermissionError(
          "Microphone access was denied. Please allow microphone access in your browser settings."
        );
        return; // Don't restart if permission denied
      }

      restartRecognition(recognition, shouldListen);
    };

    recognition.onspeechend = () =>
      restartRecognition(recognition, shouldListen);
    recognition.onsoundend = () =>
      restartRecognition(recognition, shouldListen);
    recognition.onend = () => restartRecognition(recognition, shouldListen);

    if (shouldListen) {
      console.log("Starting recognition");
      setIsListening(true);

      try {
        recognition.start();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? `Failed to start recognition: ${error.message}`
            : "Unknown error starting recognition";
        console.error(errorMessage);
      }
    } else {
      console.log("Stopping recognition");
      setIsListening(false);

      try {
        recognition.stop();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? `Failed to stop recognition: ${error.message}`
            : "Unknown error stopping recognition";
        console.error(errorMessage);
      }
    }

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping recognition during cleanup:", error);
      }
      recognition.onend = () => {};
      recognition.onspeechend = () => {};
      recognition.onsoundend = () => {};
      recognition.onerror = () => {};
      recognition.onresult = () => {};
    };
  }, [language, shouldListen, permissionError, restartRecognition]);

  return {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  };
};

export default useListening;
