import { Link } from "wouter";
import { m } from "framer-motion";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import { useSiteContent } from "@/providers/SiteContentProvider";
import { useWeddingStories } from "@/providers/WeddingStoriesProvider";

/**
 * Bundled fallback stories — the original hardcoded content. Rendered only while the CMS holds no
 * published stories, so a fresh install (or an offline visitor) still sees a complete page.
 */
const FALLBACK_STORIES = [
  {
    couple: "Priya & Arjun",
    date: "March 2024",
    location: "Udaipur, Rajasthan",
    theme: "Royal Palace",
    color: "Burgundy, Gold & Ivory",
    story: [
      "The moment Priya described her dream — a ceremony that felt like stepping inside a Mughal miniature painting — we knew this would be unlike anything we'd created before. The City Palace as backdrop, Lake Pichola shimmering at dusk, and a mandap of seven thousand marigolds and white tuberoses.",
      "Every element was chosen to feel simultaneously ancient and perfectly of this moment. The florals took three days to install. The lighting was calibrated to the exact quality of Udaipur's evening light. On the day itself, Priya's guests fell silent as she arrived through a tunnel of hanging jasmine and soft candlelight.",
    ],
  },
  {
    couple: "Meera & Rohit",
    date: "January 2024",
    location: "Goa",
    theme: "Coastal Elegance",
    color: "White, Coral & Sea Green",
    story: [
      "Meera and Rohit wanted their wedding to feel like the most beautiful version of a Goa sunset — warm, unhurried, and bathed in that particular quality of coastal light that cannot be manufactured.",
      "The ceremony was held on the cliffs above the sea, the reception in a colonial Portuguese house transformed by thousands of white florals, rattan lanterns, and the scent of sea air mixed with jasmine. Every photograph from this wedding looks like it belongs in a magazine.",
    ],
  },
  {
    couple: "Ananya & Vikram",
    date: "November 2023",
    location: "Jaipur Palace",
    theme: "Mughal Garden",
    color: "Sage, Ivory & Antique Gold",
    story: [
      "Ananya and Vikram were drawn to the idea of a garden — not a decorative garden, but an immersive living environment where every surface told a story. We created a Mughal-inspired paradise: geometric planting beds of white roses and herbs, water channels of rose petals, and a marble mandap of breathtaking intricacy.",
      "The reception was held in a courtyard where hundreds of brass lanterns cast warm geometric shadows across whitewashed walls. It was, as one guest said, 'like a dream you've never had before, but one you'll remember forever.'",
    ],
  },
];

/** Normalized shape the JSX renders, so CMS and bundled content flow through one code path. */
interface StoryView {
  key: string;
  couple: string;
  date: string;
  location: string;
  theme: string;
  color: string;
  story: string[];
  /** Four image URLs: [header, large grid, small-top, small-bottom]. */
  img: [string, string, string, string];
}

