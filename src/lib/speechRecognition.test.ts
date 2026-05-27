import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getIsRecognitionActive,
  isSpeechRecognitionSupported,
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
});
