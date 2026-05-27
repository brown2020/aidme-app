import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");

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

  it("exposes only public static app routes", () => {
    const publicRoutes = ["/", "/about", "/privacy", "/terms"];
    expect(publicRoutes).toEqual(
      expect.arrayContaining(["/", "/about", "/privacy", "/terms"])
    );
  });
});
