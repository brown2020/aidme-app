"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/zustand/useAppStore";
import { ScaleLoader } from "react-spinners";
import Instructions from "./Instructions";
import useListening, {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
} from "@/hooks/useListening";
import { AlertTriangle, Mic, MicOff } from "lucide-react";

export default function Listen() {
  const { shouldListen, setShouldListen } = useAppStore();
  const {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  } = useListening(shouldListen);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [browserError, setBrowserError] = useState<string | null>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, interimTranscript]);

  // Check if browser supports speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isSpeechRecognitionSupported()) {
        setBrowserError(
          "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
        );
      }
    }
  }, []);

  // Handle permission request
  const handleRequestPermission = async () => {
    const granted = await requestMicrophonePermission();
    if (granted) {
      setPermissionError(null);
      setShouldListen(true);
    } else {
      setPermissionError(
        "Microphone permission denied. Please allow microphone access in your browser settings."
      );
    }
  };

  if (browserError) {
    return (
      <main className="flex flex-col items-center justify-center w-full h-full p-5 text-white bg-black">
        <div className="p-4 mb-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100 flex items-center">
          <AlertTriangle className="mr-2" />
          <p>{browserError}</p>
        </div>
        <Instructions />
      </main>
    );
  }

  if (permissionError) {
    return (
      <main className="flex flex-col items-center justify-center w-full h-full p-5 text-white bg-black">
        <div className="p-4 mb-4 text-sm text-yellow-500 bg-yellow-100 rounded-lg dark:bg-yellow-900 dark:text-yellow-100 flex items-center">
          <AlertTriangle className="mr-2" />
          <p>{permissionError}</p>
        </div>
        <div className="mt-8 flex flex-col items-center">
          <p className="mb-4 text-xl">Aid.me needs microphone access to work</p>
          <button
            className="rounded-md text-white px-6 py-3 bg-blue-600 hover:bg-blue-700 flex items-center"
            onClick={handleRequestPermission}
          >
            <Mic className="mr-2" /> Request Microphone Access
          </button>
          <p className="mt-4 text-sm text-gray-400">
            If you&apos;ve denied permission, you&apos;ll need to reset it in
            your browser settings
          </p>
        </div>
      </main>
    );
  }

  if (!shouldListen && transcript.length === 0) return <Instructions />;

  return (
    <main
      className="flex flex-col w-full h-full space-y-9 text-4xl text-white bg-black font-semibold p-5 tracking-tight"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Transcription</h2>
        {isListening ? (
          <div className="flex items-center text-green-500 text-sm">
            <Mic className="mr-1 animate-pulse" size={16} />
            <span>Listening</span>
          </div>
        ) : (
          <div className="flex items-center text-red-500 text-sm">
            <MicOff className="mr-1" size={16} />
            <span>Not listening</span>
          </div>
        )}
      </div>

      {transcript.length > 0 ? (
        transcript.map((sentence, index) => <p key={index}>{sentence}</p>)
      ) : (
        <p className="text-gray-500">Waiting for speech...</p>
      )}

      {interimTranscript && (
        <div aria-label="Processing speech">{interimTranscript}</div>
      )}

      {!interimTranscript && isListening && (
        <div aria-label="Listening for speech">
          <ScaleLoader color="#ffffff" />
        </div>
      )}

      <div
        className="h-14 w-full opacity-0"
        ref={transcriptRef}
        aria-hidden="true"
      >
        footer
      </div>
    </main>
  );
}
