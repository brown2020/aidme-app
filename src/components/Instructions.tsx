"use client";
import { useAppStore } from "@/zustand/useAppStore";
import { MicIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {};
export default function Instructions({}: Props) {
  const { shouldListen, setShouldListen } = useAppStore();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center mx-auto w-full h-full space-y-7 text-3xl text-white bg-black font-semibold p-5 tracking-tight max-w-lg">
      <div>
        Aid.me listens to nearby speakers and transcribes speech for you.
      </div>
      <div>Speakers must be closer than 6 feet and speak clearly.</div>
      <div>
        Click the microphone to begin. Allow microphone and speech transcription
        permissions.
      </div>

      <button
        className={`rounded-md text-white px-3 py-2 border mx-auto ${
          shouldListen ? "bg-red-500 animate-pulse" : "bg-slate-900"
        }`}
        onClick={() => {
          setShouldListen(true);
          router.push("/");
        }}
      >
        <MicIcon size={60} />
      </button>
    </div>
  );
}
