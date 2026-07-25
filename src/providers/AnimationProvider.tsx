import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Progressive Animation Engine — ONE global capability decision for the whole app.
 *
 * Every expensive animation (the WebGL hero, the infinite float loops, the shimmer/particle CSS
 * keyframes) reads its permission from here instead of re-detecting device capability itself. This
 * keeps the policy in one place and guarantees a single, consistent tier per session.
 *
 * Tiers (mirrors Apple/Airbnb/Stripe-style graceful degradation):
 *   0 — minimal   : reduced-motion OR Data-Saver. Static hero, no infinite loops, no WebGL.
 *   1 — elegant   : low-end / slow-network devices. Premium 2D (Framer + CSS), but NO WebGL.
 *   2 — full      : capable device on a fast connection. Everything, including HeroCanvas.
 *
 * `allowMotion`/`allowWebGL` additionally wait for `idleReady` (first requestIdleCallback) so the
 * critical path — LCP hero image, hydration, first paint — never competes with decorative work.
 * `documentVisible` tracks tab visibility so continuous work can hard-stop on a hidden tab.
 */

export type MotionTier = 0 | 1 | 2;

export interface AnimationCapability {
  tier: MotionTier;
  /** Premium 2D animations (Framer float loops, infinite CSS) may run. */
  allowMotion: boolean;
  /** The WebGL hero canvas may mount. */
  allowWebGL: boolean;
  /** Browser tab is currently visible. */
  documentVisible: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}

interface RawCapability {
  reducedMotion: boolean;
  saveData: boolean;
  lowEnd: boolean;
  slowNet: boolean;
}

function detectCapability(): RawCapability {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { reducedMotion: false, saveData: false, lowEnd: false, slowNet: false };
  }
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = conn?.saveData === true;
  const effectiveType: string | undefined = conn?.effectiveType;
  const slowNet = Boolean(effectiveType) && !effectiveType!.includes("4g");

  // deviceMemory/hardwareConcurrency are undefined on Safari/iOS — treat unknown as capable so
  // iPhones keep the full experience; only positively-detected weak hardware is downgraded.
  const mem: number | undefined = typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
  const cores: number | undefined =
    typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : undefined;
  const lowEnd = (mem !== undefined && mem < 4) || (cores !== undefined && cores < 4);

  return { reducedMotion, saveData, lowEnd, slowNet };
}

function computeTier(c: RawCapability): MotionTier {
  if (c.reducedMotion || c.saveData) return 0;
  if (c.lowEnd || c.slowNet) return 1;
  return 2;
}

const AnimationContext = createContext<AnimationCapability | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  // Detected once — capability class does not meaningfully change within a session.
  const [raw] = useState<RawCapability>(detectCapability);
  const [idleReady, setIdleReady] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState !== "hidden"
  );

  const tier = useMemo(() => computeTier(raw), [raw]);

  // Enable decorative work only after the browser is idle (post-LCP / post-hydration).
  useEffect(() => {
    const schedule =
      typeof requestIdleCallback !== "undefined"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 2000 })
        : (cb: () => void) => window.setTimeout(cb, 800);
    const id = schedule(() => setIdleReady(true));
    return () => {
      if (typeof requestIdleCallback !== "undefined") cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const allowMotion = idleReady && tier >= 1;
  const allowWebGL = idleReady && tier === 2 && documentVisible;

  // Expose the decision to CSS as well, so infinite keyframes and heavy blur can be gated in the
  // stylesheet without per-component wiring. `full` only once premium 2D is actually enabled.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.motion = allowMotion ? "full" : "reduced";
    root.dataset.tier = String(tier);
  }, [allowMotion, tier]);

  const value = useMemo<AnimationCapability>(
    () => ({
      tier,
      allowMotion,
      allowWebGL,
      documentVisible,
      reducedMotion: raw.reducedMotion,
      saveData: raw.saveData,
    }),
    [tier, allowMotion, allowWebGL, documentVisible, raw.reducedMotion, raw.saveData]
  );

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

/**
 * Read the global animation capability. Safe outside the provider (e.g. an isolated admin shell or a
 * test): it falls back to a conservative "motion off, WebGL off" decision rather than throwing.
 */
export function useAnimationCapability(): AnimationCapability {
  const ctx = useContext(AnimationContext);
  if (ctx) return ctx;
  return {
    tier: 0,
    allowMotion: false,
    allowWebGL: false,
    documentVisible: true,
    reducedMotion: false,
    saveData: false,
  };
}
