"use client";
import { useAppStore } from "@/zustand/useAppStore";
import { MicIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Instructions() {
  const { shouldListen, setShouldListen } = useAppStore();
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center mx-auto w-full h-full space-y-7 text-3xl text-white bg-black font-semibold p-5 tracking-tight max-w-lg">
      <h1 className="text-4xl mb-4">Aid.me</h1>
      <p>Aid.me listens to nearby speakers and transcribes speech for you.</p>
      <p>Speakers must be closer than 6 feet and speak clearly.</p>
      <p>
        Click the microphone to begin. Allow microphone and speech transcription
        permissions.
      </p>

      <button
        className={`rounded-md text-white px-3 py-2 border mx-auto ${
          shouldListen ? "bg-red-500 animate-pulse" : "bg-slate-900"
        }`}
        onClick={() => {
          setShouldListen(true);
          console.log("shouldListen", shouldListen);
          router.push("/");
        }}
        aria-label="Start listening"
      >
        <MicIcon size={60} />
      </button>
    </main>
  );
}
