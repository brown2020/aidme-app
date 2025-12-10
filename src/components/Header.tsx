"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HelpCircleIcon, MicIcon } from "lucide-react";
import { useAppStore } from "@/zustand/useAppStore";
import { requestMicrophonePermission } from "@/hooks/useListening";
import { LISTENING_TIMEOUT_MS } from "@/lib/constants";
import logo from "../assets/aidme.png";

export default function Header() {
  const { shouldListen, setShouldListen } = useAppStore();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  // Auto-stop listening after timeout
  useEffect(() => {
    if (!shouldListen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setShouldListen(false);
    }, LISTENING_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [shouldListen, setShouldListen]);

  // Set CSS variable for viewport height (mobile browser compatibility)
  useEffect(() => {
    const updateViewportHeight = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  const handleMicToggle = useCallback(async () => {
    if (!shouldListen) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setHasPermissionError(true);
        alert(
          "Microphone access was denied. Please allow microphone access in your browser settings."
        );
        return;
      }
      setHasPermissionError(false);
    }

    setShouldListen(!shouldListen);
    router.push("/");
  }, [shouldListen, setShouldListen, router]);

  const handleLogoClick = useCallback(() => {
    // Post message to React Native WebView if running in that context
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage("refresh");
    }
  }, []);

  const micButtonClass = hasPermissionError
    ? "bg-yellow-600"
    : shouldListen
    ? "bg-red-500 animate-pulse"
    : "bg-slate-900";

  return (
    <header className="flex items-center justify-between bg-slate-500 h-16 shrink-0 px-5">
      <button
        className={`rounded-md text-white px-3 py-2 ${micButtonClass}`}
        onClick={handleMicToggle}
        aria-label={shouldListen ? "Stop listening" : "Start listening"}
      >
        <MicIcon size={24} />
      </button>

      <button onClick={handleLogoClick} aria-label="Aid.me home">
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
