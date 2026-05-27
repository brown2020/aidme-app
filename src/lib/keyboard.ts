import { MIC_TOGGLE_SHORTCUT_KEY } from "./constants";

const FORM_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

/**
 * Returns true when a global keyboard shortcut should not run because
 * the user is interacting with a form control or editable region.
 */
export function shouldIgnoreKeyboardShortcut(
  target: EventTarget | null
): boolean {
  if (!(target instanceof HTMLElement)) return false;

  if (
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true" ||
    target.getAttribute("contenteditable") === ""
  ) {
    return true;
  }

  const tag = target.tagName;
  if (FORM_TAG_NAMES.has(tag)) return true;

  const role = target.getAttribute("role");
  if (role === "textbox" || role === "combobox" || role === "listbox") {
    return true;
  }

  return false;
}

/**
 * Returns true when the event is the mic toggle shortcut (Space, no modifiers).
 */
export function isMicToggleShortcutKey(event: KeyboardEvent): boolean {
  if (event.key !== MIC_TOGGLE_SHORTCUT_KEY) return false;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
    return false;
  }
  return true;
}
