import { useState, useEffect } from "react";

// Create a type alias for the global SpeechRecognition constructor
type SpeechRecognitionConstructor = new () => SpeechRecognition;

// Ensure recognitionInstance is typed correctly
let recognitionInstance: SpeechRecognition | null = null;

export const getSpeechRecognitionInstance = (
  language = "en-US"
): SpeechRecognition | null => {
  // Explicitly type SpeechRecognition as SpeechRecognitionConstructor or undefined
  const SpeechRecognition = (window.SpeechRecognition ||
    (
      window as typeof window & {
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;

  if (!recognitionInstance) {
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return null;
    }
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;
  } else if (recognitionInstance.lang !== language) {
    recognitionInstance.lang = language;
  }
  return recognitionInstance;
};

const useListening = (shouldListen: boolean, language = "en-US") => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);

  const handleResult = (event: SpeechRecognitionEvent) => {
    let newInterimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
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
    setInterimTranscript(newInterimTranscript);
  };

  const restartRecognition = (
    recognition: SpeechRecognition,
    shouldListen: boolean
  ) => {
    if (shouldListen) {
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
  };

  useEffect(() => {
    const recognition = getSpeechRecognitionInstance(language);
    if (!recognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      console.error(`Speech recognition error: ${event.error}`);
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
      recognition.stop();
      recognition.onend = () => {};
      recognition.onspeechend = () => {};
      recognition.onsoundend = () => {};
      recognition.onerror = () => {};
      recognition.onresult = () => {};
    };
  }, [language, shouldListen]);

  return {
    transcript,
    interimTranscript,
    isListening,
  };
};

export default useListening;
