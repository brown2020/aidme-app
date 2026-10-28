import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("session listeners", () => {
  it("does not cap owned or shared session lists at 50", () => {
    const source = readFileSync(join(__dirname, "liveSessions.ts"), "utf8");
    expect(source).not.toContain("MAX_LISTED_SESSIONS");
    expect(source).not.toContain("limit(50)");
  });
});
