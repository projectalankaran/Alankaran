import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is intersecting the viewport, so continuous work (WebGL, infinite float
 * loops) can be mounted/paused strictly while it is on screen. One IntersectionObserver per element,
 * disconnected on unmount. SSR-safe: returns `false` until mounted on the client.
 *
 * `rootMargin` lets callers arm slightly before the element scrolls in (avoids a visible cold-start).
 */
export function useInViewport<T extends Element = HTMLDivElement>(
  options: { rootMargin?: string; threshold?: number } = {}
): { ref: React.RefObject<T | null>; inView: boolean } {
  const { rootMargin = "0px", threshold = 0 } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // No observer support → assume visible so content/animation is never permanently withheld.
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
