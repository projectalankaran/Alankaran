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
function stripDeferredPreloads() {
  return {
    name: "strip-deferred-modulepreloads",
    transformIndexHtml(html: string) {
      return html.replace(
        /<link[^>]*rel="modulepreload"[^>]*>/g,
        (tag) => (DEFERRED_PRELOAD_CHUNKS.some((c) => tag.includes(`/${c}-`)) ? "" : tag)
      );
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    stripDeferredPreloads(),
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
