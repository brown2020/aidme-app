import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AppState {
  shouldListen: boolean;
  isTranscriptFlipped: boolean;
}

interface AppActions {
  setShouldListen: (shouldListen: boolean) => void;
  setIsTranscriptFlipped: (isTranscriptFlipped: boolean) => void;
  toggleIsTranscriptFlipped: () => void;
}

type AppStore = AppState & AppActions;

// Devtools middleware has minimal overhead in production and
// provides useful debugging capabilities in development
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        shouldListen: false,
        isTranscriptFlipped: false,
        setShouldListen: (shouldListen: boolean) => set({ shouldListen }),
        setIsTranscriptFlipped: (isTranscriptFlipped: boolean) =>
          set({ isTranscriptFlipped }),
        toggleIsTranscriptFlipped: () =>
          set((state) => ({
            isTranscriptFlipped: !state.isTranscriptFlipped,
          })),
      }),
      {
        name: "aidme-preferences",
        version: 1,
        partialize: (state) => ({
          isTranscriptFlipped: state.isTranscriptFlipped,
        }),
      }
    ),
    {
      name: "app-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
