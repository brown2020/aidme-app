import { create } from "zustand";
import type { User } from "firebase/auth";

/** "unknown" until Firebase reports the restored session on first load */
export type AuthStatus = "unknown" | "signedOut" | "signedIn";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  usesPassword: boolean;
  usesGoogle: boolean;
}

interface AuthStore {
  status: AuthStatus;
  user: AuthUser | null;
  setFirebaseUser: (user: User | null) => void;
}

export function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    usesPassword: user.providerData.some((p) => p.providerId === "password"),
    usesGoogle: user.providerData.some((p) => p.providerId === "google.com"),
  };
}

/** Mirrors Firebase Auth state for rendering. Firestore rules remain the access authority. */
export const useAuthStore = create<AuthStore>()((set) => ({
  status: "unknown",
  user: null,
  setFirebaseUser: (user) =>
    set(
      user
        ? { status: "signedIn", user: toAuthUser(user) }
        : { status: "signedOut", user: null }
    ),
}));
