import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { Link } from "wouter";
import { m, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteContent } from "@/providers/SiteContentProvider";
import { heroImageUrl } from "@/utils/cloudinaryImage";
import { useAnimationCapability } from "@/providers/AnimationProvider";
import { useInViewport } from "@/hooks/useInViewport";

const HeroCanvas = lazy(() => import("@/components/HeroCanvas"));

export default function HeroSection() {
  const { getSlotImage } = useSiteContent();
  const { allowWebGL, allowMotion } = useAnimationCapability();
  const [currentLandingSlide, setCurrentLandingSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Pointer parallax lives entirely outside React: the listener writes a MotionValue (for the CSS
  // parallax on the heading) and a plain ref (for the WebGL light). Neither triggers a re-render —
  // this replaces the old mouseX/mouseY state that re-rendered the whole hero on every mouse event.
  const pointerRef = useRef({ x: 0, y: 0 });

  // The WebGL layer mounts ONLY when the global engine says the device is capable AND the hero is
  // actually on screen. Scrolling past it unmounts the canvas → zero RAF / zero GPU. `allowWebGL`
  // already folds in idle-ready, tab-visibility, reduced-motion, Data-Saver, memory/cores/connection.
  const { ref: heroRef, inView: heroInView } = useInViewport<HTMLElement>({ rootMargin: "200px" });
  const mount3D = allowWebGL && heroInView;

  // Memoized: rebuilt only when CMS content changes, not on every render (was re-running 5×
  // getSlotImage + 5× heroImageUrl on each interval tick / resize / pointer move).
  const landingSlides = useMemo(
    () => [
      {
        image: heroImageUrl(getSlotImage("hero", "hero_main", "/images/hero-mandap.webp", "Alankaran Royal Mandap").url),
        title: "ALANKARAN",
        subtitle: "Hyderabad's Premier Luxury Wedding Planners & Designers",
        tagline: "✦ BESPOKE NIZAMI ROYALTY & MODERN ROMANCE ✦"
      },
      {
        image: heroImageUrl(getSlotImage("hero", "hero_secondary", "/images/gallery-royal-1.webp", "Elevated Artistry").url),
        title: "ELEVATED ARTISTRY",
        subtitle: "Immersive Architectural Decor & Floral Styling",
        tagline: "✦ COMPOSING ETERNAL MEMORIES ✦"
      },
      {
        image: heroImageUrl(getSlotImage("hero", "hero_slide_3", "/images/cinematic_floral_wedding.webp", "Grand Celebrations").url),
        title: "GRAND CELEBRATIONS",
        subtitle: "Flawless Execution Rooted in Splendor and Grace",
        tagline: "✦ ESTABLISHED 2011 — HYDERABAD ✦"
      },
      {
        image: heroImageUrl(getSlotImage("hero", "hero_slide_4", "/images/mughal_garden.webp", "Mughal Garden Luxury").url),
        title: "MUGHAL GARDEN LUXURY",
        subtitle: "Symmetry, Blooms & Sacred Temple Floristry",
        tagline: "✦ EVERY DETAIL CREATED WITH DELIBERATE INTENT ✦"
      },
      {
        image: heroImageUrl(getSlotImage("hero", "hero_slide_5", "/images/hero-couple.webp", "Royal Couple Portrait").url),
        title: "ROYAL LUXURY",
        subtitle: "Nizami Splendor & Modern Romance",
        tagline: "✦ AN ANTHOLOGY OF LOVE STORIES ✦"
      }
    ],
    [getSlotImage]
  );

  const slideCount = landingSlides.length;

  // Stable interval: depends only on the (fixed) slide count and pauses while the hero is off screen
  // or the tab is hidden — no more tearing down/recreating the timer on every slide, and no wasted
  // crossfades animating a hero nobody is looking at. Functional update avoids a currentSlide dep.
  useEffect(() => {
    if (!heroInView) return;
    const timer = setInterval(() => {
      setCurrentLandingSlide((prev) => (prev + 1) % slideCount);
    }, 4500);
    return () => clearInterval(timer);
  }, [slideCount, heroInView]);

  const nextLandingSlide = () => {
    setCurrentLandingSlide((prev) => (prev + 1) % landingSlides.length);
  };

  const prevLandingSlide = () => {
    setCurrentLandingSlide((prev) => (prev - 1 + landingSlides.length) % landingSlides.length);
  };

  const springX = useSpring(0, { stiffness: 60, damping: 20 });
  const springY = useSpring(0, { stiffness: 60, damping: 20 });
  const heroMoveX = useTransform(springX, [-1, 1], [-18, 18]);
  const heroMoveY = useTransform(springY, [-1, 1], [-10, 10]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pointer parallax only when premium motion is enabled (skips reduced-motion / low-end / Data-Saver).
  // Writes a MotionValue + a ref, never React state — so it costs one style update, not a re-render.
  useEffect(() => {
    if (!allowMotion) return;
    const onMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.x = x;
      pointerRef.current.y = y;
      springX.set(x);
      springY.set(y);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, [allowMotion, springX, springY]);

  return (
    <>
      {/* ─── PREMIUM FULL-SCREEN HERO LANDING SLIDER ─── */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black select-none">
        {/* Background Auto-changing Slides */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <m.div
              key={currentLandingSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Cinematic Scale Zoom Animation */}
              <m.img
                src={landingSlides[currentLandingSlide].image}
                alt="Alankaran Luxury Weddings"
                initial={{ scale: 1 }}
                animate={{ scale: 1.08 }}
                transition={{ duration: 5, ease: "linear" }}
                className="w-full h-full object-cover"
                fetchPriority={currentLandingSlide === 0 ? "high" : "auto"}
                loading={currentLandingSlide === 0 ? "eager" : "lazy"}
                decoding={currentLandingSlide === 0 ? "sync" : "async"}
              />
            </m.div>
          </AnimatePresence>
          {mount3D && (
            <Suspense fallback={null}>
              <HeroCanvas pointer={pointerRef} isMobile={isMobile} />
            </Suspense>
          )}
        </div>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 z-10 bg-black/50" />
        <div
          className="absolute inset-0 z-10"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Center-Aligned Luxury Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6 lg:px-12">
          {/* Top Label Tagline */}
          <m.div
            className="flex items-center justify-center gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="h-px w-8 bg-white/60" />
            <span className="font-sans font-semibold text-white/85 text-[10px] tracking-[0.4em] uppercase">
              ✦ EST. 2011 - HYDERABAD, INDIA ✦
            </span>
            <div className="h-px w-8 bg-white/60" />
          </m.div>

          {/* Heading */}
          <m.h1
            className="text-display text-5xl sm:text-6xl md:text-8xl lg:text-[7.5rem] text-white font-serif uppercase tracking-[0.08em] mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            style={{ x: heroMoveX, y: heroMoveY }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            Crafting Timeless
            <br />
            <span className="font-script italic text-gold-gradient normal-case text-[1.2em] -mt-4 block lg:inline-block md:ml-4">
              Luxury
            </span>{" "}
            Weddings
          </m.h1>

          {/* Description */}
          <m.p
            className="max-w-2xl mx-auto text-base md:text-lg mb-10 text-white/90 font-light drop-shadow leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            Alankaran is a premier Hyderabad-based luxury wedding planner and management studio, crafting bespoke floral decors, mandaps, and grand royal celebrations rooted in Nizami heritage.
          </m.p>

          {/* Two CTA Buttons */}
          <m.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <Link href="/contact">
              <m.button
                className="px-8 py-4 bg-gold text-primary-foreground font-sans font-medium tracking-widest text-xs uppercase hover:bg-gold-hover hover:gold-glow transition-all cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                data-testid="btn-plan-celebration"
              >
                Plan Your Wedding
              </m.button>
            </Link>
            <Link href="/wedding-stories">
              <m.button
                className="px-8 py-4 border-2 border-white/70 text-white font-sans font-medium tracking-widest text-xs uppercase hover:bg-card-bg hover:text-gold hover:border-gold transition-all cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                data-testid="btn-explore-weddings"
              >
                Explore Stories
              </m.button>
            </Link>
          </m.div>
        </div>

        {/* Minimalist Navigation Dots */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {landingSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentLandingSlide(idx)}
              className={`h-1.5 transition-all duration-500 rounded-full cursor-pointer ${idx === currentLandingSlide ? "w-8 bg-gold" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Manual Left Arrow */}
        <button
          onClick={prevLandingSlide}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-gold hover:bg-gold/15 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Manual Right Arrow */}
        <button
          onClick={nextLandingSlide}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-gold hover:bg-gold/15 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Luxury Scroll Guide Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <m.div
            className="flex flex-col items-center gap-3 cursor-pointer pointer-events-auto group"
            onClick={() => {
              const target = document.getElementById("luxury-showcase");
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-[9px] font-sans tracking-[0.4em] uppercase text-white/50 group-hover:text-gold transition-colors">Scroll</span>
            <div className="w-[18px] h-8 rounded-full border border-white/20 flex justify-center p-1 bg-black/10 backdrop-blur-[2px] group-hover:border-gold/40 transition-colors">
              <m.div
                className="w-1.5 h-1.5 rounded-full bg-gold"
                animate={allowMotion ? { y: [0, 12, 0], opacity: [1, 0.4, 1] } : { y: 0, opacity: 1 }}
                transition={allowMotion ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" } : { duration: 0 }}
              />
            </div>
          </m.div>
        </div>
      </section>
    </>
  );
}
