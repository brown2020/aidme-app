"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Page origin, or "" during server render */
export function useOrigin(): string {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => "");
}

/**
 * True inside the Aid Hearing iOS wrapper. Google blocks its sign-in page in
 * embedded web views, so callers hide Google sign-in there.
 */
export function useIsNativeWebView(): boolean {
  return useSyncExternalStore(subscribe, () => Boolean(window.ReactNativeWebView), () => false);
}

/** True when the Web Share API (phone share sheet) is available */
export function useCanNativeShare(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof navigator.share === "function",
    () => false
  );
}
