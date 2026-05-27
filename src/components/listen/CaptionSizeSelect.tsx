"use client";

import { memo } from "react";
import { CAPTION_SIZES } from "@/lib/constants";
import { useAppStore } from "@/zustand/useAppStore";
import type { CaptionSize } from "@/lib/validation";

/**
 * Persisted caption text size control for the transcript view
 */
export const CaptionSizeSelect = memo(function CaptionSizeSelect() {
  const { captionSize, setCaptionSize } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="caption-size"
        className="text-sm text-gray-400 sr-only sm:not-sr-only"
      >
        Text size
      </label>
      <select
        id="caption-size"
        className="rounded-md bg-slate-800 text-white text-sm px-2 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[7rem]"
        value={captionSize}
        onChange={(e) => setCaptionSize(e.target.value as CaptionSize)}
        aria-label="Caption text size"
      >
        {CAPTION_SIZES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
});
