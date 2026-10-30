/**
 * Speech Recognition utilities - consolidated for DRY principle
 * Provides singleton pattern for speech recognition instance management
 */

import { MIC_START_TIMEOUT_MS } from "./constants";
import { logger } from "./logger";
import {
  audioInputPresence,
  classifyMicrophoneFailure,
  withTimeout,
  type AudioInputPresence,
  type MicrophoneAccessResult,
} from "./microphoneAccess";
import { validatePermissionStatus, type PermissionStatus } from "./validation";

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

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

async function listedAudioInputs(
  signalMs: number
): Promise<AudioInputPresence> {
  const enumerate = navigator.mediaDevices?.enumerateDevices?.bind(
    navigator.mediaDevices
  );
  if (!enumerate) return "unknown";

  try {
    const devices = await withTimeout(enumerate(), signalMs);
    return audioInputPresence(devices);
  } catch (error) {
    if (classifyMicrophoneFailure(error) === "timeout") throw error;
    logger.warn("Could not list audio devices", error);
    return "unknown";
  }
}

async function currentMicPermission(
  signalMs: number
): Promise<PermissionStatus | null> {
  if (!navigator.permissions?.query) return null;
  try {
    const result = await withTimeout(
      navigator.permissions.query({ name: "microphone" as PermissionName }),
      signalMs
    );
    return validatePermissionStatus(result.state);
  } catch (error) {
    if (classifyMicrophoneFailure(error) === "timeout") throw error;
    return null;
  }
}

/**
 * Request microphone permission explicitly via getUserMedia.
 * Stops the probe stream immediately; speech recognition opens the mic itself.
 * Returns before calling getUserMedia when no audio input is listed, and gives
 * up if the probe stays pending — some browsers never reject a missing mic.
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

  const deadline = Date.now() + MIC_START_TIMEOUT_MS;
  const remaining = () => Math.max(0, deadline - Date.now());

  try {
    const permission = await currentMicPermission(remaining());
    if (permission === "denied") {
      logger.warn("Microphone permission already denied");
      return { granted: false, reason: "denied" };
    }

    const inputs = await listedAudioInputs(remaining());
    if (inputs === "absent") {
      logger.warn("No audio input devices");
      return { granted: false, reason: "unavailable" };
    }

    const stream = await withTimeout(
      getUserMedia({ audio: true }),
      remaining(),
      stopStream
    );
    stopStream(stream);
    logger.info("Microphone permission granted");
    return { granted: true };
  } catch (error) {
    const reason = classifyMicrophoneFailure(error);
    logger.error("Microphone request failed", { reason, error });
    return { granted: false, reason };
  }
}
