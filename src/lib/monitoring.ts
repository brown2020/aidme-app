import { logger } from "./logger";

/**
 * Reports an operational failure (logged, and sent to Analytics when it is
 * running) so production problems such as rejected writes are visible.
 */
export function reportOperationalEvent(
  name: string,
  error?: unknown,
  params: Record<string, string | number> = {}
): void {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "unknown";
  logger.warn(name, error);
  void import("./firebase/analytics")
    .then(({ trackEvent }) => trackEvent(name, { ...params, code }))
    .catch(() => undefined);
}
