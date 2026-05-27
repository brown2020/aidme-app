import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getIsRecognitionActive,
  getSpeechRecognitionInstance,
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
