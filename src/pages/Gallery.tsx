import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, ImageOff } from "lucide-react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useSiteContent } from "@/providers/SiteContentProvider";
import { storageProvider } from "@/storage";
import { BUNDLED_GALLERY_FALLBACKS, DEFAULT_GALLERY_CATEGORY } from "@/domains/cms/constants";

interface GalleryTile {
  id: string;
  cat: string;
  image: string;
  alt: string;
  label: string;
}

/**
 * Build an optimized, correctly-cropped Cloudinary URL for a gallery image.
 *
 * Cloudinary URLs get `c_fill` + `f_auto`/`q_auto` transforms injected so every asset — portrait,
 * landscape, square, DSLR or phone — is centre-cropped to the exact card box the CDN serves. Local
 * bundled fallbacks (paths that are not http URLs) are returned untouched; passing them through
 * `getUrl` would wrongly rewrite them into a Cloudinary path.
 */
function optimizedGridUrl(url: string, width: number, height: number): string {
  if (!url.startsWith("http")) return url;
  return storageProvider.getUrl(url, {
    width,
    height,
    crop: "fill",
    quality: "auto",
    format: "auto",
  });
}

/** Full-bleed, un-cropped variant for the lightbox — fits within a large box, never centre-crops. */
function optimizedLightboxUrl(url: string): string {
  if (!url.startsWith("http")) return url;
  return storageProvider.getUrl(url, {
    width: 1600,
    crop: "limit",
    quality: "auto",
    format: "auto",
  });
}

