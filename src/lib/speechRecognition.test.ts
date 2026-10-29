import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getIsRecognitionActive,
  getSpeechRecognitionInstance,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  resetSpeechRecognitionModuleState,
  setIsRecognitionActive,
} from "./speechRecognition";

describe("speechRecognition module state", () => {
  afterEach(() => {
    resetSpeechRecognitionModuleState();
    vi.unstubAllGlobals();
  });

  it("reports inactive by default", () => {
    expect(getIsRecognitionActive()).toBe(false);
  });

  it("tracks active state via setIsRecognitionActive", () => {
    setIsRecognitionActive(true);
    expect(getIsRecognitionActive()).toBe(true);
    setIsRecognitionActive(false);
    expect(getIsRecognitionActive()).toBe(false);
  });

  it("detects missing SpeechRecognition API", () => {
    vi.stubGlobal("window", {} as Window);
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it("detects webkit SpeechRecognition API", () => {
    vi.stubGlobal("window", {
      webkitSpeechRecognition: class MockRecognition {},
    } as unknown as Window);
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("recreates instance when output language changes", () => {
    const instances: { lang: string }[] = [];
    class MockRecognition {
      continuous = true;
      interimResults = true;
      lang = "";
      start() {}
      stop() {}
    }
    vi.stubGlobal("window", {
      SpeechRecognition: class extends MockRecognition {
        constructor() {
          super();
          instances.push(this);
        }
      },
    } as unknown as Window);

    const first = getSpeechRecognitionInstance("en-US");
    const second = getSpeechRecognitionInstance("es-ES");
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second?.lang).toBe("es-ES");
    expect(instances.length).toBe(2);
  });
});

describe("requestMicrophonePermission", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves granted and stops the probe stream", async () => {
    const stop = vi.fn();
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: async () => ({ getTracks: () => [{ stop }] }),
      },
    });

    await expect(requestMicrophonePermission()).resolves.toEqual({
      granted: true,
    });
    expect(stop).toHaveBeenCalledOnce();
  });

  it("reports a missing microphone separately from a denial", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: async () => {
          throw new DOMException("Requested device not found", "NotFoundError");
        },
      },
    });

    await expect(requestMicrophonePermission()).resolves.toEqual({
      granted: false,
      reason: "unavailable",
    });
  });

  it("reports a permission rejection as denied", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: async () => {
          throw new DOMException("Permission denied", "NotAllowedError");
        },
      },
    });

    await expect(requestMicrophonePermission()).resolves.toEqual({
      granted: false,
      reason: "denied",
    });
  });
});
