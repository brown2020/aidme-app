/** Auto-stop listening after this duration (ms) */
export const LISTENING_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Maximum number of transcript sentences to retain */
export const MAX_TRANSCRIPT_LENGTH = 200;

/** Delay before restarting speech recognition (ms) */
export const RECOGNITION_RESTART_DELAY_MS = 250;

/** Centralized error messages for consistency */
export const ERROR_MESSAGES = {
  BROWSER_NOT_SUPPORTED:
    "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.",
  MIC_DENIED:
    "Microphone access is blocked. Please allow microphone access in your browser settings.",
  MIC_PERMISSION_ERROR:
    "Error requesting microphone permission. Please check your browser settings.",
  MIC_NOT_ALLOWED:
    "Microphone access was denied. Please allow microphone access in your browser settings.",
} as const;

/** Company information for legal pages */
export const COMPANY_INFO = {
  name: "Ignite Channel",
  email: "info@ignitechannel.com",
  address: "30765 Pacific Coast Hwy, Suite 354",
  location: "Malibu, CA",
  updatedAt: "November 1, 2023",
} as const;

/** Type for COMPANY_INFO */
export type CompanyInfo = typeof COMPANY_INFO;

/** Navigation links */
export const NAV_LINKS = [
  { title: "About", href: "/about" },
  { title: "Privacy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
] as const;
