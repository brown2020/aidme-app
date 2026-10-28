import { describe, expect, it } from "vitest";
import { activeSessionStopReason } from "./activeSessionStop";

const live = { status: "live", ownerUid: "owner" };

describe("activeSessionStopReason", () => {
  it("stops when the session is gone, ended, or no longer ours", () => {
    expect(activeSessionStopReason({ exists: false, session: null, uid: "owner" })).toBe("stop");
    expect(
      activeSessionStopReason({
        exists: true,
        session: { status: "ended", ownerUid: "owner" },
        uid: "owner",
      })
    ).toBe("stop");
    expect(activeSessionStopReason({ exists: true, session: live, uid: "other" })).toBe("stop");
  });

  it("keeps sharing through an invalid document or a retryable listener error", () => {
    expect(activeSessionStopReason({ exists: true, session: null, uid: "owner" })).toBe("keep");
    expect(activeSessionStopReason({ exists: true, session: live, uid: "owner" })).toBe("keep");
    expect(
      activeSessionStopReason({
        exists: true,
        session: null,
        uid: "owner",
        errorCode: "unavailable",
      })
    ).toBe("keep");
  });

  it("stops on permission errors", () => {
    expect(
      activeSessionStopReason({
        exists: true,
        session: live,
        uid: "owner",
        errorCode: "permission-denied",
      })
    ).toBe("stop");
    expect(
      activeSessionStopReason({
        exists: true,
        session: live,
        uid: "owner",
        errorCode: "unauthenticated",
      })
    ).toBe("stop");
  });
});
