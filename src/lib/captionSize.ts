import type { CaptionSize } from "./validation";

/**
 * Tailwind classes for transcript body text at each caption size.
 * Uses break-words to avoid horizontal overflow on small screens.
 */
export function getCaptionTextClassName(size: CaptionSize): string {
  const base = "break-words max-w-full leading-snug";

  switch (size) {
    case "large":
      return `${base} text-4xl sm:text-5xl`;
    case "xlarge":
      return `${base} text-5xl sm:text-6xl`;
    default:
      return `${base} text-3xl sm:text-4xl`;
  }
}
