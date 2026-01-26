/**
 * Zod validation schemas for type-safe runtime validation
 * Following user rules to implement Zod for schema validation
 */
import { z } from "zod";

/**
 * Permission status schema
 */
export const permissionStatusSchema = z.enum([
  "granted",
  "denied",
  "prompt",
  "unknown",
]);

export type PermissionStatus = z.infer<typeof permissionStatusSchema>;

/**
 * App store state schema
 */
export const appStateSchema = z.object({
  shouldListen: z.boolean(),
  isTranscriptFlipped: z.boolean(),
});

export type AppStateValidated = z.infer<typeof appStateSchema>;

/**
 * Speech recognition error code schema
 */
export const speechRecognitionErrorCodeSchema = z.enum([
  "no-speech",
  "aborted",
  "audio-capture",
  "network",
  "not-allowed",
  "service-not-allowed",
  "bad-grammar",
  "language-not-supported",
]);

export type SpeechRecognitionErrorCode = z.infer<
  typeof speechRecognitionErrorCodeSchema
>;

/**
 * Transcript item schema
 */
export const transcriptItemSchema = z.string().min(1);

export const transcriptArraySchema = z.array(transcriptItemSchema);

/**
 * Language code schema (BCP 47)
 */
export const languageCodeSchema = z.string().regex(/^[a-z]{2}-[A-Z]{2}$/);

/**
 * Validates persisted state from localStorage
 */
export function validatePersistedState(state: unknown): AppStateValidated {
  return appStateSchema.parse(state);
}

/**
 * Safely validates permission status
 */
export function validatePermissionStatus(
  status: unknown
): PermissionStatus | "unknown" {
  const result = permissionStatusSchema.safeParse(status);
  return result.success ? result.data : "unknown";
}
