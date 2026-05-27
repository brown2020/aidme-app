import { describe, expect, it } from "vitest";
import {
  appStateSchema,
  permissionStatusSchema,
  recognitionLanguageSchema,
  validatePermissionStatus,
  validateRecognitionLanguage,
} from "./validation";

describe("validatePermissionStatus", () => {
  it("accepts known permission states", () => {
    expect(validatePermissionStatus("granted")).toBe("granted");
    expect(validatePermissionStatus("denied")).toBe("denied");
  });

  it("returns unknown for invalid values", () => {
    expect(validatePermissionStatus("invalid")).toBe("unknown");
    expect(validatePermissionStatus(null)).toBe("unknown");
  });
});

describe("permissionStatusSchema", () => {
  it("rejects unexpected enum values", () => {
    expect(permissionStatusSchema.safeParse("blocked").success).toBe(false);
  });
});

describe("recognitionLanguageSchema", () => {
  it("accepts supported BCP 47 codes", () => {
    expect(recognitionLanguageSchema.safeParse("en-US").success).toBe(true);
    expect(recognitionLanguageSchema.safeParse("es-ES").success).toBe(true);
  });

  it("rejects unsupported codes", () => {
    expect(recognitionLanguageSchema.safeParse("xx-XX").success).toBe(false);
  });
});

describe("validateRecognitionLanguage", () => {
  it("falls back to en-US for invalid values", () => {
    expect(validateRecognitionLanguage("invalid")).toBe("en-US");
  });
});

describe("appStateSchema", () => {
  it("validates store shape", () => {
    const result = appStateSchema.safeParse({
      shouldListen: false,
      isTranscriptFlipped: true,
      recognitionLanguage: "fr-FR",
    });
    expect(result.success).toBe(true);
  });
});
