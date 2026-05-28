/**
 * Application constants
 * Centralized configuration for timeouts, limits, and messages
 */

/** Auto-stop listening after this duration (ms) */
export const LISTENING_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Maximum number of transcript sentences to retain */
export const MAX_TRANSCRIPT_LENGTH = 200;

/** Delay before restarting speech recognition (ms) */
export const RECOGNITION_RESTART_DELAY_MS = 250;

/** Keyboard shortcut to toggle microphone (Space, when not in a form control) */
export const MIC_TOGGLE_SHORTCUT_KEY = " ";

/** Human-readable label for accessibility and help text */
export const MIC_TOGGLE_SHORTCUT_LABEL = "Space";

/** Default BCP 47 language for speech recognition */
export const DEFAULT_RECOGNITION_LANGUAGE = "en-US" as const;

/** Supported recognition languages (BCP 47) */
export const RECOGNITION_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "hi-IN", label: "Hindi" },
] as const;

export type RecognitionLanguageCode =
  (typeof RECOGNITION_LANGUAGES)[number]["code"];

/** Human-readable label for a BCP 47 recognition language code */
export function getRecognitionLanguageLabel(code: string): string {
  const match = RECOGNITION_LANGUAGES.find((entry) => entry.code === code);
  return match?.label ?? code;
}

/** Caption text size options for transcript display */
export const CAPTION_SIZES = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "xlarge", label: "Extra large" },
] as const;

export type CaptionSizeValue = (typeof CAPTION_SIZES)[number]["value"];

export const DEFAULT_CAPTION_SIZE: CaptionSizeValue = "default";

/**
 * Centralized error messages for consistency
 * All user-facing error messages should be defined here
 */
export const ERROR_MESSAGES = {
  BROWSER_NOT_SUPPORTED:
    "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.",
  MIC_DENIED:
    "Microphone access is blocked. Please allow microphone access in your browser settings.",
  MIC_PERMISSION_ERROR:
    "Error requesting microphone permission. Please check your browser settings.",
  MIC_NOT_ALLOWED:
    "Microphone access was denied. Please allow microphone access in your browser settings.",
  NETWORK_ERROR:
    "Speech recognition service unavailable. Please check your internet connection and try again.",
  LANGUAGE_NOT_SUPPORTED:
    "Speech recognition is not available for the selected language. Try another language.",
} as const;

/** Clipboard copy feedback (Sonner toasts) */
export const COPY_MESSAGES = {
  SUCCESS: "Transcript copied to clipboard",
  EMPTY: "Nothing to copy yet",
  UNSUPPORTED: "Copy is not supported in this browser",
  FAILED: "Could not copy to clipboard",
} as const;

/** Company information for legal pages */
export const COMPANY_INFO = {
  name: "Ignite Channel",
  email: "info@ignitechannel.com",
  address: "30765 Pacific Coast Hwy, Suite 354",
  location: "Malibu, CA",
  updatedAt: "November 1, 2023",
} as const;

/** Navigation links */
export const NAV_LINKS = [
  { title: "Transcribe", href: "/" },
  { title: "Settings", href: "/settings" },
  { title: "About", href: "/about" },
  { title: "Privacy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
] as const;
