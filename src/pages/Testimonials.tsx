import { m } from "framer-motion";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import { useSiteContent } from "@/providers/SiteContentProvider";

const testimonials = [
  {
    quote: "Alankaran didn't just plan our wedding — they created an experience that will live in our hearts forever. Every detail, every bloom, every moment of light was deliberate and breathtaking.",
    client: "Divya & Karan",
    location: "Jodhpur, Rajasthan",
    date: "February 2024",
  },
  {
    quote: "Every element was curated with such precision and love. Our Udaipur wedding was a dream realized — a dream we didn't even know we had until Alankaran showed us what was possible.",
    client: "Priya & Arjun",
    location: "Udaipur, Rajasthan",
    date: "March 2024",
  },
  {
    quote: "The mandap was beyond imagination. Our guests gasped as they entered the venue. I had to remind myself that this was actually happening — it felt too beautiful to be real.",
    client: "Meera & Rohit",
    location: "Goa",
    date: "January 2024",
  },
  {
    quote: "From intimate mehendi to grand reception — everything was flawlessly executed. Alankaran managed every detail so we could simply be present and enjoy every single moment.",
    client: "Ananya & Vikram",
    location: "Jaipur, Rajasthan",
    date: "November 2023",
  },
  {
    quote: "Alankaran understood our vision before we could even articulate it. They are true artists — the kind who listen not just to your words but to what you feel when you close your eyes and dream.",
    client: "Shreya & Dev",
    location: "Mumbai, Maharashtra",
    date: "December 2023",
  },
  {
    quote: "The florals, the lighting, the textures — it all felt like walking into a fairy tale. Six months later, our guests are still talking about the beauty of that evening. Some have cried remembering it.",
    client: "Kavya & Raj",
    location: "Delhi",
    date: "October 2023",
  },
];

export default function Testimonials() {
  const { getSlotImage } = useSiteContent();
  const heroBg = getSlotImage("testimonials", "testimonials_hero", "/images/floral_detail.webp", "Alankaran Client Testimonials").url;

  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Client Testimonials"
        description="Hear from our couples. Read testimonials and reviews about Alankaran's luxury wedding planning and decor services."
        preloadImage={heroBg}
      />
      {/* Hero */}
      <section className="relative h-[55vh] flex items-end pb-20 overflow-hidden">
        <OptimizedImage fill priority src={heroBg} alt="Alankaran client testimonials" sizes="100vw" widths={[640, 828, 1200, 1600, 1920]} className="z-0" style={{ filter: "brightness(0.85) saturate(1.0)" }} />
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%)" }} />
        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-12 z-20">
          <m.p className="section-label mb-4 text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Client Love</m.p>
          <m.h1 className="text-display text-5xl lg:text-8xl text-white" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 1 }}>
            Words of <em className="not-italic text-gold-gradient">Love</em>
          </m.h1>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-16">
        {/* Intro quote */}
        <div className="border-b border-border/40 pb-16 mb-16 text-center">
          <p className="text-quote text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            &ldquo;The greatest measure of our work is not the photographs — it&rsquo;s the way our couples feel when they close their eyes and remember their day.&rdquo;
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <m.div
              key={t.client}
              className="glass-card p-8 relative hover:border-gold/50 transition-colors group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.12, duration: 0.7 }}
              whileHover={{ y: -4 }}
              data-testid={`testimonial-card-${i}`}
            >
              {/* Gold quote mark */}
              <div className="font-serif text-7xl leading-none mb-4 text-gold/40 transition-colors group-hover:text-gold/60" style={{ fontFamily: "Georgia, serif" }}>
                &ldquo;
              </div>
              <div className="flex gap-1 mb-4 text-gold">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-quote text-base lg:text-lg text-foreground mb-8">
                {t.quote}
              </p>
              <div className="h-px mb-5 bg-gold/20" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center text-gold font-serif text-lg">
                  {t.client.charAt(0)}
                </div>
                <div>
                  <p className="font-serif text-base mb-1 text-foreground">{t.client}</p>
                  <p className="section-label mb-0.5 text-gold/80">{t.location}</p>
                  <p className="font-sans text-xs font-light text-muted-foreground">{t.date}</p>
                </div>
              </div>
            </m.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 py-20 text-center border-t border-gold/10">
          <p className="section-label mb-4 text-gold justify-center">Begin Your Story</p>
          <h2 className="text-display text-4xl lg:text-5xl mb-6 text-foreground">Ready to become part of the Alankaran story?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <m.a href="/contact">
              <m.button
                className="px-10 py-4 bg-gold text-background section-label hover:bg-gold/90 hover:gold-glow transition-all"
                whileHover={{ scale: 1.03 }}
                data-testid="btn-testimonials-contact"
              >
                Start the Conversation
              </m.button>
            </m.a>
            <a href="/contact">
              <m.button
                className="px-10 py-4 btn-outline-gold section-label transition-all"
                whileHover={{ scale: 1.03 }}
              >
                Design Your Signature Wedding
              </m.button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
