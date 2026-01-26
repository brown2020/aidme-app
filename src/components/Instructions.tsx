"use client";

import { Mic } from "lucide-react";
import { useStartListening } from "@/hooks/useStartListening";
import Alert from "./Alert";
import { Button } from "./ui/Button";

/**
 * Instructions page component
 * Shows how to use the app and handles initial permission request
 */
export default function Instructions() {
  const { startListening, isSupported, permissionStatus, error } =
    useStartListening({ navigateToHome: true });

  const isDisabled = !isSupported;

  return (
    <main className="flex flex-col items-center justify-center mx-auto w-full h-full space-y-7 text-3xl text-white bg-black font-semibold p-5 tracking-tight max-w-lg overflow-y-auto">
      <h1 className="text-4xl mb-4">Aid.me</h1>
      <p>Aid.me listens to nearby speakers and transcribes speech for you.</p>
      <p>Speakers must be closer than 6 feet and speak clearly.</p>
      <p>
        Click the microphone to begin. Allow microphone and speech transcription
        permissions.
      </p>

      {!isSupported && (
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

      {error && permissionStatus !== "denied" && (
        <Alert variant="error">{error}</Alert>
      )}

      <Button
        variant="secondary"
        size="lg"
        className="mx-auto px-6 py-6"
        onClick={startListening}
        disabled={isDisabled}
        aria-label="Start listening"
      >
        <Mic size={60} />
      </Button>

      {permissionStatus === "denied" && (
        <p className="text-sm text-gray-400 mt-4">
          You&apos;ll need to reset microphone permissions in your browser
          settings to use Aid.me
        </p>
      )}
    </main>
  );
}
