/**
 * Zod validation schemas for type-safe runtime validation
 */
import { z } from "zod";
import {
  CAPTION_SIZES,
  DEFAULT_CAPTION_SIZE,
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

const captionSizeValues = CAPTION_SIZES.map((s) => s.value) as [
  string,
  ...string[],
];

export const captionSizeSchema = z.enum(captionSizeValues);

export type CaptionSize = z.infer<typeof captionSizeSchema>;

export const DEFAULT_CAPTION_SIZE_VALIDATED =
  captionSizeSchema.parse(DEFAULT_CAPTION_SIZE);

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
  captionSize: captionSizeSchema,
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

/**
 * Safely validates caption size, falling back to default
 */
export function validateCaptionSize(size: unknown): CaptionSize {
  const result = captionSizeSchema.safeParse(size);
  return result.success ? result.data : DEFAULT_CAPTION_SIZE_VALIDATED;
}
