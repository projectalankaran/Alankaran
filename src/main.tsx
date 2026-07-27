import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root")!;

/**
 * Hydrate, don't re-render.
 *
 * The production build ships fully prerendered HTML for every public route (see
 * `scripts/prerender.mjs`). `createRoot().render()` does not adopt that markup — it *discards* the
 * container's children and rebuilds the tree from scratch. That threw away ~75 KB of already-painted
 * HTML on every cold load, and because the hero <img> was destroyed and re-inserted, the browser
 * treated the replacement as a new LCP candidate.
 *
 * `vite dev` serves the raw template, where #root still holds the `<!--app-html-->` placeholder and
 * there is nothing to hydrate. `childElementCount` is the right discriminator: a comment node is not
 * an element, so the dev template reads as empty while any prerendered output reads as populated.
 */
if (container.childElementCount > 0) {
  hydrateRoot(container, <App />, {
    onRecoverableError(error, errorInfo) {
      // A recovered hydration error means the server and client disagreed and React silently
      // repaired the DOM — exactly the class of bug that reintroduces the "content gets replaced"
      // problem this migration removed. Surface it loudly in development.
      if (import.meta.env.DEV) {
        console.error("[hydration] recoverable error — server/client markup diverged:", error, errorInfo);
      }
    },
  });
} else {
  createRoot(container).render(<App />);
}
