import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");
const publicAppRoutes = [
  { route: "/", file: "src/app/page.tsx" },
  { route: "/about", file: "src/app/(content)/about/page.tsx" },
  { route: "/privacy", file: "src/app/(content)/privacy/page.tsx" },
  { route: "/settings", file: "src/app/(content)/settings/page.tsx" },
  { route: "/terms", file: "src/app/(content)/terms/page.tsx" },
] as const;

/**
 * Aid.me is a fully public client-side app with no auth layer.
 * These tests document and guard that architectural invariant.
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
      "/privacy",
      "/settings",
      "/terms",
    ]);

    for (const { file } of publicAppRoutes) {
      expect(existsSync(join(repoRoot, file))).toBe(true);
    }
  });
});
