"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { ScaleLoader } from "react-spinners";
import { useAppStore } from "@/zustand/useAppStore";
import useListening, {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
} from "@/hooks/useListening";
import Alert from "./Alert";
import Instructions from "./Instructions";

export default function Listen() {
  const { shouldListen, setShouldListen } = useAppStore();
  const {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  } = useListening(shouldListen);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [browserError, setBrowserError] = useState<string | null>(null);

  // Auto-scroll to latest transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimTranscript]);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isSpeechRecognitionSupported()) {
      setBrowserError(
        "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
    }
  }, []);

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

  // Show instructions if not listening and no transcript
  if (!shouldListen && transcript.length === 0) {
    return <Instructions />;
  }

  // Show browser error with instructions fallback
  if (browserError) {
    return (
      <main className="flex flex-col items-center justify-center w-full h-full p-5 text-white bg-black gap-4">
        <Alert variant="error">{browserError}</Alert>
        <Instructions />
      </main>
    );
  }

  // Show permission error with retry option
  if (permissionError) {
    return (
      <main className="flex flex-col items-center justify-center w-full h-full p-5 text-white bg-black gap-6">
        <Alert variant="warning">{permissionError}</Alert>
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl">Aid.me needs microphone access to work</p>
          <button
            className="rounded-md text-white px-6 py-3 bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            onClick={handleRequestPermission}
          >
            <Mic size={20} />
            Request Microphone Access
          </button>
          <p className="text-sm text-gray-400">
            If you&apos;ve denied permission, you&apos;ll need to reset it in
            your browser settings
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col w-full h-full space-y-9 text-4xl text-white bg-black font-semibold p-5 tracking-tight"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Transcription</h2>
        <ListeningStatus isListening={isListening} />
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

      <div className="h-14 w-full" ref={transcriptEndRef} aria-hidden="true" />
    </main>
  );
}

function ListeningStatus({ isListening }: { isListening: boolean }) {
  if (isListening) {
    return (
      <div className="flex items-center text-green-500 text-sm gap-1">
        <Mic className="animate-pulse" size={16} />
        <span>Listening</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-red-500 text-sm gap-1">
      <MicOff size={16} />
      <span>Not listening</span>
    </div>
  );
}
