import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThrottledLatest } from "./throttledLatest";

describe("createThrottledLatest", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sends the first value immediately and only the latest one per interval", () => {
    const sent: string[] = [];
    const throttle = createThrottledLatest((v: string) => sent.push(v), 300);

    throttle.push("how");
    throttle.push("how are");
    throttle.push("how are you");
    expect(sent).toEqual(["how"]);

    vi.advanceTimersByTime(300);
    expect(sent).toEqual(["how", "how are you"]);
  });

  it("drops a queued value after cancel so stale words never arrive", () => {
    const sent: string[] = [];
    const throttle = createThrottledLatest((v: string) => sent.push(v), 300);

    throttle.push("hello");
    throttle.push("hello wor");
    throttle.cancel();
    vi.advanceTimersByTime(1000);
    expect(sent).toEqual(["hello"]);
  });
});
