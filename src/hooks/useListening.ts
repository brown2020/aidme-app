import { useState, useEffect } from "react";

let recognitionInstance: SpeechRecognition | null = null;

export const getSpeechRecognitionInstance = (
  language = "en-US"
): SpeechRecognition | null => {
  if (!recognitionInstance) {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      } catch (error: any) {
        console.log(
          "Restarting recognition:",
          error?.message || "unknown issue"
        );
      }
    }
  };

  useEffect(() => {
    const recognition = getSpeechRecognitionInstance(language);
    if (!recognition) return;

    recognition.onresult = handleResult;

    recognition.onerror = () => restartRecognition(recognition, shouldListen);
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
      } catch (error: any) {
        console.log("Starting recognition", error?.message);
      }
    } else {
      console.log("Stopping recognition");
      setIsListening(false);

      try {
        recognition.stop();
      } catch (error: any) {
        console.log("Stopping recognition", error?.message);
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
