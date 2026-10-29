/**
 * Applies a SpeechRecognition `onend` only for the effect that still owns the
 * singleton. A late end from a restart or language change must not clear the
 * active flag out from under the new session.
 */
export function handleRecognitionEnd(
  isCurrent: boolean,
  canRestart: boolean,
  markInactive: () => void,
  scheduleRestart: () => void
): void {
  if (!isCurrent) return;
  markInactive();
  if (canRestart) scheduleRestart();
}
