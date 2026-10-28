/** Google profile hosts accepted by next/image. Any other photoURL falls back to initials. */
export const PROFILE_PHOTO_HOSTS = [
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
] as const;

const ALLOWED = new Set<string>(PROFILE_PHOTO_HOSTS);

/**
 * Returns an https Google profile photo URL, or null when next/image would
 * throw because the host is not in images.remotePatterns.
 */
export function allowedProfilePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (!ALLOWED.has(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
