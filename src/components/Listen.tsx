"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/zustand/useAppStore";
import useListening from "@/hooks/useListening";
import { useStartListening } from "@/hooks/useStartListening";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { isSpeechRecognitionSupported } from "@/lib/speechRecognition";
import Instructions from "./Instructions";
import { BrowserNotSupportedState } from "./listen/BrowserNotSupportedState";
import { PermissionErrorState } from "./listen/PermissionErrorState";
import { TranscriptHeader } from "./listen/TranscriptHeader";
import { TranscriptDisplay } from "./listen/TranscriptDisplay";

/**
 * Main listening component - orchestrates speech recognition UI
 * Refactored into smaller sub-components for better maintainability
 */
export default function Listen() {
  const {
    shouldListen,
    isTranscriptFlipped,
    toggleIsTranscriptFlipped,
    setIsTranscriptFlipped,
  } = useAppStore();
  const { startListening } = useStartListening();
  const {
    transcript,
    interimTranscript,
    isListening,
    permissionError,
    setPermissionError,
  } = useListening(shouldListen);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Auto-scroll to latest transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimTranscript]);

  // Auto-reset flip state on desktop to prevent users from getting "stuck" flipped
  useEffect(() => {
    if (isDesktop) {
      setIsTranscriptFlipped(false);
    }
  }, [isDesktop, setIsTranscriptFlipped]);

  const handleRequestPermission = async () => {
    const granted = await startListening();
    if (granted) {
      setPermissionError(null);
    }
  };

  // Show instructions if not listening and no transcript
  if (!shouldListen && transcript.length === 0) {
    return <Instructions />;
  }

  // Show browser error with instructions fallback
  if (!isSpeechRecognitionSupported()) {
    return <BrowserNotSupportedState />;
  }

  // Show permission error with retry option
  if (permissionError) {
    return (
      <PermissionErrorState
        error={permissionError}
        onRequestPermission={handleRequestPermission}
      />
    );
  }

  return (
    <main
      className="flex flex-col w-full h-full gap-9 text-4xl text-white bg-black font-semibold p-5 tracking-tight overflow-y-auto"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text"
    >
      <TranscriptHeader
        isListening={isListening}
        isFlipped={isTranscriptFlipped}
        onToggleFlip={toggleIsTranscriptFlipped}
      />

      <TranscriptDisplay
        transcript={transcript}
        interimTranscript={interimTranscript}
        isListening={isListening}
        isFlipped={isTranscriptFlipped}
        transcriptEndRef={transcriptEndRef}
      />
    </main>
  );
}
