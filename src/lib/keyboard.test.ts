import { describe, expect, it } from "vitest";
import { isMicToggleShortcutKey, shouldIgnoreKeyboardShortcut } from "./keyboard";

describe("shouldIgnoreKeyboardShortcut", () => {
  it("ignores events from text inputs", () => {
    const input = document.createElement("input");
    expect(shouldIgnoreKeyboardShortcut(input)).toBe(true);
  });

  it("ignores events from select elements", () => {
    const select = document.createElement("select");
    expect(shouldIgnoreKeyboardShortcut(select)).toBe(true);
  });

  it("allows events from generic div targets", () => {
    const div = document.createElement("div");
    expect(shouldIgnoreKeyboardShortcut(div)).toBe(false);
  });

  it("ignores contenteditable elements", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    expect(shouldIgnoreKeyboardShortcut(div)).toBe(true);
  });
});

describe("isMicToggleShortcutKey", () => {
  it("matches unmodified Space", () => {
    const event = new KeyboardEvent("keydown", { key: " " });
    expect(isMicToggleShortcutKey(event)).toBe(true);
  });

  it("rejects Space with Shift", () => {
    const event = new KeyboardEvent("keydown", { key: " ", shiftKey: true });
    expect(isMicToggleShortcutKey(event)).toBe(false);
  });

  it("rejects other keys", () => {
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    expect(isMicToggleShortcutKey(event)).toBe(false);
  });
});
