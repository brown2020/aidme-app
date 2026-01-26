import { useEffect } from "react";

/**
 * Sets a CSS custom property `--vh` that represents 1% of the viewport height.
 * This is useful for mobile browsers where 100vh doesn't account for browser chrome.
 * 
 * Handles resize and orientation change events to keep the value updated
 *
 * @example
 * // In component
 * useViewportHeight();
 * 
 * // In CSS
 * .container {
 *   height: calc(var(--vh, 1vh) * 100);
 * }
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const updateViewportHeight = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);
}




