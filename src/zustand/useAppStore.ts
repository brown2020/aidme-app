import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AppState {
  shouldListen: boolean;
}

interface AppActions {
  setShouldListen: (shouldListen: boolean) => void;
}

type AppStore = AppState & AppActions;

// Devtools middleware has minimal overhead in production and
// provides useful debugging capabilities in development
export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      shouldListen: false,
      setShouldListen: (shouldListen: boolean) => set({ shouldListen }),
    }),
    {
      name: "app-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
