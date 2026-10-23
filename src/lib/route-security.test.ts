import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");
const publicAppRoutes = [
  { route: "/", file: "src/app/page.tsx" },
  { route: "/about", file: "src/app/(content)/about/page.tsx" },
  { route: "/account", file: "src/app/(content)/account/page.tsx" },
  { route: "/auth/email-link", file: "src/app/(content)/auth/email-link/page.tsx" },
  { route: "/privacy", file: "src/app/(content)/privacy/page.tsx" },
  { route: "/s/[sessionId]", file: "src/app/s/[sessionId]/page.tsx" },
  { route: "/settings", file: "src/app/(content)/settings/page.tsx" },
  { route: "/sign-in", file: "src/app/(content)/sign-in/page.tsx" },
  { route: "/terms", file: "src/app/(content)/terms/page.tsx" },
] as const;

/**
 * Every route renders publicly; account data is protected only by Firestore
 * security rules (see rules/firestore.rules.test.ts), never by middleware.
 * These tests guard that no server route can bypass those rules.
 */
describe("route protection model", () => {
  it("does not ship Next.js middleware", () => {
    expect(existsSync(join(repoRoot, "middleware.ts"))).toBe(false);
    expect(existsSync(join(repoRoot, "src/middleware.ts"))).toBe(false);
  });

  it("does not ship Next.js proxy", () => {
    expect(existsSync(join(repoRoot, "proxy.ts"))).toBe(false);
    expect(existsSync(join(repoRoot, "src/proxy.ts"))).toBe(false);
  });

  it("does not ship API route handlers", () => {
    expect(existsSync(join(repoRoot, "src/app/api"))).toBe(false);
  });

  it("documents the shipped public static app routes", () => {
    expect(publicAppRoutes.map(({ route }) => route)).toEqual([
      "/",
      "/about",
      "/account",
      "/auth/email-link",
      "/privacy",
      "/s/[sessionId]",
      "/settings",
      "/sign-in",
      "/terms",
    ]);

    for (const { file } of publicAppRoutes) {
      expect(existsSync(join(repoRoot, file))).toBe(true);
    }
  });
});
