import { describe, expect, it } from "vitest";
import {
  buildMailtoUrl,
  buildShareUrl,
  parseViewerEmails,
  sessionIdSchema,
  toLineText,
} from "./liveSessionModel";

describe("parseViewerEmails", () => {
  it("splits, lowercases, and dedupes addresses", () => {
    expect(parseViewerEmails("A@Example.com, b@example.com;\na@example.com").emails).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("reports invalid addresses and drops the owner", () => {
    const result = parseViewerEmails("friend@example.com nope me@example.com", "Me@Example.com");
    expect(result.emails).toEqual(["friend@example.com"]);
    expect(result.invalid).toEqual(["nope"]);
  });

  it("flags more than ten viewers", () => {
    const input = Array.from({ length: 11 }, (_, i) => `v${i}@example.com`).join(",");
    expect(parseViewerEmails(input).tooMany).toBe(true);
  });
});

describe("toLineText", () => {
  it("drops empty lines and caps length to the rules limit", () => {
    expect(toLineText("   ")).toBeNull();
    expect(toLineText(" Hello. ")).toBe("Hello.");
    expect(toLineText("x".repeat(2500))?.length).toBe(2000);
  });
});

describe("share links", () => {
  it("builds the viewer URL and an encoded mailto", () => {
    expect(buildShareUrl("https://aid.me", "abc123DEF456ghi789jk")).toBe(
      "https://aid.me/s/abc123DEF456ghi789jk"
    );
    expect(buildMailtoUrl(["a@example.com", "b+x@example.com"], "Hi & bye", "Line 1\nLine 2")).toBe(
      "mailto:a%40example.com,b%2Bx%40example.com?subject=Hi%20%26%20bye&body=Line%201%0ALine%202"
    );
  });

  it("accepts Firestore auto-IDs only", () => {
    expect(sessionIdSchema.safeParse("abc123DEF456ghi789jk").success).toBe(true);
    expect(sessionIdSchema.safeParse("../secret").success).toBe(false);
    expect(sessionIdSchema.safeParse("short").success).toBe(false);
  });
});
