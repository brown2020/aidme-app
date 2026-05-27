import { describe, expect, it } from "vitest";
import {
  appStateSchema,
  permissionStatusSchema,
  validatePermissionStatus,
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

describe("appStateSchema", () => {
  it("validates store shape", () => {
    const result = appStateSchema.safeParse({
      shouldListen: false,
      isTranscriptFlipped: true,
    });
    expect(result.success).toBe(true);
  });
});
