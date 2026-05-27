import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  appStateSchema,
  DEFAULT_RECOGNITION_LANGUAGE_VALIDATED,
  type PermissionStatus,
  type RecognitionLanguage,
} from "@/lib/validation";
import { logger } from "@/lib/logger";

interface AppState {
  shouldListen: boolean;
  isTranscriptFlipped: boolean;
  recognitionLanguage: RecognitionLanguage;
  /** Shared across hooks/components — not persisted */
  micPermissionStatus: PermissionStatus;
  micPermissionError: string | null;
}

interface AppActions {
  setShouldListen: (shouldListen: boolean) => void;
  setIsTranscriptFlipped: (isTranscriptFlipped: boolean) => void;
  setRecognitionLanguage: (recognitionLanguage: RecognitionLanguage) => void;
  toggleIsTranscriptFlipped: () => void;
  setMicPermissionStatus: (status: PermissionStatus) => void;
  setMicPermissionError: (error: string | null) => void;
}

type AppStore = AppState & AppActions;

/**
 * Global app store using Zustand with persistence and devtools
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        shouldListen: false,
        isTranscriptFlipped: false,
        recognitionLanguage: DEFAULT_RECOGNITION_LANGUAGE_VALIDATED,
        micPermissionStatus: "unknown",
        micPermissionError: null,
        setShouldListen: (shouldListen: boolean) => set({ shouldListen }),
        setIsTranscriptFlipped: (isTranscriptFlipped: boolean) =>
          set({ isTranscriptFlipped }),
        setRecognitionLanguage: (recognitionLanguage: RecognitionLanguage) =>
          set({ recognitionLanguage }),
        toggleIsTranscriptFlipped: () =>
          set((state) => ({
            isTranscriptFlipped: !state.isTranscriptFlipped,
          })),
        setMicPermissionStatus: (micPermissionStatus: PermissionStatus) =>
          set({ micPermissionStatus }),
        setMicPermissionError: (micPermissionError: string | null) =>
          set({ micPermissionError }),
      }),
      {
        name: "aidme-app_preferences_v1",
        version: 1,
        partialize: (state) => ({
          isTranscriptFlipped: state.isTranscriptFlipped,
          recognitionLanguage: state.recognitionLanguage,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            try {
              appStateSchema.parse(state);
              logger.debug("Successfully validated persisted state");
            } catch (error) {
              logger.error("Invalid persisted state, resetting to defaults", error);
              state.isTranscriptFlipped = false;
              state.shouldListen = false;
              state.recognitionLanguage =
                DEFAULT_RECOGNITION_LANGUAGE_VALIDATED;
            }
          }
        },
      }
    ),
    {
      name: "app-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
