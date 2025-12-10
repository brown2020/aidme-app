"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { useAppStore } from "@/zustand/useAppStore";
import {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
} from "@/hooks/useListening";
import Alert from "./Alert";

type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

export default function Instructions() {
  const { shouldListen, setShouldListen } = useAppStore();
  const router = useRouter();
  const [isBrowserSupported, setIsBrowserSupported] = useState<boolean | null>(
    null
  );
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsBrowserSupported(isSpeechRecognitionSupported());

    // Check microphone permission status if available
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        setPermissionStatus(result.state as PermissionStatus);
        result.onchange = () =>
          setPermissionStatus(result.state as PermissionStatus);
      })
      .catch(() => {
        // Permission API not supported, leave as unknown
      });
  }, []);

  const handleStartListening = async () => {
    if (!isBrowserSupported) return;

    if (permissionStatus === "denied") {
      alert(
        "Microphone access is blocked. Please allow microphone access in your browser settings."
      );
      return;
    }

    if (permissionStatus !== "granted") {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        alert(
          "Microphone access was denied. Aid.me needs microphone access to work."
        );
        return;
      }
    }

    setShouldListen(true);
    router.push("/");
  };

  const isDisabled = isBrowserSupported === false;

  return (
    <main className="flex flex-col items-center justify-center mx-auto w-full h-full space-y-7 text-3xl text-white bg-black font-semibold p-5 tracking-tight max-w-lg">
      <h1 className="text-4xl mb-4">Aid.me</h1>
      <p>Aid.me listens to nearby speakers and transcribes speech for you.</p>
      <p>Speakers must be closer than 6 feet and speak clearly.</p>
      <p>
        Click the microphone to begin. Allow microphone and speech transcription
        permissions.
      </p>

      {isBrowserSupported === false && (
        <Alert variant="warning">
          Speech recognition is not supported in this browser. For best results,
          please use Chrome, Edge, or Safari.
        </Alert>
      )}

      {permissionStatus === "denied" && (
        <Alert variant="error">
          Microphone access is blocked. Please allow microphone access in your
          browser settings.
        </Alert>
      )}

      <button
        className={`rounded-md text-white px-3 py-2 border mx-auto flex items-center justify-center ${
          shouldListen ? "bg-red-500 animate-pulse" : "bg-slate-900"
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleStartListening}
        disabled={isDisabled}
        aria-label="Start listening"
      >
        <Mic size={60} />
      </button>

      {permissionStatus === "denied" && (
        <p className="text-sm text-gray-400 mt-4">
          You&apos;ll need to reset microphone permissions in your browser
          settings to use Aid.me
        </p>
      )}
    </main>
  );
}
