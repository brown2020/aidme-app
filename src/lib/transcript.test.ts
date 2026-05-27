import { describe, expect, it, vi, afterEach } from "vitest";
import {
  copyTranscriptToClipboard,
  formatTranscriptForCopy,
  hasCopyableTranscript,
} from "./transcript";

describe("formatTranscriptForCopy", () => {
  it("joins final sentences with blank lines", () => {
    expect(formatTranscriptForCopy(["Hello.", "World."], "")).toBe(
      "Hello.\n\nWorld."
    );
  });

  it("appends trimmed interim text after finals", () => {
    expect(formatTranscriptForCopy(["Hi."], "still speaking")).toBe(
      "Hi.\n\nstill speaking"
    );
  });

  it("returns empty string when there is no content", () => {
    expect(formatTranscriptForCopy([], "   ")).toBe("");
  });
});

describe("hasCopyableTranscript", () => {
  it("is false for empty transcript", () => {
    expect(hasCopyableTranscript([], "")).toBe(false);
  });

  it("is true when interim text exists", () => {
    expect(hasCopyableTranscript([], "listening")).toBe(true);
  });
});

describe("copyTranscriptToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty when there is nothing to copy", async () => {
    await expect(copyTranscriptToClipboard([], "")).resolves.toBe("empty");
  });

  it("returns success when clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("window", {});

    await expect(
      copyTranscriptToClipboard(["Hello."], "")
    ).resolves.toBe("success");
    expect(writeText).toHaveBeenCalledWith("Hello.");
  });

  it("returns unsupported when clipboard API is missing and fallback fails", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", {
      createElement: () => ({
        style: {},
        setAttribute: vi.fn(),
        select: vi.fn(),
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand: () => false,
    });
    vi.stubGlobal("window", {});

    await expect(
      copyTranscriptToClipboard(["Hello."], "")
    ).resolves.toBe("unsupported");
  });
});
