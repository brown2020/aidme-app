/**
 * Speech Recognition utilities - consolidated for DRY principle
 * Provides singleton pattern for speech recognition instance management
 */

import { logger } from "./logger";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

/** Singleton recognition instance */
let recognitionInstance: SpeechRecognition | null = null;

/**
 * Recognition state to prevent race conditions
 * Using a state machine prevents desync between flag and actual recognition state
 */
type RecognitionState = "idle" | "active";
let recognitionState: RecognitionState = "idle";

/**
 * Check if the browser supports the Web Speech API
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Get or create a singleton SpeechRecognition instance
 *
 * @param language - BCP 47 language tag (default: "en-US")
 * @returns SpeechRecognition instance or null if unsupported
 */
export function getSpeechRecognitionInstance(
  language = "en-US"
): SpeechRecognition | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognitionAPI = (window.SpeechRecognition ||
    window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;

  if (!SpeechRecognitionAPI) {
    logger.warn("SpeechRecognition API not available in this browser");
    return null;
  }

  if (!recognitionInstance) {
    try {
      recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;
      logger.info("SpeechRecognition instance created", { language });
    } catch (error) {
      logger.error("Failed to create SpeechRecognition instance", error);
      return null;
    }
  } else if (recognitionInstance.lang !== language) {
    recognitionInstance.lang = language;
    logger.debug("Updated SpeechRecognition language", { language });
  }

  return recognitionInstance;
}

/**
 * Check if recognition is currently active
 */
export function getIsRecognitionActive(): boolean {
  return recognitionState === "active";
}

/**
 * Set recognition state
 * @param active - Whether recognition is active
 */
export function setIsRecognitionActive(active: boolean): void {
  recognitionState = active ? "active" : "idle";
  logger.debug("Recognition state changed", { state: recognitionState });
}

/**
 * Request microphone permission explicitly via getUserMedia
 *
 * @returns Promise resolving to true if permission granted
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === "undefined") {
    logger.warn("Navigator not available (SSR context)");
    return false;
  }

  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(
    navigator.mediaDevices
  );

  if (!getUserMedia) {
    logger.warn("getUserMedia not available in this browser");
    return false;
  }

  try {
    const stream = await getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    logger.info("Microphone permission granted");
    return true;
  } catch (error) {
    logger.error("Microphone permission denied", error);
    return false;
  }
}
