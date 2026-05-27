/**
 * Zod validation schemas for type-safe runtime validation
 */
import { z } from "zod";
import {
  DEFAULT_RECOGNITION_LANGUAGE,
  RECOGNITION_LANGUAGES,
} from "./constants";

const recognitionLanguageCodes = RECOGNITION_LANGUAGES.map((l) => l.code) as [
  string,
  ...string[],
];

/**
 * BCP 47 recognition language codes supported by the app
 */
export const recognitionLanguageSchema = z.enum(recognitionLanguageCodes);

export type RecognitionLanguage = z.infer<typeof recognitionLanguageSchema>;

export const DEFAULT_RECOGNITION_LANGUAGE_VALIDATED =
  recognitionLanguageSchema.parse(DEFAULT_RECOGNITION_LANGUAGE);

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
 * Persisted + session app store fields validated on hydration
 */
export const appStateSchema = z.object({
  shouldListen: z.boolean(),
  isTranscriptFlipped: z.boolean(),
  recognitionLanguage: recognitionLanguageSchema,
});

/**
 * Safely validates permission status
 */
export function validatePermissionStatus(
  status: unknown
): PermissionStatus | "unknown" {
  const result = permissionStatusSchema.safeParse(status);
  return result.success ? result.data : "unknown";
}

/**
 * Safely validates recognition language, falling back to default
 */
export function validateRecognitionLanguage(
  language: unknown
): RecognitionLanguage {
  const result = recognitionLanguageSchema.safeParse(language);
  return result.success ? result.data : DEFAULT_RECOGNITION_LANGUAGE_VALIDATED;
}
