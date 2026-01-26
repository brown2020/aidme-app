"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { HelpCircleIcon, MicIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStartListening } from "@/hooks/useStartListening";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { LISTENING_TIMEOUT_MS } from "@/lib/constants";
import { Button } from "./ui/Button";
import logo from "../assets/aidme.png";

/**
 * Main application header with microphone control and navigation
 * Handles auto-stop timeout and viewport height for mobile compatibility
 */
export default function Header() {
  const { toggleListening, stopListening, isListening, permissionStatus } =
    useStartListening({ navigateToHome: true });
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set CSS variable for viewport height (mobile browser compatibility)
  useViewportHeight();

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

  const micButtonVariant = permissionStatus === "denied" ? "danger" : "ghost";
  const micButtonClass = isListening ? "animate-pulse bg-red-500" : "";

  return (
    <header className="flex items-center justify-between bg-slate-500 h-16 shrink-0 px-5">
      <Button
        variant={micButtonVariant}
        size="md"
        className={micButtonClass}
        onClick={toggleListening}
        aria-label={isListening ? "Stop listening" : "Start listening"}
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
