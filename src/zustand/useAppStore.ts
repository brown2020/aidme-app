import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AppState {
  shouldListen: boolean;
}

interface AppActions {
  setShouldListen: (shouldListen: boolean) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      shouldListen: false,
      setShouldListen: (shouldListen: boolean) => set({ shouldListen }),
    }),
    {
      name: "app-store",
    }
  )
);
