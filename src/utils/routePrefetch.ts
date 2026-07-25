/**
 * Route prefetching for the lazy-loaded public pages.
 *
 * Each entry uses the SAME dynamic-import specifier as the `lazy(() => import(...))` call in App.tsx,
 * so Vite emits one shared chunk and prefetching warms the exact module the router will render — no
 * duplicate download. Calling `prefetchRoute` on nav-link hover/focus turns the usual click→fetch→render
 * delay into an instant transition, without changing routing behavior: the router still lazy-loads
 * normally; this only starts that same load a little earlier.
 */

const ROUTE_IMPORTS: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Home"),
  "/about": () => import("@/pages/About"),
  "/services": () => import("@/pages/Services"),
  "/destinations": () => import("@/pages/DestinationWeddings"),
  "/wedding-stories": () => import("@/pages/WeddingStories"),
  "/gallery": () => import("@/pages/Gallery"),
  "/testimonials": () => import("@/pages/Testimonials"),
  "/contact": () => import("@/pages/Contact"),
};

const prefetched = new Set<string>();

/**
 * Warm the chunk for a public route. Safe to call repeatedly — each route is fetched at most once,
 * unknown paths are ignored, and a failed fetch is allowed to retry on the next intent.
 */
export function prefetchRoute(path: string): void {
  if (typeof window === "undefined") return;
  const key = path.replace(/[?#].*$/, "");
  if (prefetched.has(key)) return;
  const loader = ROUTE_IMPORTS[key];
  if (!loader) return;
  prefetched.add(key);
  loader().catch(() => prefetched.delete(key));
}
