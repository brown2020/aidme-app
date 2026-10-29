import { ERROR_MESSAGES } from "./constants";
import type { PermissionStatus } from "./validation";

/** Why a microphone request did not start capturing audio. */
export type MicrophoneFailureReason = "denied" | "unavailable" | "failed" | "timeout";

/** Thrown when getUserMedia or recognition start stays pending past the limit. */
export class MicrophoneStartTimeoutError extends Error {
  constructor() {
    super("Microphone start timed out");
    this.name = "MicrophoneStartTimeoutError";
  }
}

export type MicrophoneAccessResult =
  | { granted: true }
  | { granted: false; reason: MicrophoneFailureReason };

const DENIED_NAMES = new Set([
  "NotAllowedError",
  "PermissionDeniedError",
  "SecurityError",
]);

const UNAVAILABLE_NAMES = new Set([
  "NotFoundError",
  "DevicesNotFoundError",
  "OverconstrainedError",
  "ConstraintNotSatisfiedError",
  "NotReadableError",
  "TrackStartError",
  "AbortError",
]);

function errorName(error: unknown): string {
  if (typeof error === "object" && error !== null && "name" in error) {
    const name = (error as { name: unknown }).name;
    if (typeof name === "string") return name;
  }
  return "";
}

/**
 * Map a getUserMedia rejection to a user-facing reason.
 * A missing device is not a permission denial.
 */
export function classifyMicrophoneFailure(
  error: unknown
): MicrophoneFailureReason {
  const name = errorName(error);
  if (name === "MicrophoneStartTimeoutError") return "timeout";
  if (DENIED_NAMES.has(name)) return "denied";
  if (UNAVAILABLE_NAMES.has(name)) return "unavailable";
  return "failed";
}

/**
 * Race a promise against a deadline. A late success is reported so the caller
 * can stop a microphone stream that arrived after the user already saw an error.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onLate?: (value: T) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new MicrophoneStartTimeoutError());
    }, ms);

    promise.then(
      (value) => {
        if (settled) {
          onLate?.(value);
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export type AudioInputPresence = "present" | "absent" | "unknown";

/** `absent` only when the browser successfully listed devices and none are mics. */
export function audioInputPresence(
  devices: Array<{ kind: string }> | null
): AudioInputPresence {
  if (!devices) return "unknown";
  return devices.some((device) => device.kind === "audioinput")
    ? "present"
    : "absent";
}

/**
 * Map a recognition lifecycle event to a user-facing failure.
 * Silence after a real start is not a failure: recognition restarts on `onend`.
 * `no-speech`, `onend`, or a timeout before `onstart` means capture never began.
 */
export function recognitionStartupFailure(input: {
  type: "error" | "end" | "timeout";
  code?: string;
  hasStarted: boolean;
}): MicrophoneFailureReason | null {
  if (input.type === "error") {
    if (input.code === "not-allowed") return "denied";
    if (input.code === "audio-capture") return "unavailable";
    if (input.code === "no-speech" && !input.hasStarted) return "unavailable";
    return null;
  }

  if (input.hasStarted) return null;
  return "timeout";
}

export function microphoneFailureMessage(
  reason: MicrophoneFailureReason
): string {
  switch (reason) {
    case "denied":
      return ERROR_MESSAGES.MIC_NOT_ALLOWED;
    case "unavailable":
      return ERROR_MESSAGES.MIC_UNAVAILABLE;
    case "timeout":
      return ERROR_MESSAGES.MIC_START_FAILED;
    default:
      return ERROR_MESSAGES.MIC_PERMISSION_ERROR;
  }
}

export function isMicrophoneDenialMessage(error: string | null): boolean {
  return (
    error === ERROR_MESSAGES.MIC_DENIED || error === ERROR_MESSAGES.MIC_NOT_ALLOWED
  );
}

export function isMicrophoneUnavailableMessage(error: string | null): boolean {
  return error === ERROR_MESSAGES.MIC_UNAVAILABLE;
}

/**
 * Merge a Permissions API result with an error already shown to the user.
 * "granted" means the site may use a microphone, not that one is plugged in,
 * so a missing-device (or other specific) failure stays until getUserMedia works.
 * A denied query fills in MIC_DENIED only when nothing more specific is set.
 */
export function errorAfterPermissionQuery(
  queryStatus: PermissionStatus,
  currentError: string | null
): string | null {
  if (queryStatus === "denied") {
    return currentError ?? ERROR_MESSAGES.MIC_DENIED;
  }

  if (queryStatus === "granted") {
    if (
      currentError === null ||
      currentError === ERROR_MESSAGES.MIC_DENIED ||
      currentError === ERROR_MESSAGES.MIC_NOT_ALLOWED
    ) {
      return null;
    }
    return currentError;
  }

  return currentError;
}

/** Short header label for the current mic attempt. Full sentences live in alerts. */
export function microphoneStatusLabel(input: {
  isStarting: boolean;
  isListening: boolean;
  error: string | null;
  permissionStatus: PermissionStatus;
}): string | null {
  if (input.isStarting) return "Starting…";
  if (input.isListening) return "Listening";
  if (isMicrophoneUnavailableMessage(input.error)) return "No microphone";
  if (input.error === ERROR_MESSAGES.MIC_START_FAILED) return "Didn't start";
  if (
    input.permissionStatus === "denied" ||
    isMicrophoneDenialMessage(input.error)
  ) {
    return "Mic blocked";
  }
  if (input.error) return "Mic error";
  return null;
}
