import { Link } from "wouter";
import { localBackgroundUrl } from "@/utils/localImage";
import { m } from "framer-motion";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import StructuredData from "@/components/StructuredData";
import { useSiteContent } from "@/providers/SiteContentProvider";

const services = [
  {
    name: "Wedding Planning",
    desc: "From the first conversation to the final bow, we orchestrate every element of your celebration with meticulous care. Our planning process is thorough, personal, and designed around your unique vision — timelines, vendor relationships, logistics, and creative direction, all held in a single, trusted pair of hands.",
    tag: "Full Service",
  },
  {
    name: "Luxury Wedding Decor",
    desc: "We transform venues into environments. Our decor installations are conceived as architectural experiences — bespoke structures of floral, fabric, metal, and light that create an atmosphere unlike any other. Each element is sourced, crafted, or commissioned to our exact specifications.",
    tag: "Installation",
  },
  {
    name: "Floral Styling",
    desc: "Our floristry is sculptural. We work with rare and seasonal blooms, creating living compositions that define the mood of your celebration. From ceremony arches to tablescapes, each arrangement is designed as an integral part of the room's visual language.",
    tag: "Botanical Art",
  },
  {
    name: "Mandap Design",
    desc: "The mandap is the sacred heart of an Indian wedding ceremony. We approach its design with deep reverence and extraordinary creativity — bespoke structures that honor ritual while creating a visual centerpiece of rare beauty.",
    tag: "Ceremonial",
  },
  {
    name: "Engagement Decor",
    desc: "An engagement is the first chapter of your wedding story. We design intimate, warmly elegant celebrations that set the tone for everything that follows — personal, soft, and suffused with quiet luxury.",
    tag: "Celebration",
  },
  {
    name: "Reception Styling",
    desc: "The reception is where grandeur meets joy. We design luminous evenings where spectacular decor, ambient lighting, and thoughtful detail combine into an experience that feels both epic and deeply personal.",
    tag: "Grand Celebration",
  },
  {
    name: "Royal Theme Weddings",
    desc: "Drawing from the courts of Rajputana and the gardens of Mughal emperors, our royal theme weddings are immersive journeys into India's most opulent aesthetic traditions — reimagined with contemporary editorial precision.",
    tag: "Heritage",
  },
  {
    name: "Wedding Stage Design",
    desc: "Your stage is the frame for the most photographed moments of your life. We design stages that command presence — architectural statements of beauty that make every photograph extraordinary.",
    tag: "Architecture",
  },
  {
    name: "Bridal Entry Concepts",
    desc: "A bridal entry is a moment of theater. We design arrivals of breathtaking drama and beauty — whether through veils of floral, cascades of light, or passages of smoke and silk — crafted to stop every breath in the room.",
    tag: "Theatrical",
  },
  {
    name: "Custom Event Styling",
    desc: "Beyond weddings, we apply our design philosophy to anniversary celebrations, milestone events, and private occasions. Whatever the celebration, our approach is the same: singular creative vision, executed with unwavering precision.",
    tag: "Bespoke",
  },
];

