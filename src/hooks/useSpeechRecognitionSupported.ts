"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isSpeechRecognitionSupported } from "@/lib/speechRecognition";

/**
 * Client-safe speech recognition support check without hydration mismatch.
 * Returns `null` during SSR and before mount; then `true` or `false`.
 */
export function useSpeechRecognitionSupported(): boolean | null {
  const subscribe = useCallback(() => () => {}, []);

  const getSnapshot = useCallback(
    () => isSpeechRecognitionSupported(),
    []
  );

  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
