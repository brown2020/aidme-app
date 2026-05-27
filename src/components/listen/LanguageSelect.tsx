"use client";

import { memo } from "react";
import { RECOGNITION_LANGUAGES } from "@/lib/constants";
import { useAppStore } from "@/zustand/useAppStore";
import type { RecognitionLanguage } from "@/lib/validation";

interface LanguageSelectProps {
  /** Compact styling for the transcript toolbar */
  variant?: "toolbar" | "onboarding";
}

/**
 * Speech recognition language picker (BCP 47), persisted in Zustand
 */
export const LanguageSelect = memo(function LanguageSelect({
  variant = "toolbar",
}: LanguageSelectProps) {
  const { recognitionLanguage, setRecognitionLanguage } = useAppStore();

  const labelClass =
    variant === "onboarding"
      ? "text-lg text-gray-300"
      : "text-sm text-gray-400 sr-only sm:not-sr-only";

  const selectClass =
    variant === "onboarding"
      ? "w-full max-w-xs rounded-md bg-slate-800 text-white text-lg px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      : "rounded-md bg-slate-800 text-white text-sm px-2 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[10rem]";

  return (
    <div
      className={
        variant === "onboarding"
          ? "flex flex-col items-center gap-2 w-full"
          : "flex items-center gap-2"
      }
    >
      <label htmlFor="recognition-language" className={labelClass}>
        Output language
      </label>
      <select
        id="recognition-language"
        className={selectClass}
        value={recognitionLanguage}
        onChange={(e) =>
          setRecognitionLanguage(e.target.value as RecognitionLanguage)
        }
        aria-label="Transcription output language"
      >
        {RECOGNITION_LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
});
