import { create } from "zustand";

interface AppStore {
  shouldListen: boolean;
  setShouldListen: (shouldListen: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  shouldListen: false,
  setShouldListen: (shouldListen: boolean) => set({ shouldListen }),
}));
