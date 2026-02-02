/**
 * Zod validation schemas for type-safe runtime validation
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
 * Safely validates permission status
 */
export function validatePermissionStatus(
  status: unknown
): PermissionStatus | "unknown" {
  const result = permissionStatusSchema.safeParse(status);
  return result.success ? result.data : "unknown";
}
