/**
 * Whether the tab should drop its active live-share id.
 * A missing, ended, or unauthorized session stops. A parse failure or a
 * retryable listener error does not, or viewers are left on a live session
 * that no longer receives captions.
 */
export function activeSessionStopReason(input: {
  exists: boolean;
  session: { status: string; ownerUid: string } | null;
  uid: string;
  errorCode?: string;
}): "stop" | "keep" {
  if (input.errorCode) {
    return input.errorCode === "permission-denied" || input.errorCode === "unauthenticated"
      ? "stop"
      : "keep";
  }
  if (!input.exists) return "stop";
  if (!input.session) return "keep";
  if (input.session.status !== "live" || input.session.ownerUid !== input.uid) return "stop";
  return "keep";
}
