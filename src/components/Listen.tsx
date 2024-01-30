"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/zustand/useAppStore";
import { ScaleLoader } from "react-spinners";
import Instructions from "./Instructions";

export default function Listen() {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const { shouldListen } = useAppStore();
  const [isListening, setIsListening] = useState<boolean>(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newInterimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript.trim();

        if (event.results[i].isFinal) {
          const finalTranscript =
            transcriptPart.charAt(0).toUpperCase() +
            transcriptPart.slice(1) +
            ".";

          setTranscript((currentTranscript) => {
            const updatedTranscript = [...currentTranscript, finalTranscript];
            return updatedTranscript.slice(-200);
          });

          setInterimTranscript("");
          newInterimTranscript = "";
        } else {
          newInterimTranscript += transcriptPart + " ";
          setInterimTranscript(newInterimTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.log("Speech Recognition Error:", event.error);
      restartRecognition();
    };

    recognition.onspeechend = () => {
      console.log("Speech has ended");
      restartRecognition();
    };

    recognition.onsoundend = () => {
      console.log("Sound has ended");
      restartRecognition();
    };

    const restartRecognition = () => {
      console.log("Stopping recognition");
      recognitionRef.current?.stop();
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      restartRecognition();
    };

    if (shouldListen && !isListening) {
      console.log("Starting recognition");
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 100);
      setIsListening(true);
    } else if (!shouldListen && isListening) {
      console.log("Stopping recognition");
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.onresult = () => {};
        recognitionRef.current.stop();
      }
    };
  }, [shouldListen, isListening]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, interimTranscript]);

  if (!shouldListen && transcript.length === 0) return <Instructions />;

  return (
    <div className="flex flex-col w-full h-full space-y-9 text-4xl text-white bg-black font-semibold p-5 tracking-tight">
      {transcript.map((sentence, index) => (
        <p key={index}>{sentence}</p>
      ))}
      {interimTranscript && <div>{interimTranscript}</div>}
      {!interimTranscript && shouldListen && (
        <div>
          <ScaleLoader color="#ffffff" />
        </div>
      )}
      <div className="h-14 w-full opacity-0" ref={transcriptRef}>
        footer
      </div>
    </div>
  );
}
