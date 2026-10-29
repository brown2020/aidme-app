/**
 * Speech Recognition utilities - consolidated for DRY principle
 * Provides singleton pattern for speech recognition instance management
 */

import { logger } from "./logger";
import {
  classifyMicrophoneFailure,
  type MicrophoneAccessResult,
} from "./microphoneAccess";

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

  // Browsers often ignore lang changes on a running instance — recreate when it changes
  if (recognitionInstance && recognitionInstance.lang !== language) {
    try {
      recognitionInstance.stop();
    } catch {
      // Ignore stop errors during language switch
    }
    recognitionInstance = null;
    recognitionState = "idle";
    logger.debug("Recreating SpeechRecognition for new output language", {
      language,
    });
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
 * Reset module state — for tests only.
 */
export function resetSpeechRecognitionModuleState(): void {
  recognitionInstance = null;
  recognitionState = "idle";
}

/**
 * Request microphone permission explicitly via getUserMedia.
 * Stops the probe stream immediately; speech recognition opens the mic itself.
 */
export async function requestMicrophonePermission(): Promise<MicrophoneAccessResult> {
  if (typeof navigator === "undefined") {
    logger.warn("Navigator not available (SSR context)");
    return { granted: false, reason: "failed" };
  }

  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(
    navigator.mediaDevices
  );

  if (!getUserMedia) {
    logger.warn("getUserMedia not available in this browser");
    return { granted: false, reason: "failed" };
  }

  try {
    const stream = await getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    logger.info("Microphone permission granted");
    return { granted: true };
  } catch (error) {
    const reason = classifyMicrophoneFailure(error);
    logger.error("Microphone request failed", { reason, error });
    return { granted: false, reason };
  }
}
