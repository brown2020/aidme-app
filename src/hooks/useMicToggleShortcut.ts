"use client";

import { useEffect } from "react";
import {
  isMicToggleShortcutKey,
  shouldIgnoreKeyboardShortcut,
} from "@/lib/keyboard";

interface UseMicToggleShortcutOptions {
  /** When false, the listener is not attached */
  enabled?: boolean;
  /** When true, shortcut is ignored (e.g. async toggle in progress) */
  disabled?: boolean;
}

/**
 * Listens for Space to toggle listening when focus is not in a form control.
 */
export function useMicToggleShortcut(
  toggleListening: () => Promise<void>,
  options: UseMicToggleShortcutOptions = {}
): void {
  const { enabled = true, disabled = false } = options;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || !isMicToggleShortcutKey(event)) return;
      if (shouldIgnoreKeyboardShortcut(event.target)) return;

      event.preventDefault();
      void toggleListening();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleListening, enabled, disabled]);
}