export default function Services() {
  const { getSlotImage } = useSiteContent();

  // One CMS slot per rendered image, in grid order. The hero has its own dedicated slot so that
  // editing it cannot alter any grid card. `cardImages` is indexed 1:1 with `services` — never with
  // a modulo — so card N is driven only by slot N. Adding a service REQUIRES adding its slot to
  // SLOT_CATALOG; the length assertion below fails loudly in dev if the two ever drift.
  const heroImage = getSlotImage(
    "services",
    "services_hero",
    "/images/royal_mandap.webp",
    "Alankaran Signature Services"
  ).url;

  const cardImages = [
    getSlotImage("services", "service_wedding_planning", "/images/royal_mandap.webp", "Wedding Planning").url,
    getSlotImage("services", "service_luxury_decor", "/images/coastal_wedding.webp", "Luxury Wedding Decor").url,
    getSlotImage("services", "service_floral_styling", "/images/mughal_garden.webp", "Floral Styling").url,
    getSlotImage("services", "service_mandap_design", "/images/floral_stage.webp", "Mandap Design").url,
    getSlotImage("services", "service_engagement_decor", "/images/engagement_decor.webp", "Engagement Decor").url,
    getSlotImage("services", "service_reception_styling", "/images/grand_reception.webp", "Reception Styling").url,
    getSlotImage("services", "service_royal_theme", "/images/mandap_floral_detail.webp", "Royal Theme Weddings").url,
    getSlotImage("services", "service_stage_design", "/images/floral_detail.webp", "Wedding Stage Design").url,
    getSlotImage("services", "service_bridal_entry", "/images/bridal_entry.webp", "Bridal Entry Concepts").url,
    getSlotImage("services", "service_custom_styling", "/images/coastal_sunset_wedding.webp", "Custom Event Styling").url,
  ];

  if (import.meta.env.DEV && cardImages.length !== services.length) {
    console.error(
      `[Services] CMS mapping drift: ${services.length} service cards but ${cardImages.length} image slots. ` +
        `Every card must have its own slot or cards will share images.`
    );
  }
  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Signature Services"
        description="Explore our bespoke wedding planning, luxury floral styling, and mandap design services, crafted for your unique celebration."
        url="https://alankaran.com/services"
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Luxury Wedding Planning and Design",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Alankaran Luxury Weddings"
          },
          "url": "https://alankaran.com/services",
          "description": "Explore our bespoke wedding planning, luxury floral styling, and mandap design services, crafted for your unique celebration."
        }}
      />
      {/* Hero */}
      <section className="relative h-[65vh] flex items-end pb-20 overflow-hidden">
        <OptimizedImage fill priority src={heroImage} alt="Alankaran signature services" sizes="100vw" widths={[640, 828, 1200, 1600, 1920]} className="z-0" style={{ filter: "brightness(0.85) saturate(1.0)" }} />
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%)" }} />
        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-12 z-20">
          <m.p className="section-label mb-4 text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>What We Offer</m.p>
          <m.h1 className="text-display text-5xl lg:text-8xl text-white" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            Signature <em className="not-italic text-gold-gradient">Services</em>
          </m.h1>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        {/* Intro */}
        <section className="py-24 border-b border-gold/10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]" />
          <p className="text-quote text-2xl lg:text-3xl text-gold/80 max-w-4xl mx-auto relative z-10">
            &ldquo;From the first conversation to the final flourish — every service is delivered with the same unwavering standard of excellence.&rdquo;
          </p>
        </section>

        {/* Services Grid */}
        <section className="py-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <m.div
              key={s.name}
              className="glass-card overflow-hidden group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.7 }}
              whileHover={{ y: -6 }}
              data-testid={`service-card-${i}`}
            >
              <div className="overflow-hidden aspect-[16/9]">
                <div className="w-full h-full transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${localBackgroundUrl(cardImages[i])})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              </div>
              <div className="p-8">
                <p className="section-label mb-3 text-gold/80 tracking-widest">{s.tag}</p>
                <h3 className="font-serif text-2xl mb-4 text-foreground">{s.name}</h3>
                <p className="text-body text-sm">{s.desc}</p>
              </div>
            </m.div>
          ))}
        </section>

        {/* Inline CTA strip */}
        <div className="mt-16 bg-foreground rounded-xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-serif text-background text-xl">Receive a Tailored Proposal</p>
            <p className="font-sans text-background/60 text-xs font-light mt-1">Tell us your vision and we'll send you a detailed event costing within 24 hours.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/contact">
              <m.button className="px-6 py-3 bg-gold text-primary-foreground section-label hover:bg-gold-hover hover:gold-glow transition-all" whileHover={{ scale: 1.03 }}>
                Request Event Costing
              </m.button>
            </Link>
            <Link href="/contact">
              <m.button className="px-6 py-3 border border-background/30 text-background section-label hover:bg-background/10 transition-all" whileHover={{ scale: 1.03 }}>
                Talk to an Expert
              </m.button>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <section className="py-24 text-center border-t border-gold/20 bg-luxury-gradient">
          <p className="section-label mb-4 text-gold justify-center">Begin Your Celebration</p>
          <h2 className="text-display text-4xl lg:text-6xl mb-6 text-foreground">Ready to start planning?</h2>
          <p className="text-body text-sm mb-10 max-w-md mx-auto">
            Every great celebration begins with a single conversation. Tell us your vision and we&rsquo;ll tell you what&rsquo;s possible.
          </p>
          <Link href="/contact">
            <m.button
              className="px-10 py-4 bg-gold text-background section-label hover:bg-gold/90 hover:gold-glow transition-all"
              whileHover={{ scale: 1.03 }}
              data-testid="btn-services-inquire"
            >
              Request an Inquiry
            </m.button>
          </Link>
        </section>
      </div>

      <Footer />
    </div>
  );
}
