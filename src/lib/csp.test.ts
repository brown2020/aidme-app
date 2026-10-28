import { createRequire } from "module";
import { describe, expect, it } from "vitest";

const { contentSecurityPolicy } = createRequire(import.meta.url)("../../csp.cjs") as {
  contentSecurityPolicy: (options?: { emulatorHost?: string | null; allowEval?: boolean }) => string;
};

describe("contentSecurityPolicy", () => {
  it("locks framing and Firebase connections without eval in production", () => {
    const policy = contentSecurityPolicy();
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("https://*.googleapis.com");
    expect(policy).toContain("https://*.firebaseio.com");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("allows the local emulators only when a host is configured", () => {
    const policy = contentSecurityPolicy({ emulatorHost: "127.0.0.1" });
    expect(policy).toContain("http://127.0.0.1:9099");
    expect(policy).toContain("http://127.0.0.1:8086");
    expect(policy).toContain("ws://127.0.0.1:8086");
    expect(policy).toContain("frame-src");
    expect(policy).toMatch(/frame-src[^;]*http:\/\/127\.0\.0\.1:9099/);
  });

  it("allows eval only for the dev server", () => {
    expect(contentSecurityPolicy({ allowEval: true })).toContain("'unsafe-eval'");
  });
});
