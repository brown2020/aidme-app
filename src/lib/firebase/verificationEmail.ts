/**
 * Verification emails include a continue URL so the link returns to this site.
 * Firebase rejects that URL when the host is not an authorized domain, and the
 * rejected call still counts toward the email quota, so a second call made
 * immediately afterwards is throttled. Skip the continue URL when the host is
 * known to be unauthorized, and retry without it if a call is rejected.
 */

const CONTINUE_URL_REJECTION_CODES = new Set([
  "auth/unauthorized-continue-uri",
  "auth/unauthorized-domain",
  "auth/invalid-continue-uri",
]);

export function isRejectedContinueUrl(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : null;
  return code !== null && CONTINUE_URL_REJECTION_CODES.has(code);
}

/** True when this host may be used as a Firebase continue URL. */
export function continueHostAllowed(hostname: string, domains: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const listed = new Set(domains.map((domain) => domain.toLowerCase()));
  if (listed.has(host)) return true;
  // The console lists "localhost" for the loopback addresses used in development.
  return (host === "127.0.0.1" || host === "::1") && listed.has("localhost");
}

export async function sendWithOptionalContinueUrl<T>(options: {
  hostname: string;
  /** Null when the authorized-domain list could not be loaded. */
  domains: readonly string[] | null;
  sendWithUrl: () => Promise<T>;
  sendWithoutUrl: () => Promise<T>;
}): Promise<T> {
  const useContinueUrl =
    options.domains === null || continueHostAllowed(options.hostname, options.domains);
  if (!useContinueUrl) return options.sendWithoutUrl();
  try {
    return await options.sendWithUrl();
  } catch (error) {
    if (!isRejectedContinueUrl(error)) throw error;
    return options.sendWithoutUrl();
  }
}
