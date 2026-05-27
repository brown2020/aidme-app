import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { appStateSchema, type PermissionStatus } from "@/lib/validation";
import { logger } from "@/lib/logger";

interface AppState {
  shouldListen: boolean;
  isTranscriptFlipped: boolean;
  /** Shared across hooks/components — not persisted */
  micPermissionStatus: PermissionStatus;
  micPermissionError: string | null;
}

interface AppActions {
  setShouldListen: (shouldListen: boolean) => void;
  setIsTranscriptFlipped: (isTranscriptFlipped: boolean) => void;
  toggleIsTranscriptFlipped: () => void;
  setMicPermissionStatus: (status: PermissionStatus) => void;
  setMicPermissionError: (error: string | null) => void;
}

type AppStore = AppState & AppActions;

/**
 * Global app store using Zustand with persistence and devtools
 * Uses Zod validation for persisted state to ensure type safety
 * 
 * Note: Only persists isTranscriptFlipped (user preference)
 * shouldListen is intentionally not persisted for security/UX
 * 
 * @example
 * const { shouldListen, setShouldListen } = useAppStore();
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        shouldListen: false,
        isTranscriptFlipped: false,
        micPermissionStatus: "unknown",
        micPermissionError: null,
        setShouldListen: (shouldListen: boolean) => set({ shouldListen }),
        setIsTranscriptFlipped: (isTranscriptFlipped: boolean) =>
          set({ isTranscriptFlipped }),
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
        }),
        // Validate persisted state on hydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            try {
              appStateSchema.parse(state);
              logger.debug("Successfully validated persisted state");
            } catch (error) {
              logger.error("Invalid persisted state, resetting to defaults", error);
              // Reset to defaults if validation fails
              state.isTranscriptFlipped = false;
              state.shouldListen = false;
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
