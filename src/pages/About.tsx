import { Link } from "wouter";
import { m } from "framer-motion";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import StructuredData from "@/components/StructuredData";
import { useSiteContent } from "@/providers/SiteContentProvider";

const values = [
  { title: "Intentional Beauty", body: "Every element — from the weight of a fabric to the exact bloom of a peony — is chosen as a deliberate act of curation." },
  { title: "Heritage as Canvas", body: "Centuries of Indian wedding tradition serve as our creative foundation. We reimagine ritual as art." },
  { title: "Emotional Precision", body: "We design not just spaces, but feelings. The warmth of amber candlelight, the weight of a silence before vows." },
  { title: "Singular Vision", body: "No two Alankaran weddings are alike. Each celebration begins with listening, then becomes something entirely its own." },
];

export default function About() {
  const { getSlotImage } = useSiteContent();

  // One slot per rendered position. `about_hero` is dedicated to the hero: it previously shared
  // `about_portrait` with the collage tile below, so editing the hero also changed the collage.
  const heroImage = getSlotImage("about", "about_hero", "/images/royal_mandap.webp", "Alankaran — Our Story").url;

  const images = [
    getSlotImage("about", "about_collage_1", "/images/coastal_wedding.webp", "Coastal Wedding Detail").url,
    getSlotImage("about", "about_collage_2", "/images/mughal_garden.webp", "Mughal Garden Detail").url,
    getSlotImage("about", "about_collage_3", "/images/royal_mandap.webp", "Royal Mandap Detail").url,
    getSlotImage("about", "about_floral_stage", "/images/floral_stage.webp", "Floral Stage Detail").url,
  ];

  const foundersImage = getSlotImage("about", "about_founders", "/images/founders.webp", "Chaitanya & Chandrika Kulkarni").url;

  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Our Story & Philosophy"
        description="Discover the philosophy behind Alankaran. We don't just decorate spaces—we compose immersive luxury wedding experiences rooted in Indian heritage."
        preloadImage={heroImage}
        url="https://alankaran.com/about"
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "About Alankaran",
          "url": "https://alankaran.com/about",
          "description": "Discover the philosophy behind Alankaran. We don't just decorate spaces—we compose immersive luxury wedding experiences rooted in Indian heritage."
        }}
      />
      {/* Hero */}
      <section className="relative h-[70vh] flex items-end pb-20 overflow-hidden">
        <OptimizedImage fill priority src={heroImage} alt="Alankaran — Our Story" sizes="100vw" widths={[640, 828, 1200, 1600, 1920]} className="z-0" style={{ filter: "brightness(0.85) saturate(1.0)" }} />
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%)" }} />
        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-12 z-20">
          <m.p className="section-label mb-4 text-gold" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            About Alankaran
          </m.p>
          <m.h1 className="text-display text-5xl lg:text-8xl text-white" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            Our Story
          </m.h1>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        {/* Brand Story */}
        <section className="py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="section-label mb-6 gsap-reveal text-gold">Origin</p>
            <h2 className="text-display text-4xl lg:text-5xl mb-8 gsap-reveal text-foreground">
              Born from the grandeur of<br />
              <em className="not-italic text-gold-gradient">royal Indian celebrations</em>
            </h2>
            <p className="text-body leading-relaxed gsap-reveal text-sm mb-6">
              Founded at the intersection of Indian heritage and contemporary editorial beauty, Alankaran has redefined luxury wedding celebrations across India and beyond. What began as a singular vision — to restore the grandeur of royal Indian weddings for the modern age — has grown into one of the country's most coveted wedding design studios.
            </p>
            <p className="text-body leading-relaxed gsap-reveal text-sm">
              We work with couples who understand that a wedding is not merely a ceremony. It is a composed experience — layers of light, fragrance, texture, and ceremony woven into a singular, unrepeatable moment in time.
            </p>
          </div>
          <div className="space-y-4">
            <div className="aspect-[4/3] gsap-reveal" style={{ backgroundImage: `url(${images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="grid grid-cols-2 gap-4 gsap-reveal">
              <div className="aspect-square" style={{ backgroundImage: `url(${images[1]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="aspect-square" style={{ backgroundImage: `url(${images[2]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gold/10" />

        {/* Philosophy */}
        <section className="py-24 lg:py-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]" />
          <p className="section-label mb-6 gsap-reveal text-gold relative z-10 justify-center">Our Philosophy</p>
          <blockquote className="text-display text-3xl lg:text-5xl max-w-4xl mx-auto gsap-reveal text-foreground relative z-10">
            &ldquo;We don&rsquo;t decorate spaces &mdash; we compose experiences.&rdquo;
          </blockquote>
          <p className="text-body mt-8 max-w-2xl mx-auto text-sm gsap-reveal relative z-10">
            Every floral arrangement, every drape of silk, every placement of candlelight is an intentional creative act. We believe that great wedding design should be felt as much as it is seen — in the warmth of a room, in the scent of jasmine, in the hush before a ceremony begins.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8 relative z-10">
            <Link href="/contact">
              <m.button className="px-8 py-3 bg-gold text-white section-label hover:bg-gold/90 transition-all" whileHover={{ scale: 1.02 }}>
                Begin Your Wedding Story
              </m.button>
            </Link>
            <Link href="/contact">
              <m.button className="px-8 py-3 btn-outline-gold section-label transition-all" whileHover={{ scale: 1.02 }}>
                Get a Quote
              </m.button>
            </Link>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {values.map((v, i) => (
            <m.div
              key={v.title}
              className="glass-card p-8 gsap-reveal group"
              whileHover={{ y: -4 }}
              data-testid={`card-value-${i}`}
            >
              <div className="h-px mb-6 bg-gold/20 group-hover:bg-gold/40 transition-colors" />
              <h3 className="font-serif text-xl mb-3 text-foreground">{v.title}</h3>
              <p className="text-body text-sm">{v.body}</p>
            </m.div>
          ))}
        </section>

        {/* Heritage */}
        <section className="py-16 mb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="aspect-[3/4] overflow-hidden glass-card p-2">
            <div className="w-full h-full" style={{ backgroundImage: `url(${images[3]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          </div>
          <div>
            <p className="section-label mb-6 gsap-reveal text-gold">Heritage</p>
            <h2 className="text-display text-4xl lg:text-5xl mb-6 gsap-reveal text-foreground">
              Rooted in centuries<br />of Indian craft tradition
            </h2>
            <p className="text-body text-sm mb-6 gsap-reveal">
              Indian weddings are among the world's most elaborate and emotionally rich ceremonies. Our work draws from this extraordinary heritage — the geometry of Mughal gardens, the chromatic opulence of Rajputana courts, the fragrant devotion of temple floristry.
            </p>
            <p className="text-body text-sm gsap-reveal">
              We carry these traditions forward not as reproductions, but as living interpretations — reimagined for couples who honor the past while standing firmly in the present.
            </p>
          </div>
        </section>

        {/* Founders & Leadership */}
        <section className="py-16 mb-24 border-t border-gold/10 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="aspect-[3/4] overflow-hidden glass-card p-2 gsap-reveal">
              <img width="800" height="1000" 
                src={foundersImage} 
                alt="Chaitanya & Chandrika Kulkarni" 
                className="w-full h-full object-cover" 
                loading="lazy"
              decoding="async" />
            </div>
            <div className="lg:col-span-2 flex flex-col justify-center">
              <p className="section-label mb-4 gsap-reveal text-gold">Founders & Directors</p>
              <h2 className="text-display text-4xl lg:text-5xl mb-6 gsap-reveal text-foreground">
                Chaitanya & Chandrika Kulkarni
              </h2>
              <p className="text-body text-sm mb-6 gsap-reveal leading-relaxed">
                Founded at the intersection of business strategy and editorial beauty, Alankaran is led by Chaitanya Kulkarni and Chandrika Kulkarni. Chaitanya, a post-graduate in Marketing with a PG Diploma in Event Management, brings extensive operational expertise and logistical foresight. Having started his career in marketing, he commands the business strategy and client relations that make Alankaran's largest celebrations seamless and precise.
              </p>
              <p className="text-body text-sm mb-8 gsap-reveal leading-relaxed">
                Chandrika, a post-graduate with natural artistic sensibilities and style, serves as the creative force of the studio. A keen observer with a meticulous eye for detail, she excels in auditing event execution and finance, playing a pivotal role in managing people, logistics, and budgets to bring Alankaran's editorial designs to life.
              </p>
              <div className="h-px mb-6 bg-gold/20" />
              <p className="text-quote text-xl lg:text-2xl text-gold font-semibold gsap-reveal">
                &ldquo;Every couple deserves a wedding that feels like the most beautiful version of themselves.&rdquo;
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="py-24 text-center border-t border-gold/20 bg-luxury-gradient">
        <p className="section-label mb-4 text-gold justify-center">Ready to Begin?</p>
        <h3 className="text-display text-4xl mb-8 text-foreground">Let&rsquo;s craft your story together.</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <m.button
              className="px-10 py-4 bg-gold text-background section-label hover:bg-gold/90 hover:gold-glow transition-all"
              whileHover={{ scale: 1.03 }}
              data-testid="btn-about-contact"
            >
              Begin Your Story
            </m.button>
          </Link>
          <Link href="/contact">
            <m.button
              className="px-10 py-4 btn-outline-gold section-label transition-all"
              whileHover={{ scale: 1.03 }}
            >
              Talk to an Expert
            </m.button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
