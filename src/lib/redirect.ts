/**
 * Returns an in-app path for post-sign-in navigation, or "/" when the value
 * could send the user to another origin.
 */
export function getSafeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  try {
    const url = new URL(value, "https://aid.me");
    if (url.origin !== "https://aid.me") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
