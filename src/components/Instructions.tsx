"use client";

import { Mic } from "lucide-react";
import { useStartListening } from "@/hooks/useStartListening";
import Alert from "./Alert";
import { Button } from "./ui/Button";
import Link from "next/link";
import { LiveShareButton } from "./live/LiveShareButton";
import { ERROR_MESSAGES } from "@/lib/constants";
import { isMicrophoneDenialMessage } from "@/lib/microphoneAccess";

/**
 * Instructions page component
 * Shows how to use the app and handles initial permission request
 */
export default function Instructions() {
  const { startListening, isSupported, permissionStatus, error, isStarting } =
    useStartListening({ navigateToHome: true });

  const isDisabled = isSupported !== true || isStarting;
  const visibleError =
    error ??
    (permissionStatus === "denied" ? ERROR_MESSAGES.MIC_DENIED : null);

  return (
    <main className="flex flex-col items-center justify-center mx-auto w-full h-full space-y-7 text-3xl text-white bg-black font-semibold p-5 tracking-tight max-w-lg overflow-y-auto">
      <h1 className="text-4xl mb-4">Aid.me</h1>
      <p>Aid.me listens to nearby speakers and transcribes speech for you.</p>
      <p>Speakers must be closer than 6 feet and speak clearly.</p>
      <p>
        Click the microphone to begin. Allow microphone and speech transcription
        permissions.
      </p>

      <p className="text-lg text-gray-400 text-center">
        Set output language and text size in{" "}
        <Link href="/settings" className="underline hover:text-white">
          Settings
        </Link>
        .
      </p>

      {isSupported === false && (
        <Alert variant="warning">
          Speech recognition is not supported in this browser. For best results,
          please use Chrome, Edge, or Safari.
        </Alert>
      )}

      {isStarting && (
        <p role="status" className="text-lg text-green-400">
          Starting…
        </p>
      )}

      {visibleError && <Alert variant="error">{visibleError}</Alert>}

      <Button
        variant="secondary"
        size="lg"
        className="mx-auto px-6 py-6"
        onClick={startListening}
        disabled={isDisabled}
        aria-busy={isStarting}
        aria-label="Start listening"
      >
        <Mic size={60} />
      </Button>

      <div className="flex justify-center">
        <LiveShareButton />
      </div>

      {isMicrophoneDenialMessage(visibleError) && (
        <p className="text-sm text-gray-400 mt-4">
          You&apos;ll need to reset microphone permissions in your browser
          settings to use Aid.me
        </p>
      )}
    </main>
  );
}
