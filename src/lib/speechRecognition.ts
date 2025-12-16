/**
 * Speech Recognition utilities - consolidated for DRY principle
 */

type SpeechRecognitionConstructor = new () => SpeechRecognition;

let recognitionInstance: SpeechRecognition | null = null;
let isRecognitionActive = false;

/**
 * Check if the browser supports the Web Speech API
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Get or create a singleton SpeechRecognition instance
 */
export function getSpeechRecognitionInstance(
  language = "en-US"
): SpeechRecognition | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognitionAPI = (window.SpeechRecognition ||
    window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;

  if (!SpeechRecognitionAPI) return null;

  if (!recognitionInstance) {
    try {
      recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;
    } catch {
      return null;
    }
  } else if (recognitionInstance.lang !== language) {
    recognitionInstance.lang = language;
  }

  return recognitionInstance;
}

/**
 * Check if recognition is currently active
 */
export function getIsRecognitionActive(): boolean {
  return isRecognitionActive;
}

/**
 * Set recognition active state
 */
export function setIsRecognitionActive(active: boolean): void {
  isRecognitionActive = active;
}

/**
 * Request microphone permission explicitly
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(
    navigator.mediaDevices
  );
  if (!getUserMedia) return false;

  try {
    const stream = await getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}