export default function WeddingStories() {
  const { getGalleryImages } = useSiteContent();
  const { hero, stories: cmsStories } = useWeddingStories();

  // Bundled imagery, drawn from the CMS gallery in published order, falling back to local assets.
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

  // CMS published stories when present; otherwise the bundled fallback set. The bundled path
  // reproduces the exact image cycling the page used before, so it stays visually identical.
  const stories: StoryView[] =
    cmsStories && cmsStories.length > 0
      ? cmsStories.map((s, i) => ({
          key: s.id,
          couple: `${s.bride} & ${s.groom}`.trim().replace(/^&\s*|\s*&$/g, "") || `Story ${i + 1}`,
          date: [s.month, s.year].filter(Boolean).join(" "),
          location: s.location,
          theme: s.theme,
          color: s.palette,
          story: [s.paragraph1, s.paragraph2].filter(Boolean),
          img: [
            s.images[0]?.url || images[i % images.length],
            s.images[1]?.url || images[(i + 1) % images.length],
            s.images[2]?.url || images[(i + 2) % images.length],
            s.images[3]?.url || images[i % images.length],
          ],
        }))
      : FALLBACK_STORIES.map((s, i) => ({
          key: s.couple,
          couple: s.couple,
          date: s.date,
          location: s.location,
          theme: s.theme,
          color: s.color,
          story: s.story,
          img: [
            images[i % images.length],
            images[(i + 1) % images.length],
            images[(i + 2) % images.length],
            images[i % images.length],
          ],
        }));

  // Hero: published CMS hero when available, otherwise the original bundled text/image.
  const heroImage = hero?.publishedImage?.url || hero?.image?.url || images[0];
  const heroSubtitle = hero?.publishedSubtitle || hero?.subtitle || "Real Weddings";
  const heroTitle1 = hero?.publishedTitleLine1 || hero?.titleLine1 || "Celebrations";
  const heroTitle2 = hero?.publishedTitleLine2 || hero?.titleLine2 || "That Live Forever";
  // Overlay opacity multiplies the original three-stop gradient; default 1 = the current look.
  const ov = hero?.publishedOverlayOpacity ?? hero?.overlayOpacity ?? 1;
  const heroGradient = `linear-gradient(to top, rgba(0,0,0,${0.72 * ov}) 0%, rgba(0,0,0,${0.25 * ov}) 60%, rgba(0,0,0,${0.4 * ov}) 100%)`;
  // Split the title's last word so it keeps the gold-gradient treatment, matching the original.
  const t2words = heroTitle2.split(" ");
  const t2lead = t2words.slice(0, -1).join(" ");
  const t2last = t2words.slice(-1)[0] || "";

  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Real Wedding Stories"
        description="Read the real wedding stories of couples who celebrated their love with Alankaran's luxury planning and styling."
        preloadImage={heroImage}
      />
      {/* Hero */}
      <section className="relative h-[65vh] flex items-end pb-20 overflow-hidden">
        <OptimizedImage fill priority src={heroImage} alt="Real Alankaran wedding stories" sizes="100vw" widths={[640, 828, 1200, 1600, 1920]} className="z-0" style={{ filter: "brightness(0.85) saturate(1.0)" }} />
        <div className="absolute inset-0 z-10" style={{ background: heroGradient }} />
        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-12 z-20">
          <m.p className="section-label mb-4 text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{heroSubtitle}</m.p>
          <m.h1 className="text-display text-5xl lg:text-8xl text-white" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 1 }}>
            {heroTitle1}<br />{t2lead} <em className="not-italic text-gold-gradient">{t2last}</em>
          </m.h1>
        </div>
      </section>

      {/* Stories */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        {stories.map((s) => (
          <article key={s.key} className="py-24 border-b border-border/40">
            {/* Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
              <div>
                <p className="section-label mb-4 text-gold">{s.date} — {s.location}</p>
                <h2 className="text-display text-4xl lg:text-6xl mb-4 text-foreground">
                  <m.span
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9 }}
                  >
                    {s.couple}
                  </m.span>
                </h2>
                <div className="flex gap-4 mt-8">
                  <div>
                    <p className="section-label mb-1 text-gold/80">Theme</p>
                    <p className="font-sans text-sm font-light text-muted-foreground">{s.theme}</p>
                  </div>
                  <div className="w-px bg-gold/20" />
                  <div>
                    <p className="section-label mb-1 text-gold/80">Palette</p>
                    <p className="font-sans text-sm font-light text-muted-foreground">{s.color}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden group glass-card">
                <div className="aspect-[16/9] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${s.img[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              </div>
            </div>

            {/* Story text */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {s.story.map((para, j) => (
                <p key={j} className="text-body text-sm">
                  {para}
                </p>
              ))}
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 overflow-hidden group">
                <div className="w-full h-full aspect-[16/9] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${s.img[1]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              </div>
              <div className="space-y-3 flex flex-col">
                <div className="overflow-hidden group flex-1">
                  <div className="w-full h-full min-h-[150px] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${s.img[2]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
                <div className="overflow-hidden group flex-1">
                  <div className="w-full h-full min-h-[150px] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${s.img[3]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
              </div>
            </div>
          </article>
        ))}

      </div>

      <Footer />
    </div>
  );
}
