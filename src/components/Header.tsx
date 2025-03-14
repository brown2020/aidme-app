"use client";
import { useAppStore } from "@/zustand/useAppStore";
import { HelpCircleIcon, MicIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../assets/aidme.png";
import { useEffect, useRef, useState } from "react";
import { requestMicrophonePermission } from "@/hooks/useListening";

export default function Header() {
  const { shouldListen, setShouldListen } = useAppStore();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (shouldListen) {
      timeoutRef.current = setTimeout(() => {
        setShouldListen(false);
      }, 30 * 60 * 1000); // 30 minutes
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldListen, setShouldListen]);

  const handleMicToggle = async () => {
    if (!shouldListen) {
      // If we're turning on the mic, check permissions first
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setPermissionDenied(true);
        // Show alert and don't toggle
        alert(
          "Microphone access was denied. Please allow microphone access in your browser settings."
        );
        return;
      }
      setPermissionDenied(false);
    }

    setShouldListen(!shouldListen);
    router.push("/");
  };

  const handleRefresh = () => {
    // Check if the app is running in a React Native WebView
    if (window.ReactNativeWebView) {
      // Post a message to the React Native WebView
      window.ReactNativeWebView.postMessage("refresh");
    } else {
      console.log("Not React Native WebView environment");
    }
  };

  useEffect(() => {
    function adjustHeight() {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    }

    window.addEventListener("resize", adjustHeight);
    window.addEventListener("orientationchange", adjustHeight);

    // Initial adjustment
    adjustHeight();

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustHeight);
      window.removeEventListener("orientationchange", adjustHeight);
    };
  }, []);

  return (
    <div className="flex items-center justify-between bg-slate-500 h-16 shrink-0 px-5">
      <button
        className={`rounded-md text-white px-3 py-2 ${
          shouldListen
            ? "bg-red-500 animate-pulse"
            : permissionDenied
            ? "bg-yellow-600"
            : "bg-slate-900"
        }`}
        onClick={handleMicToggle}
        aria-label={shouldListen ? "Stop listening" : "Start listening"}
      >
        <MicIcon size={24} />
      </button>
      <button onClick={() => handleRefresh()}>
        <Image
          src={logo}
          alt="logo"
          className="h-10 w-10 invert"
          width={40}
          height={40}
          priority
        />
      </button>
      <button
        className={`rounded-md text-white`}
        onClick={() => router.push("/about")}
      >
        <HelpCircleIcon size={32} />
      </button>
    </div>
  );
}
