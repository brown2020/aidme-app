import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";
import { AUTH_ERROR_MESSAGES } from "@/lib/constants";
import { getAuthErrorMessage } from "./authErrors";
import { FirebaseNotConfiguredError } from "./client";

describe("getAuthErrorMessage", () => {
  it("uses the same copy for wrong password and unknown user", () => {
    const wrong = getAuthErrorMessage(new FirebaseError("auth/wrong-password", "x"));
    const missing = getAuthErrorMessage(new FirebaseError("auth/user-not-found", "x"));
    expect(wrong).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    expect(missing).toBe(wrong);
  });

  it("stays silent when the user closes the Google window", () => {
    expect(getAuthErrorMessage(new FirebaseError("auth/popup-closed-by-user", "x"))).toBeNull();
  });

  it("explains missing configuration and falls back to generic copy", () => {
    expect(getAuthErrorMessage(new FirebaseNotConfiguredError())).toBe(
      AUTH_ERROR_MESSAGES.NOT_CONFIGURED
    );
    expect(getAuthErrorMessage(new Error("boom"))).toBe(AUTH_ERROR_MESSAGES.GENERIC);
  });
});
