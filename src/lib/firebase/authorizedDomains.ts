import { emulatorHost, firebaseConfig } from "./config";

const CACHE_MS = 10 * 60 * 1000;

let cache: { expires: number; domains: string[] } | null = null;

/**
 * Hosts Firebase Auth will accept as a continue URL. Public project config;
 * the same list the Auth SDK checks before an OAuth redirect.
 * Returns null when the list cannot be loaded, so callers can still try.
 */
export async function authorizedAuthDomains(): Promise<string[] | null> {
  if (cache && cache.expires > Date.now()) return cache.domains;
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey) return null;
  const host = emulatorHost();
  const base = host
    ? `http://${host}:9099/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  try {
    const response = await fetch(`${base}/v1/projects?key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) return null;
    const body = (await response.json()) as { authorizedDomains?: unknown };
    if (!Array.isArray(body.authorizedDomains)) return null;
    const domains = body.authorizedDomains.filter((item): item is string => typeof item === "string");
    cache = { expires: Date.now() + CACHE_MS, domains };
    return domains;
  } catch {
    return null;
  }
}
