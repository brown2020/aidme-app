"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { MicIcon, Settings } from "lucide-react";
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

  useViewportHeight();
  useMicToggleShortcut(toggleListening, { disabled: isStarting });

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
        type="button"
        onClick={() => router.push("/about")}
        className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="About Aid.me"
      >
        <Image
          src={logo}
          alt=""
          className="h-10 w-10 invert"
          width={40}
          height={40}
          priority
        />
      </button>

      <Button
        variant="ghost"
        size="md"
        onClick={() => router.push("/settings")}
        aria-label="Settings"
      >
        <Settings size={28} />
      </Button>
    </header>
  );
}
