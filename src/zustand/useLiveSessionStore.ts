import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sessionIdSchema } from "@/lib/liveSessionModel";
import { LIVE_SESSION_STORAGE_KEY } from "@/lib/firebase/config";

interface LiveSessionStore {
  /** Session currently receiving this device's transcript lines */
  activeSessionId: string | null;
  setActiveSessionId: (sessionId: string | null) => void;
}

/**
 * Tab-scoped so a reload keeps streaming to the same session, while a new tab
 * or device never writes to it by accident.
 */
export const useLiveSessionStore = create<LiveSessionStore>()(
  persist(
    (set) => ({
      activeSessionId: null,
      setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
    }),
    {
      name: LIVE_SESSION_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ activeSessionId: state.activeSessionId }),
      onRehydrateStorage: () => (state) => {
        if (state && !sessionIdSchema.safeParse(state.activeSessionId).success) {
          state.activeSessionId = null;
        }
      },
    }
  )
);
