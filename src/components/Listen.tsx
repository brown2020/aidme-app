"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/zustand/useAppStore";
import { ScaleLoader } from "react-spinners";
import Instructions from "./Instructions";
import useListening from "@/hooks/useListening";

export default function Listen() {
  const { shouldListen } = useAppStore();
  const { transcript, interimTranscript, isListening } =
    useListening(shouldListen);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, interimTranscript]);

  if (!shouldListen && transcript.length === 0) return <Instructions />;

  return (
    <main
      className="flex flex-col w-full h-full space-y-9 text-4xl text-white bg-black font-semibold p-5 tracking-tight"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text"
    >
      {transcript.map((sentence, index) => (
        <p key={index}>{sentence}</p>
      ))}
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
