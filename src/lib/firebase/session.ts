import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { SIGNED_IN_HINT_KEY } from "./config";

/** Subscribes to Firebase Auth and keeps the signed-in hint in sync */
export function watchAuth(onUser: (user: User | null) => void): () => void {
  return onIdTokenChanged(getFirebaseAuth(), (user) => {
    if (user) window.localStorage.setItem(SIGNED_IN_HINT_KEY, "1");
    else window.localStorage.removeItem(SIGNED_IN_HINT_KEY);
    onUser(user);
  });
}
