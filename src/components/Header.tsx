"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { HelpCircleIcon, MicIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStartListening } from "@/hooks/useStartListening";
import { useMicToggleShortcut } from "@/hooks/useMicToggleShortcut";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import {
  LISTENING_TIMEOUT_MS,
  MIC_TOGGLE_SHORTCUT_LABEL,
} from "@/lib/constants";
import { Button } from "./ui/Button";
import logo from "../assets/aidme.png";

/**
 * Main application header with microphone control and navigation
 * Handles auto-stop timeout and viewport height for mobile compatibility
 */
export default function Header() {
  const {
    toggleListening,
    stopListening,
    isListening,
    isStarting,
    permissionStatus,
  } = useStartListening({ navigateToHome: true });
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set CSS variable for viewport height (mobile browser compatibility)
  useViewportHeight();

  useMicToggleShortcut(toggleListening, { disabled: isStarting });

  // Auto-stop listening after timeout
  useEffect(() => {
    if (!isListening) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      stopListening();
    }, LISTENING_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isListening, stopListening]);

  // Determine button variant based on state
  // Priority: listening (recording/green) > denied (danger/red) > default (ghost)
  const getMicButtonVariant = () => {
    if (isListening) return "recording";
    if (permissionStatus === "denied") return "danger";
    return "ghost";
  };

  return (
    <header className="flex items-center justify-between bg-slate-500 h-16 shrink-0 px-5">
      <Button
        variant={getMicButtonVariant()}
        size="md"
        onClick={toggleListening}
        disabled={isStarting}
        aria-label={
          isListening
            ? `Stop listening (${MIC_TOGGLE_SHORTCUT_LABEL} shortcut)`
            : `Start listening (${MIC_TOGGLE_SHORTCUT_LABEL} shortcut)`
        }
        aria-keyshortcuts={MIC_TOGGLE_SHORTCUT_LABEL}
        title={`Toggle listening (${MIC_TOGGLE_SHORTCUT_LABEL})`}
        aria-busy={isStarting}
      >
        <MicIcon size={24} />
      </Button>

      <button
        onClick={() => window.ReactNativeWebView?.postMessage("refresh")}
        aria-label="Aid.me home"
      >
        <Image
          src={logo}
          alt="Aid.me logo"
          className="h-10 w-10 invert"
          width={40}
          height={40}
          priority
        />
      </button>

      <Button
        variant="ghost"
        size="md"
        onClick={() => router.push("/about")}
        aria-label="Help and instructions"
      >
        <HelpCircleIcon size={32} />
      </Button>
    </header>
  );
}
