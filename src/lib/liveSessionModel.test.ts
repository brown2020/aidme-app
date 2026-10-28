import { describe, expect, it } from "vitest";
import { createHash } from "crypto";
import {
  buildMailtoUrl,
  buildShareUrl,
  emailKey,
  emailKeys,
  latestInterimText,
  liveSessionSchema,
  pairLegacyInvites,
  parseViewerEmails,
  sessionIdSchema,
  toLineText,
} from "./liveSessionModel";

describe("emailKey", () => {
  it("is the lowercase hex SHA-256 of the normalized email", async () => {
    const expected = createHash("sha256").update("viewer@example.com").digest("hex");
    expect(await emailKey("  Viewer@Example.COM ")).toBe(expected);
  });
});

describe("latestInterimText", () => {
  it("returns the text with the highest sequence, or empty", () => {
    expect(latestInterimText([])).toBe("");
    expect(
      latestInterimText([
        { text: "how are", seq: 11 },
        { text: "how are you", seq: 12 },
        { text: "how", seq: 10 },
      ])
    ).toBe("how are you");
  });
});

describe("liveSessionSchema", () => {
  const valid = {
    ownerUid: "u1",
    ownerName: "Owner",
    ownerEmail: "owner@example.com",
    title: "Conversation",
    status: "live",
    language: "en-US",
    createdAt: new Date(),
    updatedAt: null,
  };

  it("accepts a well-formed session and does not keep invite fingerprints", () => {
    expect(liveSessionSchema.safeParse(valid).success).toBe(true);
    expect(liveSessionSchema.safeParse({ ...valid, status: "paused" }).success).toBe(false);
    const parsed = liveSessionSchema.safeParse({ ...valid, viewerKeys: ["abc"] });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).not.toHaveProperty("viewerKeys");
  });
});

describe("pairLegacyInvites", () => {
  it("keeps only emails whose hash is still on the legacy session", async () => {
    const emails = ["a@example.com", "b@example.com"];
    const hashed = await emailKeys(emails);
    expect(pairLegacyInvites(emails, hashed, [hashed[1], "not-a-key"])).toEqual({
      emails: ["b@example.com"],
      emailKeys: [hashed[1]],
    });
  });
});

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
