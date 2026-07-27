import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "/";

/**
 * Rolldown emits `<link rel="modulepreload">` for lazy chunks that are only reachable through
 * `import()` (three-vendor, gsap-vendor, lenis-vendor). Those are decorative/deferred and must NOT
 * compete with the LCP for bandwidth. This plugin drops their preload hints from the built HTML so
 * they load on-demand (the runtime still fetches them when the feature actually mounts).
 */
const DEFERRED_PRELOAD_CHUNKS = [
  "three-vendor",
  "gsap-vendor",
  "lenis-vendor",
  // Firebase is loaded after first paint (SiteContentProvider/AuthContext dynamic-import it); rolldown
  // still emits eager preload hints for these lazy chunks, so drop them from the critical path.
  "firebase-vendor",
  "firestore.service",
  "inquiry.service",
];
/**
 * Orders the <head> for the critical rendering path.
 *
 * Rolldown emits, in this order: the entry `<script type="module">`, then every `<link
 * rel="modulepreload">`, and only then the `<link rel="stylesheet">`. For a client-rendered app that
 * ordering is reasonable — JS *is* the critical path. For this app it is actively wrong, because
 * every public route ships fully prerendered HTML (`scripts/prerender.mjs`): first paint needs the
 * stylesheet and nothing else, and the JS is only required later, to hydrate.
 *
 * Measured on the previous build, that inversion put ~145 KB gzip of module preloads — all of them
 * at High priority — ahead of the 25 KB stylesheet that actually gates FCP and ahead of the hero
 * image that gates LCP. This plugin fixes both halves of the problem:
 *
 *   1. Deferred chunks (below) keep having their preload hints dropped entirely — they are reachable
 *      only through `import()` and must not be fetched before the feature mounts.
 *   2. Every surviving modulepreload is demoted with `fetchpriority="low"`. They are still
 *      *discovered* immediately (so the module graph never serialises into a waterfall of round
 *      trips), but the browser schedules them beneath the stylesheet and the LCP image.
 *   3. The stylesheet is hoisted above the entry script so the render-blocking resource is both
 *      discovered and requested first.
 */
function orderCriticalPath() {
  return {
    name: "order-critical-path",
    enforce: "post" as const,
    transformIndexHtml(html: string) {
      // 1 + 2 — drop deferred hints, demote the rest.
      let out = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, (tag) => {
        if (DEFERRED_PRELOAD_CHUNKS.some((c) => tag.includes(`/${c}-`))) return "";
        return tag.includes("fetchpriority")
          ? tag
          : tag.replace(/>$/, ' fetchpriority="low">');
      });

      // 3 — hoist stylesheets above the entry module script. Pull them out, then reinsert
      // immediately before the first module script so the parser sees CSS first.
      const stylesheets: string[] = [];
      out = out.replace(/[ \t]*<link[^>]*rel="stylesheet"[^>]*>\n?/g, (tag) => {
        // Only relocate build-emitted asset stylesheets; leave the hand-authored Google Fonts
        // <noscript> fallback in index.html exactly where it is.
        if (!tag.includes("/assets/")) return tag;
        stylesheets.push(tag.trim());
        return "";
      });

      if (stylesheets.length) {
        out = out.replace(
          /(<script[^>]*type="module"[^>]*><\/script>)/,
          `${stylesheets.join("\n    ")}\n    $1`
        );
      }

      return out;
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    orderCriticalPath(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    // ── Target modern browsers → smaller output, no legacy polyfills ──
    target: ["es2020", "chrome87", "firefox78", "safari14"],
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // ── Fine-grained code splitting: each lazy chunk is only
        //    downloaded when that feature is actually needed ──
        manualChunks(id) {
          // Three.js + R3F: ~600KB — only loads when HeroCanvas/DecorCanvas mount
          if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) {
            return "three-vendor";
          }
          // Firebase (app + auth + firestore): large — isolated so it caches independently
          // of the rest of the vendor graph and never bloats an unrelated chunk.
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "firebase-vendor";
          }
          // GSAP + ScrollTrigger: only loads on scroll events
          if (id.includes("node_modules/gsap")) {
            return "gsap-vendor";
          }
          // Framer Motion: loads with first animated component
          if (id.includes("node_modules/framer-motion")) {
            return "framer-motion-vendor";
          }
          // Lenis smooth scroll: loads after hydration
          if (id.includes("node_modules/lenis")) {
            return "lenis-vendor";
          }
          // Wouter router: tiny but keeps it isolated
          if (id.includes("node_modules/wouter")) {
            return "router-vendor";
          }
          // Icons and UI utilities
          if (id.includes("node_modules/lucide-react") || id.includes("node_modules/react-icons")) {
            return "icons-vendor";
          }
          // All other node_modules → shared vendor chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        // Content-hash filenames → immutable CDN/browser caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
      // ── Tree-shake: these pure side-effect-free packages are safe ──
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
