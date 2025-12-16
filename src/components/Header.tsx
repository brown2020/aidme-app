"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { HelpCircleIcon, MicIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStartListening } from "@/hooks/useStartListening";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { LISTENING_TIMEOUT_MS } from "@/lib/constants";
import logo from "../assets/aidme.png";

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

  const micButtonClass =
    permissionStatus === "denied"
      ? "bg-yellow-600"
      : isListening
      ? "bg-red-500 animate-pulse"
      : "bg-slate-900";

  return (
    <header className="flex items-center justify-between bg-slate-500 h-16 shrink-0 px-5">
      <button
        className={`rounded-md text-white px-3 py-2 ${micButtonClass}`}
        onClick={toggleListening}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        <MicIcon size={24} />
      </button>

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

      <button
        className="rounded-md text-white"
        onClick={() => router.push("/about")}
        aria-label="Help and instructions"
      >
        <HelpCircleIcon size={32} />
      </button>
    </header>
  );
}
