"use client";
import { useAppStore } from "@/zustand/useAppStore";
import { AlertTriangle, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
} from "@/hooks/useListening";

export default function Instructions() {
  const { shouldListen, setShouldListen } = useAppStore();
  const router = useRouter();
  const [isBrowserSupported, setIsBrowserSupported] = useState<boolean | null>(
    null
  );
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsBrowserSupported(isSpeechRecognitionSupported());

      // Check if we can access permission status
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: "microphone" as PermissionName })
          .then((permissionStatus) => {
            setPermissionStatus(
              permissionStatus.state as "granted" | "denied" | "prompt"
            );

            // Listen for changes to permission status
            permissionStatus.onchange = () => {
              setPermissionStatus(
                permissionStatus.state as "granted" | "denied" | "prompt"
              );
            };
          })
          .catch((error) => {
            console.error("Error checking permission status:", error);
          });
      }
    }
  }, []);

  const handleStartListening = async () => {
    if (!isBrowserSupported) return;

    if (permissionStatus === "denied") {
      alert(
        "Microphone access is blocked. Please allow microphone access in your browser settings."
      );
      return;
    }

    // If permission status is unknown or prompt, request permission
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
        <div className="p-4 mb-4 text-sm text-yellow-500 bg-yellow-100 rounded-lg dark:bg-yellow-900 dark:text-yellow-100 flex items-center">
          <AlertTriangle className="mr-2" />
          <p>
            Speech recognition is not supported in this browser. For best
            results, please use Chrome, Edge, or Safari.
          </p>
        </div>
      )}

      {permissionStatus === "denied" && (
        <div className="p-4 mb-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100 flex items-center">
          <AlertTriangle className="mr-2" />
          <p>
            Microphone access is blocked. Please allow microphone access in your
            browser settings.
          </p>
        </div>
      )}

      <button
        className={`rounded-md text-white px-3 py-2 border mx-auto flex items-center justify-center ${
          shouldListen ? "bg-red-500 animate-pulse" : "bg-slate-900"
        } ${
          isBrowserSupported === false ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleStartListening}
        disabled={isBrowserSupported === false}
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
