import { describe, expect, it } from "vitest";
import { ERROR_MESSAGES } from "./constants";
import {
  audioInputPresence,
  classifyMicrophoneFailure,
  errorAfterPermissionQuery,
  microphoneFailureMessage,
  microphoneStatusLabel,
  recognitionStartupFailure,
} from "./microphoneAccess";

describe("classifyMicrophoneFailure", () => {
  it("treats permission rejections as denied", () => {
    expect(
      classifyMicrophoneFailure(
        new DOMException("Permission denied", "NotAllowedError")
      )
    ).toBe("denied");
    expect(
      classifyMicrophoneFailure(new DOMException("blocked", "SecurityError"))
    ).toBe("denied");
  });

  it("treats a missing or unusable device as unavailable", () => {
    expect(
      classifyMicrophoneFailure(
        new DOMException("Requested device not found", "NotFoundError")
      )
    ).toBe("unavailable");
    expect(
      classifyMicrophoneFailure(
        new DOMException("Could not start", "NotReadableError")
      )
    ).toBe("unavailable");
    expect(
      classifyMicrophoneFailure({ name: "DevicesNotFoundError" })
    ).toBe("unavailable");
  });

  it("treats unknown failures as failed", () => {
    expect(classifyMicrophoneFailure(new Error("nope"))).toBe("failed");
    expect(classifyMicrophoneFailure("nope")).toBe("failed");
  });

  it("treats a start deadline as a timeout", () => {
    const error = new Error("Microphone start timed out");
    error.name = "MicrophoneStartTimeoutError";
    expect(classifyMicrophoneFailure(error)).toBe("timeout");
  });
});

describe("audioInputPresence", () => {
  it("is absent only when the list contains no audio input", () => {
    expect(audioInputPresence([])).toBe("absent");
    expect(audioInputPresence([{ kind: "videoinput" }])).toBe("absent");
    expect(audioInputPresence([{ kind: "audioinput" }])).toBe("present");
    expect(audioInputPresence(null)).toBe("unknown");
  });
});

describe("recognitionStartupFailure", () => {
  it("maps not-allowed, audio-capture, and no-speech before start", () => {
    expect(
      recognitionStartupFailure({
        type: "error",
        code: "not-allowed",
        hasStarted: false,
      })
    ).toBe("denied");
    expect(
      recognitionStartupFailure({
        type: "error",
        code: "audio-capture",
        hasStarted: true,
      })
    ).toBe("unavailable");
    expect(
      recognitionStartupFailure({
        type: "error",
        code: "no-speech",
        hasStarted: false,
      })
    ).toBe("unavailable");
  });

  it("lets silence after a real start restart instead of failing", () => {
    expect(
      recognitionStartupFailure({
        type: "error",
        code: "no-speech",
        hasStarted: true,
      })
    ).toBeNull();
  });

  it("treats onend and a deadline before onstart as a failed start", () => {
    expect(
      recognitionStartupFailure({ type: "end", hasStarted: false })
    ).toBe("timeout");
    expect(
      recognitionStartupFailure({ type: "timeout", hasStarted: false })
    ).toBe("timeout");
    expect(recognitionStartupFailure({ type: "end", hasStarted: true })).toBeNull();
  });
});

describe("microphoneFailureMessage", () => {
  it("uses the denial and missing-mic copy", () => {
    expect(microphoneFailureMessage("denied")).toBe(ERROR_MESSAGES.MIC_NOT_ALLOWED);
    expect(microphoneFailureMessage("unavailable")).toBe(
      ERROR_MESSAGES.MIC_UNAVAILABLE
    );
    expect(microphoneFailureMessage("timeout")).toBe(
      ERROR_MESSAGES.MIC_START_FAILED
    );
    expect(microphoneFailureMessage("failed")).toBe(
      ERROR_MESSAGES.MIC_PERMISSION_ERROR
    );
  });
});

describe("errorAfterPermissionQuery", () => {
  it("keeps a missing-mic error when the site permission is granted", () => {
    expect(
      errorAfterPermissionQuery("granted", ERROR_MESSAGES.MIC_UNAVAILABLE)
    ).toBe(ERROR_MESSAGES.MIC_UNAVAILABLE);
  });

  it("clears a stale denial once the browser reports access is granted", () => {
    expect(
      errorAfterPermissionQuery("granted", ERROR_MESSAGES.MIC_NOT_ALLOWED)
    ).toBeNull();
    expect(errorAfterPermissionQuery("granted", null)).toBeNull();
  });

  it("sets a denial message only when the query is denied and none is showing", () => {
    expect(errorAfterPermissionQuery("denied", null)).toBe(
      ERROR_MESSAGES.MIC_DENIED
    );
    expect(
      errorAfterPermissionQuery("denied", ERROR_MESSAGES.MIC_UNAVAILABLE)
    ).toBe(ERROR_MESSAGES.MIC_UNAVAILABLE);
  });

  it("leaves the current error alone while permission is still a prompt", () => {
    expect(
      errorAfterPermissionQuery("prompt", ERROR_MESSAGES.MIC_UNAVAILABLE)
    ).toBe(ERROR_MESSAGES.MIC_UNAVAILABLE);
  });
});

describe("microphoneStatusLabel", () => {
  const base = {
    isStarting: false,
    isListening: false,
    error: null,
    permissionStatus: "unknown" as const,
  };

  it("prefers the in-progress and listening labels", () => {
    expect(microphoneStatusLabel({ ...base, isStarting: true })).toBe(
      "Starting…"
    );
    expect(
      microphoneStatusLabel({
        ...base,
        isStarting: true,
        isListening: true,
      })
    ).toBe("Starting…");
    expect(microphoneStatusLabel({ ...base, isListening: true })).toBe(
      "Listening"
    );
  });

  it("names a missing microphone ahead of a denied permission flag", () => {
    expect(
      microphoneStatusLabel({
        ...base,
        permissionStatus: "denied",
        error: ERROR_MESSAGES.MIC_UNAVAILABLE,
      })
    ).toBe("No microphone");
  });

  it("names a blocked microphone", () => {
    expect(
      microphoneStatusLabel({ ...base, permissionStatus: "denied" })
    ).toBe("Mic blocked");
  });
});