/** Card is a fixed 3:4 portrait. Widths cover 1–4 column layouts at up to ~2× density. */
const GRID_WIDTHS = [400, 520, 640, 800];
const GRID_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/** One premium 3:4 portrait card. Owns its own load state so images fade in over the skeleton. */
function GalleryCard({
  item,
  index,
  onOpen,
}: {
  item: GalleryTile;
  index: number;
  onOpen: (index: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const srcSet = useMemo(
    () =>
      GRID_WIDTHS.map(
        (w) => `${optimizedGridUrl(item.image, w, Math.round((w * 4) / 3))} ${w}w`
      ).join(", "),
    [item.image]
  );
  const fallbackSrc = useMemo(() => optimizedGridUrl(item.image, 520, 693), [item.image]);

  return (
    <m.button
      type="button"
      onClick={() => onOpen(index)}
      aria-label={`View image: ${item.label || item.alt}`}
      className="group relative block w-full overflow-hidden rounded-2xl bg-white text-left shadow-[0_10px_30px_-12px_rgba(20,12,4,0.18)] ring-1 ring-black/[0.04] transition-shadow duration-300 hover:shadow-[0_24px_50px_-18px_rgba(20,12,4,0.32)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ aspectRatio: "3 / 4" }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "80px" }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`gallery-item-${item.id}`}
    >
      {/* Skeleton shimmer sits under the image and reserves the exact 3:4 box (no CLS). */}
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
      )}

      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
          <ImageOff className="h-7 w-7 opacity-50" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={fallbackSrc}
          srcSet={srcSet}
          sizes={GRID_SIZES}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-[transform,opacity] duration-500 ease-out will-change-transform group-hover:scale-[1.03] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Luxury hover overlay: dark gradient wash + category, title, and a View Image affordance. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/25 to-transparent p-5 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="section-label no-line mb-1.5 text-[0.6rem] text-gold">{item.cat}</span>
        {item.label && (
          <p className="text-body line-clamp-2 text-sm !text-white/90">{item.label}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/80">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          View Image
        </span>
      </div>
    </m.button>
  );
}

export default function Gallery() {
  const { getGalleryImages, isLoading } = useSiteContent();

  // Phase A Task 1: the grid renders the CMS gallery collection ordered by `order` — exactly the data
  // the Gallery Manager writes. Fixed `gallery_grid_N` slot names are gone. The bundled set renders
  // only while the CMS gallery is empty.
  const cmsImages = getGalleryImages();

  const galleryItems: GalleryTile[] = useMemo(() => {
    if (cmsImages.length > 0) {
      return cmsImages.map((img) => ({
        id: img.slotName,
        cat: img.category || DEFAULT_GALLERY_CATEGORY,
        image: img.url,
        alt: img.altText || img.caption || "Alankaran wedding gallery image",
        label: img.caption || img.altText,
      }));
    }
    return BUNDLED_GALLERY_FALLBACKS.map((item, idx) => ({
      id: `fallback_${idx}`,
      cat: item.category,
      image: item.url,
      alt: item.label,
      label: item.label,
    }));
  }, [cmsImages]);

  // Filters follow the content, so an admin-assigned category always has a matching filter.
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(galleryItems.map((g) => g.cat)))],
    [galleryItems]
  );

  // The hero leads with the first published gallery image, so it follows the CMS ordering too.
  const heroImage = galleryItems[0]?.image || "/images/floral_stage.webp";

  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? galleryItems
        : galleryItems.filter((g) => g.cat === activeCategory),
    [activeCategory, galleryItems]
  );

  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null)),
    [filtered.length]
  );
  const nextImage = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null)),
    [filtered.length]
  );

  // Keyboard navigation for the lightbox: ESC closes, arrows page through the filtered set.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

  // Mobile swipe support for the lightbox.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? prevImage : nextImage)();
    touchStartX.current = null;
  };

  const activeTile = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Portfolio & Gallery"
        description="A visual anthology of Alankaran's luxury wedding design, featuring mandaps, floral styling, reception decor, and bridal entries."
      />
      {/* Hero */}
      <section className="relative flex h-[55vh] items-end overflow-hidden pb-20">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.85) saturate(1.0)",
          }}
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%)",
          }}
        />
        <div className="relative z-20 mx-auto max-w-screen-xl px-6 lg:px-12">
          <m.p className="section-label mb-4 text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Portfolio
          </m.p>
          <m.h1
            className="text-display text-5xl text-white lg:text-8xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
          >
            A Visual <em className="text-gold-gradient not-italic">Anthology</em>
          </m.h1>
        </div>
      </section>

      {/* Sticky luxury filter bar */}
      <div className="sticky top-0 z-30 border-b border-gold/10 bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-6 py-5 lg:px-12">
          <div
            className="flex flex-wrap gap-2.5 md:gap-3"
            role="group"
            aria-label="Filter gallery by collection"
          >
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={active}
                  className={`section-label no-line rounded-full border px-5 py-2.5 text-[0.62rem] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    active
                      ? "border-gold bg-gold text-background shadow-[0_6px_18px_-6px_rgba(176,141,87,0.6)]"
                      : "border-gold/25 text-muted-foreground hover:border-gold/60 hover:text-gold"
                  }`}
                  data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-12 lg:px-12 lg:py-16">
        {/* Fixed 3:4 portrait grid — 1 / 2 / 3 / 4 columns, all cards perfectly aligned. */}
        {isLoading && galleryItems.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl bg-gradient-to-br from-muted via-muted/60 to-muted"
                style={{ aspectRatio: "3 / 4" }}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
              <ImageOff className="h-8 w-8 text-gold/70" aria-hidden="true" />
            </div>
            <h2 className="text-display mb-3 text-2xl text-foreground">This collection is being curated</h2>
            <p className="text-body mb-8 max-w-sm">No images available in this collection yet.</p>
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className="section-label no-line rounded-full border border-gold bg-gold px-7 py-3 text-[0.62rem] text-background transition-all duration-300 hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              data-testid="btn-view-all-collections"
            >
              View All Collections
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <m.div
              key={activeCategory}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {filtered.map((item, idx) => (
                <GalleryCard key={item.id} item={item} index={idx} onOpen={openLightbox} />
              ))}
            </m.div>
          </AnimatePresence>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeTile && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(8, 6, 4, 0.9)", backdropFilter: "blur(14px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeLightbox}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${lightboxIndex! + 1} of ${filtered.length}`}
          >
            <div
              className="relative mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <m.img
                key={activeTile.id}
                src={optimizedLightboxUrl(activeTile.image)}
                alt={activeTile.alt}
                className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              {activeTile.label && (
                <p className="text-body mt-4 text-center text-xs !text-white/70">{activeTile.label}</p>
              )}

              <button
                type="button"
                aria-label="Close lightbox"
                className="absolute -top-2 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:-right-2 sm:-top-12"
                onClick={closeLightbox}
                data-testid="btn-lightbox-close"
              >
                <X className="h-6 w-6" />
              </button>
              {filtered.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:-left-16"
                    onClick={prevImage}
                    data-testid="btn-lightbox-prev"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:-right-16"
                    onClick={nextImage}
                    data-testid="btn-lightbox-next"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
