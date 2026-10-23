import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it("keeps in-app paths with query and hash", () => {
    expect(getSafeRedirect("/s/abc123?x=1#end")).toBe("/s/abc123?x=1#end");
  });

  it("falls back to home for missing or off-site targets", () => {
    for (const value of [null, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
      expect(getSafeRedirect(value)).toBe("/");
    }
  });
});
