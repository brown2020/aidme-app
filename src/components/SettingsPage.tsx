"use client";

import { MIC_TOGGLE_SHORTCUT_LABEL } from "@/lib/constants";
import { LanguageSelect } from "./listen/LanguageSelect";
import { CaptionSizeSelect } from "./listen/CaptionSizeSelect";

/**
 * App settings: output language, caption size, and shortcuts
 */
export default function SettingsPage() {
  return (
    <div className="text-wrapper text-white">
      <h3>Settings</h3>

      <p className="text-gray-300">
        Preferences apply to live transcription and are saved on this device.
      </p>

      <section className="flex flex-col gap-6 max-w-md">
        <LanguageSelect variant="onboarding" />
        <CaptionSizeSelect />
      </section>

      <section className="space-y-2">
        <h4>Keyboard shortcut</h4>
        <p className="text-gray-300">
          Press <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600">
            {MIC_TOGGLE_SHORTCUT_LABEL}
          </kbd>{" "}
          (when not typing in a field) to start or stop listening from any page.
        </p>
      </section>
    </div>
  );
}
