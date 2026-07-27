import { Link } from "wouter";
import { localBackgroundUrl } from "@/utils/localImage";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { m, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { useSiteContent } from "@/providers/SiteContentProvider";
import { useAnimationCapability } from "@/providers/AnimationProvider";

const services = [
  { name: "Wedding Planning", desc: "From vision to reality — every detail orchestrated with precision and care." },
  { name: "Luxury Wedding Decor", desc: "Bespoke environments crafted from the finest materials and floral artistry." },
  { name: "Floral Styling", desc: "Living sculptures of bloom, fragrance, and texture that define a space." },
  { name: "Mandap Design", desc: "Sacred ceremonial spaces elevated into architectural masterpieces." },
  { name: "Engagement Decor", desc: "Intimate celebrations adorned with warmth, softness, and intention." },
  { name: "Reception Styling", desc: "Grand, luminous evenings designed to be felt long after the last dance." },
  { name: "Royal Theme Weddings", desc: "The grandeur of Indian royalty, reimagined for the modern celebration." },
  { name: "Wedding Stage Design", desc: "Statement stages that command presence and frame every photograph." },
  { name: "Bridal Entry Concepts", desc: "Arrivals so breathtaking, every guest will pause in silence." },
  { name: "Custom Event Styling", desc: "Singular creative vision applied to every facet of your celebration." },
];

const themes = [
  { name: "Rajasthani Royal", sub: "Desert gold & palace grandeur" },
  { name: "Mughal Garden", sub: "Symmetry, blooms & marble luxury" },
  { name: "Contemporary Luxe", sub: "Editorial precision meets warmth" },
  { name: "Temple Floristry", sub: "Sacred devotion meets living art" },
  { name: "Nawabi Elegance", sub: "Lucknow courts & chikan refinement" },
];

const stories = [
  { couple: "Priya & Arjun", date: "March 2024", location: "Udaipur, Rajasthan", theme: "Royal Palace" },
  { couple: "Meera & Rohit", date: "January 2024", location: "Goa", theme: "Coastal Elegance" },
  { couple: "Ananya & Vikram", date: "November 2023", location: "Jaipur Palace", theme: "Mughal Garden" },
];

const testimonials = [
  { text: "Alankaran turned our dream into reality. Every detail was beyond what we imagined.", client: "Priya & Arjun", location: "Udaipur" },
  { text: "The mandap design was breathtaking. Our guests are still talking about it months later.", client: "Meera & Rohit", location: "Goa" },
  { text: "From the first consultation to the last petal, the attention to detail was extraordinary.", client: "Ananya & Vikram", location: "Jaipur" },
];

function WeddingImage({ image, aspectClass = "aspect-[4/5]", label = "" }: { image: string; aspectClass?: string; label?: string }) {
  return (
    <div className={`group ${aspectClass} relative overflow-hidden rounded-2xl border border-gold/15 shadow-sm hover:shadow-xl hover:shadow-gold/10 transition-all duration-700 bg-muted`}>
      <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
        src={image}
        alt={label || "Wedding Decor"}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.6s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
        decoding="async"
      />
      <div className="absolute inset-3 border border-gold/10 pointer-events-none rounded-xl z-10 transition-all duration-700 group-hover:border-gold/30 group-hover:inset-4" />
      <div className="absolute inset-0 flex items-end p-5 z-20 transition-all duration-700" style={{ background: "linear-gradient(to top, rgba(42,36,33,0.5) 0%, rgba(42,36,33,0.1) 40%, transparent 100%)" }}>
        {label && (
          <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
            <span className="font-sans font-medium text-xs tracking-widest text-white uppercase">{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeBelowFold({ pulseHighlight }: { pulseHighlight: boolean }) {
  const { getGalleryImages } = useSiteContent();
  const { allowMotion } = useAnimationCapability();

  // Progressive float: an infinite loop that ONLY runs while the section is on screen (whileInView →
  // Framer pauses it on scroll-out) and ONLY on capable, motion-friendly devices. On low-end / reduced-
  // motion / Data-Saver the circles render perfectly still — same layout, zero continuous RAF cost.
  const float = (keyframes: TargetAndTransition, duration: number, delay = 0) =>
    allowMotion
      ? {
          whileInView: keyframes,
          viewport: { once: false, amount: 0 },
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay },
        }
      : {};

  // Phase A Task 1: the home page showcases the CMS gallery collection in published order. Each
  // position falls back to its bundled asset until the admin has uploaded that many gallery images.
  const gallery = getGalleryImages();
  const pick = (index: number, fallbackUrl: string) => gallery[index]?.url || fallbackUrl;

  const images = [
    pick(0, "/images/royal_mandap.webp"),
    pick(1, "/images/coastal_wedding.webp"),
    pick(2, "/images/mughal_garden.webp"),
    pick(3, "/images/floral_stage.webp"),
    pick(4, "/images/bridal_entry.webp"),
    pick(5, "/images/engagement_decor.webp"),
    pick(6, "/images/grand_reception.webp"),
    pick(7, "/images/floral_detail.webp"),
  ];

  const mandapDetailImage = pick(8, "/images/mandap_floral_detail.webp");

  // Every tile below the fold is driven by the gallery collection. This deliberately does NOT reuse
  // `hero.hero_slide_3` — doing so meant replacing Hero Slide 3 silently changed this cinematic tile
  // too, so one CMS card controlled two unrelated places on the page.
  const cinematicImages = [
    pick(9, "/images/cinematic_floral_wedding.webp"),
    pick(10, "/images/coastal_sunset_wedding.webp"),
    pick(11, "/images/royal_palace_reception.webp"),
  ];

  return (
    <>
      {/* ─── LUXURY SHOWCASE ─── */}
      <section id="luxury-showcase" className="py-24 lg:py-32 max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 items-center relative">
          <div className="col-span-1 space-y-6">
            <WeddingImage image={images[0]} aspectClass="aspect-[4/5]" label="Nizami Mandap" />
            <WeddingImage image={images[4]} aspectClass="aspect-[4/5]" label="Bridal Entry" />
          </div>
          <div className="col-span-1 space-y-6">
            <WeddingImage image={images[1]} aspectClass="aspect-[4/5]" label="Coastal Symphony" />
            <WeddingImage image={images[5]} aspectClass="aspect-[4/5]" label="Engagement Soirée" />
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col justify-center items-start px-4 md:px-8">
            <p className="section-label mb-4 text-gold">Our Work</p>
            <h2 className="text-display text-5xl lg:text-7xl mb-6 text-foreground">
              Crafted<br />With<br /><em className="not-italic text-gold-gradient">Intention</em>
            </h2>
            <p className="font-sans font-light text-muted-foreground text-sm leading-relaxed mb-8">
              Every arrangement, every fabric drape, every candlelit moment — chosen with deliberate creative intent.
            </p>
            <Link href="/gallery">
              <m.button
                className="px-8 py-3 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid="btn-view-gallery"
              >
                Explore Gallery
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gold divider */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="h-px" style={{ background: "hsl(46 30% 82%)" }} />
      </div>

      {/* ─── ABOUT PREVIEW ─── */}
      <section className="py-24 lg:py-36 max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-label mb-6 text-gold">Our Philosophy</p>
            <h2 className="text-display text-4xl lg:text-6xl mb-8 text-foreground">
              Where Heritage Meets<br />
              <em className="not-italic text-gold-gradient">Modern Romance</em>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/about">
                <m.button
                  className="px-8 py-3 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all"
                  whileHover={{ scale: 1.02 }}
                  data-testid="btn-our-story"
                >
                  Our Story
                </m.button>
              </Link>
              <Link href="/contact">
                <m.button
                  className="px-8 py-3 border border-gold text-gold section-label hover:bg-gold/5 transition-all"
                  whileHover={{ scale: 1.02 }}
                >
                  Get in Touch
                </m.button>
              </Link>
            </div>
          </div>
          <div className="space-y-6">
            {[
              "Every celebration is composed like a work of art.",
              "Florals, textures, rituals, and spaces are designed into one cinematic experience.",
              "From intimate ceremonies to grand royal weddings, every detail is curated with grace.",
              "We don't decorate spaces — we compose experiences.",
            ].map((text, i) => (
              <div key={i}>
                <div className="h-px mb-4" style={{ background: "hsl(46 30% 82%)" }} />
                <p className="text-quote text-lg lg:text-xl text-foreground">
                  &ldquo;{text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-24 lg:py-32 relative bg-luxury-gradient">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="section-label mb-4 text-gold justify-center">What We Do</p>
            <h2 className="text-display text-4xl lg:text-6xl text-foreground">Signature Services</h2>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          >
            {services.map((s, i) => (
              <m.div
                key={s.name}
                className="service-card bg-card border border-border/40 p-5 cursor-pointer group relative overflow-hidden transition-colors hover:border-gold/60"
                whileHover={{ y: -6, boxShadow: "0 10px 30px rgba(176, 141, 87, 0.15)" }}
                transition={{ duration: 0.3 }}
                data-testid={`card-service-${i}`}
              >
                <div className="text-gold/20 font-serif text-4xl absolute top-2 right-4 group-hover:text-gold/40 transition-colors">
                  0{i + 1}
                </div>
                <div
                  className="w-full aspect-[4/3] mb-4 relative z-10"
                  style={{ backgroundImage: `url(${localBackgroundUrl(images[i % images.length])})`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
                <h3 className="font-serif text-lg mb-2 text-foreground">{s.name}</h3>
                <p className="text-body text-[13px]">
                  {s.desc}
                </p>
              </m.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/services">
              <m.button
                className="px-10 py-4 btn-outline-gold section-label transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid="btn-all-services"
              >
                View All Services
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── INLINE CTA STRIP ─── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 mt-16">
        <div className="bg-foreground rounded-xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-serif text-background text-lg">Ready to begin your wedding journey?</p>
            <p className="font-sans text-background/60 text-xs font-light mt-0.5">Talk to our expert and get a personalised quote today.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/contact">
              <m.button className="px-6 py-3 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all" whileHover={{ scale: 1.03 }}>
                Talk to an Expert
              </m.button>
            </Link>
            <Link href="/contact">
              <m.button className="px-6 py-3 border border-background/30 text-background section-label hover:bg-background/10 transition-all" whileHover={{ scale: 1.03 }}>
                Get a Quote
              </m.button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ROYAL THEMES ─── */}
      <section id="royal-themes" className={`py-24 lg:py-32 transition-all duration-500 ${pulseHighlight ? "royal-theme-pulse" : ""}`}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
            <div>
              <p className="section-label mb-4 text-gold">Collections</p>
              <h2 className="text-display text-4xl lg:text-6xl text-foreground">Royal Wedding Themes</h2>
            </div>
            <Link href="/services">
              <m.button
                className="shrink-0 px-8 py-3 btn-outline-gold section-label transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid="btn-all-themes"
              >
                View All Themes
              </m.button>
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
            {themes.map((t, i) => (
              <m.div
                key={t.name}
                className="flex-none snap-center w-72 md:w-80"
                whileHover={{ scale: 1.02 }}
                data-testid={`card-theme-${i}`}
              >
                <div
                  className="aspect-[3/4] relative overflow-hidden"
                  style={{ backgroundImage: `url(${localBackgroundUrl(images[(i + 2) % images.length])})`, backgroundSize: "cover", backgroundPosition: "center" }}
                >
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-6"
                    style={{ background: "linear-gradient(to top, hsl(150 15% 10% / 0.7) 0%, transparent 60%)" }}
                  >
                    <h3 className="font-serif text-2xl text-white mb-1">{t.name}</h3>
                    <p className="font-sans text-xs text-white/70" style={{ fontWeight: 300 }}>{t.sub}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gold divider */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="h-px" style={{ background: "hsl(46 30% 82%)" }} />
      </div>

      {/* ─── 3D DECOR EXPERIENCE ─── */}
      <section className="py-24 lg:py-36">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-4 text-gold">Immersive Design</p>
              <h2 className="text-display text-4xl lg:text-6xl mb-6 text-foreground">
                Experience the<br />
                <em className="not-italic text-gold-gradient">Extraordinary</em>
              </h2>
              <p className="text-body text-sm mb-8 max-w-md">
                Our design process is tactile, immersive, and deeply considered. Every material is chosen not just to be seen, but to be felt.
              </p>
              <Link href="/services">
                <m.button
                  className="px-8 py-3 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all"
                  whileHover={{ scale: 1.02 }}
                  data-testid="btn-discover-services"
                >
                  Discover Our Process
                </m.button>
              </Link>
            </div>
            {/* Floating image circles */}
            <div className="relative h-96 lg:h-[500px] select-none">
              {/* Large center circle */}
              <m.div
                className="absolute rounded-full overflow-hidden border-4 border-white shadow-2xl"
                style={{ width: 260, height: 260, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                {...float({ y: ["-52%", "-48%", "-52%"] }, 6)}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000" src={images[0]} alt="Royal mandap" className="w-full h-full object-cover" decoding="async" />
              </m.div>

              {/* Top-right medium circle */}
              <m.div
                className="absolute rounded-full overflow-hidden border-4 border-white shadow-xl"
                style={{ width: 150, height: 150, top: "4%", right: "4%" }}
                {...float({ y: [0, -12, 0] }, 5, 0.8)}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000" src={images[2]} alt="Mughal garden" className="w-full h-full object-cover" decoding="async" />
              </m.div>

              {/* Bottom-left small circle */}
              <m.div
                className="absolute rounded-full overflow-hidden border-4 border-white shadow-xl"
                style={{ width: 110, height: 110, bottom: "8%", left: "8%" }}
                {...float({ y: [0, 10, 0] }, 4.5, 1.2)}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000" src={images[4]} alt="Bridal entry" className="w-full h-full object-cover" decoding="async" />
              </m.div>

              {/* Bottom-right small circle */}
              <m.div
                className="absolute rounded-full overflow-hidden border-4 border-white shadow-lg"
                style={{ width: 90, height: 90, bottom: "14%", right: "10%" }}
                {...float({ y: [0, -8, 0] }, 5.5, 0.3)}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000" src={images[5]} alt="Engagement decor" className="w-full h-full object-cover" decoding="async" />
              </m.div>

              {/* Top-left tiny accent circle */}
              <m.div
                className="absolute rounded-full overflow-hidden border-2 border-gold/40 shadow-md"
                style={{ width: 68, height: 68, top: "16%", left: "6%" }}
                {...float({ y: [0, 7, 0] }, 4, 2)}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000" src={images[7]} alt="Floral detail" className="w-full h-full object-cover" decoding="async" />
              </m.div>

              {/* Decorative gold ring behind main circle */}
              <div
                className="absolute rounded-full border border-gold/20 pointer-events-none"
                style={{ width: 300, height: 300, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CINEMATIC IMAGE GRID ─── */}
      <section className="py-12 lg:py-20 bg-muted/20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="section-label mb-3 text-gold justify-center">Visual Anthology</p>
            <h2 className="text-display text-3xl lg:text-5xl text-foreground mb-6">Every Frame, a Memory</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-4 gap-4 md:gap-6 h-auto md:h-[800px] lg:h-[950px] xl:h-[1050px] w-full">
            {/* Item 1: Wide landscape (Row 1-2, Col 1-2) */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl group shadow-sm bg-muted aspect-[16/10] md:aspect-auto">
              <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
                src={images[1]}
                alt="Luxury wedding moment"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                <span className="font-sans font-medium text-xs tracking-widest text-white uppercase">Romantic Symphony</span>
              </div>
            </div>

            {/* Item 2: Small landscape (Row 1, Col 3) */}
            <div className="md:col-span-1 md:row-span-1 relative overflow-hidden rounded-2xl group shadow-sm bg-muted aspect-[4/3] md:aspect-auto">
              <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
                src={images[2]}
                alt="Mughal garden wedding"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                <span className="font-sans font-medium text-xs tracking-widest text-white uppercase">Mughal Majesty</span>
              </div>
            </div>

            {/* Item 3: Small landscape (Row 2, Col 3) */}
            <div className="md:col-span-1 md:row-span-1 relative overflow-hidden rounded-2xl group shadow-sm bg-muted aspect-[4/3] md:aspect-auto">
              <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
                src={images[3]}
                alt="Floral stage design"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                <span className="font-sans font-medium text-xs tracking-widest text-white uppercase">Floral Splendor</span>
              </div>
            </div>

            {/* Item 4: Tall portrait (Row 3-4, Col 1) */}
            <div className="md:col-span-1 md:row-span-2 relative overflow-hidden rounded-2xl group shadow-sm bg-muted aspect-[3/4] md:aspect-auto">
              <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
                src={mandapDetailImage}
                alt="Mandap floral detail"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                <span className="font-sans font-medium text-xs tracking-widest text-white uppercase">Sacred Spaces</span>
              </div>
            </div>

            {/* Item 5: Wide landscape (Row 3-4, Col 2-3) */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl group shadow-sm bg-muted aspect-[16/10] md:aspect-auto">
              <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
                src={images[0]}
                alt="Royal mandap"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                <span className="font-sans font-medium text-xs tracking-widest text-white uppercase">The Grand Palace</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/gallery">
              <m.button
                className="px-10 py-4 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all"
                whileHover={{ scale: 1.02 }}
              >
                Browse Full Gallery
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA STRIP 2 ─── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-6">
        <div className="bg-card border border-border/60 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-serif text-foreground text-lg">Check Date Availability</p>
            <p className="font-sans text-muted-foreground text-xs font-light mt-0.5">Your wedding date may already be in demand — confirm yours now.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/contact">
              <m.button className="px-6 py-3 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all" whileHover={{ scale: 1.03 }}>
                Check Availability
              </m.button>
            </Link>
            <Link href="/contact">
              <m.button className="px-6 py-3 btn-outline-gold section-label transition-all" whileHover={{ scale: 1.03 }}>
                Get Instant Budget
              </m.button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── WEDDING STORIES ─── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="section-label mb-4 text-gold justify-center">Real Weddings</p>
            <h2 className="text-display text-4xl lg:text-6xl text-foreground">Wedding Stories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((s, i) => (
              <m.div
                key={s.couple}
                className="glass-card overflow-hidden group relative aspect-[4/5]"
                whileHover={{ y: -4, boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)" }}
                data-testid={`card-story-${i}`}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000" src={images[i % images.length]} alt={s.couple} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                  <p className="section-label mb-2 text-gold/80">{s.date} — {s.location}</p>
                  <h3 className="font-serif text-3xl mb-1 text-white">{s.couple}</h3>
                  <p className="text-body text-sm text-white/70">{s.theme}</p>
                </div>
              </m.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/wedding-stories">
              <m.button
                className="px-10 py-4 btn-outline-gold section-label transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid="btn-all-stories"
              >
                View All Stories
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── VIDEO REELS ─── */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="section-label mb-4 text-gold justify-center">Cinematic Stories</p>
            <h2 className="text-display text-4xl lg:text-5xl mb-4 text-foreground">Captured Moments, Eternal Stories</h2>
            <p className="text-body text-sm max-w-xl mx-auto">
              From intimate ceremonies to grand royal celebrations — every frame tells a story.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cinematicImages.map((src, i) => (
              <m.div
                key={i}
                className="relative aspect-[4/5] overflow-hidden cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                data-testid={`card-reel-${i}`}
              >
                <OptimizedImage sizes="(min-width: 768px) 50vw, 100vw" fade={false} width="800" height="1000"
                  src={src}
                  alt={`Cinematic wedding moment ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                decoding="async" />
                <div
                  className="absolute inset-0 transition-opacity duration-700 opacity-0 group-hover:opacity-100"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)" }}
                />
                <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  <span className="font-sans text-xs uppercase tracking-widest text-white/90">
                    Discover More
                  </span>
                </div>
              </m.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/wedding-stories">
              <m.button
                className="px-10 py-4 btn-outline-gold section-label transition-all"
                whileHover={{ scale: 1.02 }}
              >
                Read Wedding Stories
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PLANNING JOURNEY ─── */}
      <section className="py-24 lg:py-32 relative border-y border-gold/20 bg-luxury-gradient">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-20">
            <p className="section-label mb-4 text-gold justify-center">The Experience</p>
            <h2 className="text-display text-4xl lg:text-5xl text-foreground">Your Planning Journey</h2>
          </div>
          <div className="relative">
            {/* Horizontal Line (Desktop) */}
            <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent -translate-y-1/2" />
            {/* Vertical Line (Mobile) */}
            <div className="md:hidden absolute left-8 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-gold/50 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative z-10">
              {[
                { step: "01", title: "Discovery", desc: "Understanding your vision, style, and essential requirements." },
                { step: "02", title: "Vision", desc: "Conceptualizing the design theme and creative direction." },
                { step: "03", title: "Design", desc: "Detailed 3D renders, material selection, and floral planning." },
                { step: "04", title: "Execution", desc: "Flawless production and on-site orchestration." },
                { step: "05", title: "Celebration", desc: "You enjoy every moment while we handle the details." },
              ].map((item, i) => (
                <m.div
                  key={item.title}
                  className="flex flex-row md:flex-col items-start md:items-center text-left md:text-center gap-6 md:gap-4 group cursor-pointer"
                >
                  <div className="w-16 h-16 shrink-0 md:w-20 md:h-20 rounded-full bg-background border border-gold/40 flex items-center justify-center font-serif text-xl text-gold group-hover:bg-gold group-hover:text-primary-foreground group-hover:bg-gold-hover group-hover:gold-glow transition-all">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl mb-2 text-foreground group-hover:text-gold transition-colors">{item.title}</h3>
                    <p className="text-body text-xs px-2">{item.desc}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
          <div className="text-center mt-16">
            <Link href="/contact">
              <m.button
                className="px-10 py-4 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid="btn-start-planning"
              >
                Start Planning Your Wedding
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 lg:py-32 relative">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <p className="section-label mb-4 text-gold justify-center">Words of Love</p>
            <h2 className="text-display text-4xl lg:text-5xl text-foreground">What Our Couples Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <m.div
                key={i}
                className="glass-card p-8 relative hover:border-gold/50 transition-all hover:shadow-md"
                data-testid={`card-testimonial-${i}`}
              >
                <div className="font-serif text-6xl leading-none mb-4 text-gold/40">&ldquo;</div>
                <div className="flex gap-1 mb-4 text-gold">
                  {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-quote text-base lg:text-lg text-foreground mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="h-px mb-4 bg-gold/20" />
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-gold flex items-center justify-center text-gold font-serif">
                    {t.client.charAt(0)}
                  </div>
                  <div>
                    <p className="font-serif text-base">{t.client}</p>
                    <p className="section-label mt-1 text-gold/70">{t.location}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/testimonials">
              <m.button
                className="px-10 py-4 btn-outline-gold section-label transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid="btn-all-testimonials"
              >
                Read All Testimonials
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        className="py-32 lg:py-48 flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(347 41% 21%) 0%, hsl(347 41% 11%) 100%)" }}
      >
        <div className="relative z-10 flex flex-col items-center animate-fade-in">
          <p className="section-label mb-6 justify-center text-gold">
            Begin Your Journey
          </p>
          <h2 className="text-display text-4xl lg:text-7xl mb-6 text-card-bg">
            Begin Your Story<br />With Us
          </h2>
          <p className="mb-10 text-lg max-w-md text-card-bg/75 font-light">
            Every celebration is composed like a work of art.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact">
              <m.button
                className="px-10 py-5 section-label bg-gold text-primary-foreground hover:bg-gold-hover hover:gold-glow transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                data-testid="btn-cta-book"
              >
                Book Your Consultation
              </m.button>
            </Link>
            <Link href="/gallery">
              <m.button
                className="px-10 py-5 section-label border border-white/40 text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                View Our Gallery
              </m.button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
