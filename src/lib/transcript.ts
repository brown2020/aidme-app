/**
 * Transcript formatting and clipboard helpers (client-only)
 */

export type CopyTranscriptResult = "success" | "empty" | "unsupported" | "failed";

/**
 * Builds plain text from final sentences and optional interim speech.
 */
export function formatTranscriptForCopy(
  transcript: string[],
  interimTranscript: string
): string {
  const parts = [...transcript];
  const interim = interimTranscript.trim();
  if (interim) {
    parts.push(interim);
  }
  return parts.join("\n\n").trim();
}

/**
 * Returns whether there is any copyable transcript content.
 */
export function hasCopyableTranscript(
  transcript: string[],
  interimTranscript: string
): boolean {
  return formatTranscriptForCopy(transcript, interimTranscript).length > 0;
}

/**
 * Copies text using the Clipboard API with a legacy fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy approach
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Formats and copies transcript content; result indicates outcome for UI feedback.
 */
export async function copyTranscriptToClipboard(
  transcript: string[],
  interimTranscript: string
): Promise<CopyTranscriptResult> {
  const text = formatTranscriptForCopy(transcript, interimTranscript);
  if (!text) return "empty";

  if (typeof window === "undefined") return "unsupported";

  const hasModernClipboard = Boolean(navigator.clipboard?.writeText);
  const copied = await copyTextToClipboard(text);

  if (copied) return "success";
  if (!hasModernClipboard) return "unsupported";
  return "failed";
}
