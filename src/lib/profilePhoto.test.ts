import { describe, expect, it } from "vitest";
import { allowedProfilePhotoUrl } from "./profilePhoto";

describe("allowedProfilePhotoUrl", () => {
  it("keeps Google profile hosts and drops everything else", () => {
    expect(allowedProfilePhotoUrl("https://lh3.googleusercontent.com/a/photo")).toBe(
      "https://lh3.googleusercontent.com/a/photo"
    );
    expect(allowedProfilePhotoUrl("https://lh5.googleusercontent.com/a/photo")).toBe(
      "https://lh5.googleusercontent.com/a/photo"
    );
    expect(allowedProfilePhotoUrl("https://evil.example/a.png")).toBeNull();
    expect(allowedProfilePhotoUrl("http://lh3.googleusercontent.com/a/photo")).toBeNull();
    expect(allowedProfilePhotoUrl("not a url")).toBeNull();
    expect(allowedProfilePhotoUrl(null)).toBeNull();
  });
});
