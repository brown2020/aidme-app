import { useState, useEffect } from "react";

/**
 * Hook to track media query matches in a type-safe way
 * Minimizes useEffect usage by encapsulating media query logic
 * 
 * @param query - CSS media query string (e.g., "(min-width: 1024px)")
 * @returns Boolean indicating if the media query matches
 * 
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    // Legacy Safari fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyMql = mediaQuery as any;
    if (legacyMql.addListener) {
      legacyMql.addListener(handler);
      return () => legacyMql.removeListener(handler);
    }
  }, [query]);

  return matches;
}
