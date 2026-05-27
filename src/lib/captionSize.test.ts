import { describe, expect, it } from "vitest";
import { getCaptionTextClassName } from "./captionSize";

describe("getCaptionTextClassName", () => {
  it("includes break-words for all sizes", () => {
    expect(getCaptionTextClassName("default")).toContain("break-words");
    expect(getCaptionTextClassName("large")).toContain("break-words");
    expect(getCaptionTextClassName("xlarge")).toContain("break-words");
  });

  it("returns progressively larger text classes", () => {
    expect(getCaptionTextClassName("default")).toContain("text-3xl");
    expect(getCaptionTextClassName("large")).toContain("text-4xl");
    expect(getCaptionTextClassName("xlarge")).toContain("text-5xl");
  });
});
