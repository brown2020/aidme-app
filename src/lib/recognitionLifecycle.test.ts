import { describe, expect, it, vi } from "vitest";
import { handleRecognitionEnd } from "./recognitionLifecycle";

describe("handleRecognitionEnd", () => {
  it("ignores a stale end before touching recognition state", () => {
    const markInactive = vi.fn();
    const scheduleRestart = vi.fn();
    handleRecognitionEnd(false, true, markInactive, scheduleRestart);
    expect(markInactive).not.toHaveBeenCalled();
    expect(scheduleRestart).not.toHaveBeenCalled();
  });

  it("marks the current session inactive and restarts only when allowed", () => {
    const markInactive = vi.fn();
    const scheduleRestart = vi.fn();
    handleRecognitionEnd(true, false, markInactive, scheduleRestart);
    expect(markInactive).toHaveBeenCalledOnce();
    expect(scheduleRestart).not.toHaveBeenCalled();

    handleRecognitionEnd(true, true, markInactive, scheduleRestart);
    expect(scheduleRestart).toHaveBeenCalledOnce();
  });
});
