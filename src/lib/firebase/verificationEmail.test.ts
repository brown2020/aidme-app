import { describe, expect, it, vi } from "vitest";
import {
  continueHostAllowed,
  isRejectedContinueUrl,
  sendWithOptionalContinueUrl,
} from "./verificationEmail";

const AUTHORIZED = ["localhost", "aidmehearing.firebaseapp.com", "aid.me", "www.aid.me"];

describe("continueHostAllowed", () => {
  it("allows the production site and loopback, and rejects preview hosts", () => {
    expect(continueHostAllowed("aid.me", AUTHORIZED)).toBe(true);
    expect(continueHostAllowed("WWW.AID.ME", AUTHORIZED)).toBe(true);
    expect(continueHostAllowed("127.0.0.1", AUTHORIZED)).toBe(true);
    expect(continueHostAllowed("[::1]", AUTHORIZED)).toBe(true);
    expect(continueHostAllowed("aidme-preview.vercel.app", AUTHORIZED)).toBe(false);
  });
});

describe("sendWithOptionalContinueUrl", () => {
  it("sends once, without a continue URL, when the host is not authorized", async () => {
    const sendWithUrl = vi.fn(async () => "with");
    const sendWithoutUrl = vi.fn(async () => "without");
    await expect(
      sendWithOptionalContinueUrl({
        hostname: "aidme-preview.vercel.app",
        domains: AUTHORIZED,
        sendWithUrl,
        sendWithoutUrl,
      })
    ).resolves.toBe("without");
    expect(sendWithUrl).not.toHaveBeenCalled();
    expect(sendWithoutUrl).toHaveBeenCalledOnce();
  });

  it("retries without a continue URL when that URL is rejected", async () => {
    const sendWithUrl = vi.fn(async () => {
      throw { code: "auth/unauthorized-continue-uri" };
    });
    const sendWithoutUrl = vi.fn(async () => "sent");
    await expect(
      sendWithOptionalContinueUrl({
        hostname: "aid.me",
        domains: AUTHORIZED,
        sendWithUrl,
        sendWithoutUrl,
      })
    ).resolves.toBe("sent");
    expect(sendWithoutUrl).toHaveBeenCalledOnce();
  });

  it("retries when the domain list could not be loaded", async () => {
    const sendWithUrl = vi.fn(async () => {
      throw { code: "auth/invalid-continue-uri" };
    });
    const sendWithoutUrl = vi.fn(async () => "sent");
    await expect(
      sendWithOptionalContinueUrl({
        hostname: "preview.example",
        domains: null,
        sendWithUrl,
        sendWithoutUrl,
      })
    ).resolves.toBe("sent");
  });

  it("surfaces any other failure without a second send", async () => {
    const sendWithUrl = vi.fn(async () => {
      throw { code: "auth/too-many-requests" };
    });
    const sendWithoutUrl = vi.fn(async () => "sent");
    await expect(
      sendWithOptionalContinueUrl({
        hostname: "aid.me",
        domains: AUTHORIZED,
        sendWithUrl,
        sendWithoutUrl,
      })
    ).rejects.toEqual({ code: "auth/too-many-requests" });
    expect(sendWithoutUrl).not.toHaveBeenCalled();
    expect(isRejectedContinueUrl({ code: "auth/unauthorized-domain" })).toBe(true);
    expect(isRejectedContinueUrl(new Error("nope"))).toBe(false);
  });
});
