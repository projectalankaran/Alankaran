import { useState } from "react";
import { Link } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Check, ArrowRight, Users, Calendar } from "lucide-react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { inquiryService } from "@/domains/cms/services";

const weddingStyles = [
  {
    title: "Beach Weddings",
    desc: "Sunset pheras, ocean breeze, and an intimate vibe that feels effortless.",
    tags: ["Intimate", "Sunset", "Coastal"],
    destinations: ["Goa", "Kerala", "Andamans", "Pondicherry"],
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
  },
  {
    title: "Heritage & Palace Weddings",
    desc: "Royal venues, grand decor, and ceremonies built for scale and tradition.",
    tags: ["Grand", "Traditional", "Luxury"],
    destinations: ["Udaipur", "Jodhpur", "Jaipur", "Jaisalmer"],
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80",
  },
  {
    title: "Garden & Forest Weddings",
    desc: "Lush greenery, open skies, and celebrations wrapped in natural beauty.",
    tags: ["Natural", "Intimate", "Serene"],
    destinations: ["Coorg", "Munnar", "Mussoorie", "Ooty"],
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
  },
  {
    title: "International Weddings",
    desc: "From European châteaus to island escapes — love knows no borders.",
    tags: ["Global", "Exclusive", "Destination"],
    destinations: ["Bali", "Italy", "Dubai", "Thailand"],
    image: "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80",
  },
];

const popularDestinations = [
  {
    name: "Goa",
    sub: "Beaches & Portuguese Heritage",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
  },
  {
    name: "Udaipur",
    sub: "City of Lakes & Palaces",
    image: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=600&q=80",
  },
  {
    name: "Jaipur",
    sub: "Pink City Royalty",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80",
  },
  {
    name: "Rajasthan",
    sub: "Desert Forts & Regal Ceremonies",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80",
  },
];

const whyUs = [
  {
    title: "Single Point of Ownership",
    desc: "One team owns planning, design, vendors, and execution.",
  },
  {
    title: "Venue Discovery & Negotiation",
    desc: "Shortlist with season logic, guest comfort, and cost tradeoffs.",
  },
  {
    title: "Vendor Coordination",
    desc: "Curated partners aligned to your style and venue constraints.",
  },
  {
    title: "Transparent Pricing",
    desc: "Clear budget brackets with what is included and what is optional.",
  },
];

const processSteps = [
  { step: "Step 1", title: "Vision & Guest Count", desc: "We lock your style, priorities, and a realistic headcount." },
  { step: "Step 2", title: "Destination & Venue Shortlist", desc: "Options that match season, budget, and logistics." },
  { step: "Step 3", title: "Budget Plan & Breakdown", desc: "Clear ranges with what is included, what is optional." },
  { step: "Step 4", title: "Vendors & Design", desc: "Decor, catering, photography, entertainment, all curated." },
  { step: "Step 5", title: "Guest Logistics", desc: "Rooms, travel, itineraries, and on-ground coordination." },
  { step: "Step 6", title: "Execution", desc: "Our team runs the show while you stay present and celebrate." },
];

const realWeddings = [
  {
    location: "Goa",
    guests: "120 guests",
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=700&q=80",
    budget: "₹35L to ₹50L",
  },
  {
    location: "Udaipur",
    guests: "250 guests",
    image: "/images/royal_palace_reception.webp",
    budget: "₹55L to ₹75L",
  },
  {
    location: "Jaipur",
    guests: "300 guests",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=700&q=80",
    budget: "₹60L to ₹90L",
  },
  {
    location: "Kerala",
    guests: "80 guests",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=80",
    budget: "₹25L to ₹40L",
  },
];

const budgetBuckets = [
  { title: "Intimate Weddings", sub: "Under 50 guests", note: "Tight guest list, high experience" },
  { title: "Destination under ₹30L", sub: "Smart venue choices", note: "Value-first without compromise" },
  { title: "Destination under ₹50L", sub: "More scale and design", note: "The sweet spot for most couples" },
  { title: "Luxury Destination", sub: "High touch and grand", note: "Every detail at the highest level" },
];

const faqs = [
  { q: "Is a destination wedding always more expensive?", a: "Not necessarily. A smaller destination wedding can cost less than a large city wedding. The key is matching guest count to venue and season — we help you find that sweet spot." },
  { q: "How do guest logistics work?", a: "We coordinate room blocks, travel itineraries, welcome kits, and on-ground coordination so your guests feel cared for throughout the celebration." },
  { q: "Can we customize vendors?", a: "Yes. We have curated partners but will work with your preferred vendors when they meet our quality standards. We manage all coordination regardless." },
  { q: "How early should we start planning?", a: "For destination weddings, 10–14 months gives us the best venue availability and pricing. We've successfully planned in 5 months, but earlier is always better." },
];

const guestOptions = ["Under 50", "50–100", "100–200", "200–350", "350+"];
const typeOptions = ["Beach", "Palace / Fort", "Garden", "Hill Station", "International"];

export default function DestinationWeddings() {
  const [selectedGuests, setSelectedGuests] = useState("100–200");
  const [selectedType, setSelectedType] = useState("Beach");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Phase A Task 7: this form previously had no state and simply navigated to /contact, discarding
  // whatever the visitor typed. It now persists to `cmsInquiries`.
  const [planForm, setPlanForm] = useState({
    name: "",
    phone: "",
    month: "",
    destination: "",
    whatsappOptIn: true,
  });
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planSubmitted, setPlanSubmitted] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planForm.name.trim().length < 2) {
      setPlanError("Please enter your full name.");
      return;
    }
    if (planForm.phone.replace(/\D/g, "").length < 10) {
      setPlanError("Please enter a valid phone number.");
      return;
    }
    setPlanError(null);
    setPlanSubmitting(true);

    try {
      await inquiryService.submit({
        name: planForm.name,
        phone: planForm.phone,
        email: "",
        eventType: `Destination Wedding${planForm.destination ? ` — ${planForm.destination}` : ""}`,
        message: `Guest range: ${selectedGuests}. Style: ${selectedType}. WhatsApp updates: ${planForm.whatsappOptIn ? "yes" : "no"}.`,
        eventDate: planForm.month,
        location: planForm.destination,
        guestCount: selectedGuests,
        sourcePage: "destinations",
      });
      setPlanSubmitted(true);
    } catch (err: any) {
      setPlanError(
        err?.message || "We couldn't send your request. Please try again, or reach us on WhatsApp."
      );
    } finally {
      setPlanSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Destination Weddings"
        description="Plan your dream destination wedding across India and beyond with Alankaran — Goa, Udaipur, Jaipur, Kerala, and international venues."
      />

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/*
          `data-lcp-bg` marks this as the route's LCP element.

          A CSS background-image is invisible to the browser's preload scanner: it cannot be
          discovered until the stylesheet has parsed AND the element has been laid out, which puts
          it several steps further down the critical path than an <img> would be. `scripts/
          prerender.mjs` reads this marker and emits a matching `<link rel="preload" as="image">`
          into <head>, restoring parse-time discovery without altering a single pixel of the
          existing background-cover rendering.
        */}
        <div
          data-lcp-bg
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=85)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.72) saturate(1.1)",
          }}
        />
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.55) 100%)" }} />

        <div className="relative z-20 max-w-screen-xl mx-auto px-6 lg:px-12 w-full py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: headline */}
            <div>
              <div className="flex flex-wrap gap-2 mb-8">
                {["End to end planning", "India & International", "Zero chaos execution"].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full border border-white/30 text-white/85 text-xs font-sans font-light backdrop-blur-sm bg-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <m.h1
                className="text-display text-5xl lg:text-7xl text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                Plan Unforgettable<br />
                <em className="not-italic text-gold-gradient">Destination</em><br />
                Weddings in India
              </m.h1>
              <m.p
                className="text-white/80 font-sans font-light text-base lg:text-lg mb-10 max-w-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                From heritage palaces to coastal shores — Alankaran crafts destination weddings across Goa, Udaipur, Jaipur, and beyond with flawless end-to-end planning.
              </m.p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <m.button
                    className="px-8 py-4 bg-gold text-background section-label hover:bg-gold/90 transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.03 }}
                  >
                    Get Pricing Now <ArrowRight size={14} />
                  </m.button>
                </Link>
                <button
                  className="px-8 py-4 border border-white/50 text-white font-sans text-sm font-light hover:bg-white/10 transition-all"
                  onClick={() => document.getElementById("styles-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore Wedding Types
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
                {[["6 to 10 mo", "Avg planning"], ["Beach", "Most popular"], ["50 to 250", "Best for"]].map(([val, label]) => (
                  <div key={label}>
                    <p className="font-serif text-white text-lg font-semibold">{val}</p>
                    <p className="text-white/60 text-xs font-sans font-light">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Match Widget */}
            <m.div
              className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-stone-200"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif text-xl text-foreground mb-1">Quick Match</h3>
                  <p className="text-muted-foreground text-xs font-sans font-light">Find a destination style that fits your guest count and vibe.</p>
                </div>
                <span className="px-3 py-1 bg-foreground text-background rounded-full text-xs font-sans">2 min</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-sans text-muted-foreground mb-2 uppercase tracking-wider">Wedding Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-sans text-foreground bg-white focus:outline-none focus:border-gold/60"
                  >
                    {typeOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans text-muted-foreground mb-2 uppercase tracking-wider">Guest Count</label>
                  <select
                    value={selectedGuests}
                    onChange={(e) => setSelectedGuests(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-sans text-foreground bg-white focus:outline-none focus:border-gold/60"
                  >
                    {guestOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-5 mb-6 border border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Typical Budget Range</p>
                  <span className="text-xs font-sans text-gold border border-gold/40 px-2 py-0.5 rounded-full">Estimate</span>
                </div>
                <p className="font-serif text-2xl text-foreground font-semibold mb-1">₹28L to ₹55L</p>
                <p className="text-xs font-sans text-muted-foreground">Depends on season, venue category, and number of functions.</p>
              </div>

              <Link href="/contact">
                <button className="w-full py-4 bg-gold text-background font-sans text-sm font-semibold rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center gap-2">
                  Get a Detailed Plan <ArrowRight size={14} />
                </button>
              </Link>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {[["Venue", "Discover"], ["Decor", "Design"], ["Execution", "Deliver"]].map(([title, sub]) => (
                  <div key={title} className="text-center py-3 bg-stone-50 rounded-lg border border-stone-100">
                    <p className="text-xs font-sans font-semibold text-foreground">{title}</p>
                    <p className="text-[10px] font-sans text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* ── WHY ALANKARAN ── */}
      <section className="py-20 bg-white border-b border-stone-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-px bg-gold" />
            <span className="text-xs font-sans uppercase tracking-widest text-gold">Why Alankaran</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl lg:text-4xl text-foreground leading-snug">
                A destination wedding should feel exciting,<br />not stressful
              </h2>
            </div>
            <div>
              <p className="text-muted-foreground font-sans text-sm font-light">
                Alankaran handles the messy parts so you can enjoy the moments that matter. We've planned over 200 destination weddings across India and internationally.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {whyUs.map((item) => (
              <div key={item.title} className="border border-stone-200 rounded-xl p-6 bg-white hover:border-gold/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-gold/50 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Check size={11} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground font-light">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inline CTA */}
          <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-6 py-5">
            <div>
              <p className="font-sans font-semibold text-foreground text-sm">One team. One plan. Zero chaos.</p>
              <p className="font-sans text-xs text-muted-foreground font-light mt-0.5">Tell us your guest count and preferred style. We will come back with options.</p>
            </div>
            <Link href="/contact">
              <button className="flex-shrink-0 px-6 py-3 bg-gold text-background font-sans text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-2">
                Get Pricing Now <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WEDDING STYLES ── */}
      <section id="styles-section" className="py-20 bg-background">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-px bg-gold" />
            <span className="text-xs font-sans uppercase tracking-widest text-gold">Explore</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Pick a wedding style, then we shortlist destinations</h2>
            <p className="text-muted-foreground font-sans text-sm font-light">People choose the vibe first. Destinations come next.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weddingStyles.map((style, i) => (
              <m.div
                key={style.title}
                className="border border-stone-200 rounded-2xl overflow-hidden bg-white hover:border-gold/40 transition-colors group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="overflow-hidden aspect-[16/9]">
                  <img width="800" height="1000"
                    src={style.image}
                    alt={style.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  decoding="async" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-sans font-semibold text-foreground text-base">{style.title}</h3>
                    <Link href="/contact">
                      <button className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:border-gold/50 hover:text-gold transition-colors">
                        <ArrowRight size={13} />
                      </button>
                    </Link>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground font-light mb-4">{style.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {style.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-stone-50 border border-stone-200 text-xs font-sans text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <p className="text-xs font-sans text-muted-foreground mb-2 font-medium">Popular destinations</p>
                    <div className="flex flex-wrap gap-3">
                      {style.destinations.map((d) => (
                        <span key={d} className="flex items-center gap-1 text-xs font-sans text-foreground">
                          <MapPin size={10} className="text-gold" /> {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </m.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/contact">
              <m.button
                className="px-8 py-4 bg-gold text-background section-label hover:bg-gold/90 transition-all"
                whileHover={{ scale: 1.03 }}
              >
                Explore More Styles
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── POPULAR DESTINATIONS ── */}
      <section className="py-20 bg-stone-50 border-y border-stone-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-px bg-gold" />
            <span className="text-xs font-sans uppercase tracking-widest text-gold">Locations</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Popular wedding destinations</h2>
            <p className="text-muted-foreground font-sans text-sm font-light">From beaches to heritage palaces, we have planned weddings everywhere.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularDestinations.map((dest, i) => (
              <m.div
                key={dest.name}
                className="relative overflow-hidden rounded-2xl cursor-pointer group aspect-[3/4]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <img width="800" height="1000" src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" decoding="async" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-serif text-white text-xl font-semibold">{dest.name}</p>
                  <p className="font-sans text-white/70 text-xs font-light mt-0.5">{dest.sub}</p>
                  <Link href="/contact">
                    <span className="inline-flex items-center gap-1 text-white/90 text-xs font-sans mt-2 hover:text-gold transition-colors">
                      Explore <ArrowRight size={10} />
                    </span>
                  </Link>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-px bg-gold" />
            <span className="text-xs font-sans uppercase tracking-widest text-gold">Process</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">How Alankaran plans your destination wedding</h2>
            <p className="text-muted-foreground font-sans text-sm font-light">Simple, structured, and transparent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processSteps.map((step, i) => (
              <m.div
                key={step.step}
                className="border border-stone-200 rounded-xl p-6 bg-white hover:border-gold/40 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-stone-50 border border-stone-200 text-xs font-sans text-muted-foreground rounded-full">{step.step}</span>
                  <div className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center">
                    <Check size={12} className="text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-sans font-semibold text-foreground text-sm mb-2">{step.title}</h3>
                <p className="font-sans text-sm text-muted-foreground font-light">{step.desc}</p>
              </m.div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-6 py-5">
            <div>
              <p className="font-sans font-semibold text-foreground text-sm">Ready to start your planning journey?</p>
              <p className="font-sans text-xs text-muted-foreground font-light mt-0.5">Share a few details and we'll send you a destination shortlist within 48 hours.</p>
            </div>
            <Link href="/contact">
              <button className="flex-shrink-0 px-6 py-3 bg-gold text-background font-sans text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-2">
                Begin the Journey <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── REAL WEDDINGS ── */}
      <section className="py-20 bg-background">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-px bg-gold" />
            <span className="text-xs font-sans uppercase tracking-widest text-gold">Proof</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Real destination weddings by Alankaran</h2>
            <p className="text-muted-foreground font-sans text-sm font-light">Use these as reference points. We will tailor the plan to you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {realWeddings.map((w, i) => (
              <m.div
                key={w.location}
                className="border border-stone-200 rounded-2xl overflow-hidden bg-white hover:border-gold/40 transition-colors group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="overflow-hidden aspect-[16/10]">
                  <img width="800" height="1000"
                    src={w.image}
                    alt={w.location}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  decoding="async" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-sans font-semibold text-foreground text-base">{w.location}</h3>
                      <p className="font-sans text-xs text-muted-foreground font-light flex items-center gap-1 mt-0.5">
                        <Users size={10} /> {w.guests}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-foreground text-background text-xs font-sans rounded-full">Case</span>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-100 mb-4">
                    <p className="text-xs font-sans text-muted-foreground mb-0.5">Budget bracket</p>
                    <p className="font-sans font-semibold text-foreground text-sm">{w.budget}</p>
                  </div>
                  <Link href="/contact">
                    <button className="text-sm font-sans text-foreground border border-stone-200 rounded-lg px-4 py-2 hover:border-gold/50 hover:text-gold transition-colors">
                      Plan something similar
                    </button>
                  </Link>
                </div>
              </m.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/wedding-stories">
              <m.button
                className="px-8 py-4 btn-outline-gold font-sans text-sm font-semibold transition-all"
                whileHover={{ scale: 1.02 }}
              >
                View All Wedding Stories
              </m.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── BUDGET BUCKETS ── */}
      <section className="py-20 bg-stone-50 border-y border-stone-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-px bg-gold" />
            <span className="text-xs font-sans uppercase tracking-widest text-gold">Budget</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Budget buckets</h2>
            <p className="text-muted-foreground font-sans text-sm font-light">Pick a range to see what is realistic and what to prioritize.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetBuckets.map((bucket) => (
              <div key={bucket.title} className="border border-stone-200 rounded-xl p-6 bg-white hover:border-gold/40 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-sans font-semibold text-foreground text-sm">{bucket.title}</h3>
                    <p className="font-sans text-xs text-muted-foreground font-light mt-0.5">{bucket.note}</p>
                  </div>
                  <span className="px-3 py-1 border border-stone-200 text-xs font-sans text-muted-foreground rounded-full group-hover:border-gold/50 group-hover:text-gold transition-colors">Explore</span>
                </div>
                <Link href="/contact">
                  <button className="mt-3 flex items-center gap-2 text-xs font-sans font-semibold text-white bg-gold rounded-lg px-4 py-2.5 hover:bg-gold/90 transition-colors">
                    Get a plan for this budget <ArrowRight size={11} />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEAD FORM ── */}
      <section className="py-20 bg-white" id="plan-form">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <span className="w-5 h-px bg-gold" />
              <span className="text-xs font-sans uppercase tracking-widest text-gold">Start</span>
              <span className="w-5 h-px bg-gold" />
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground text-center mb-3">Get a destination wedding plan</h2>
            <p className="text-muted-foreground font-sans text-sm font-light text-center mb-10">Share a few details. We will respond with a shortlist and a clear budget range.</p>

            <div className="border border-stone-200 rounded-2xl p-8 bg-white shadow-sm">
              {planSubmitted ? (
                <div className="text-center py-10" data-testid="destination-form-success">
                  <p className="font-serif text-2xl text-foreground mb-2">Thank You</p>
                  <p className="text-muted-foreground font-sans text-sm font-light">
                    We have received your request and will respond with a shortlist and budget range
                    within 24 hours.
                  </p>
                </div>
              ) : (
              <form className="space-y-5" onSubmit={handlePlanSubmit} noValidate data-testid="destination-form">
                <div>
                  <label className="block text-xs font-sans font-medium text-foreground mb-2 uppercase tracking-wider">Full Name</label>
                  <input
                    id="destination-name-input"
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-foreground mb-2 uppercase tracking-wider">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 border border-stone-200 rounded-lg px-3 py-3 text-sm font-sans text-foreground bg-stone-50">+91</span>
                    <input
                      type="tel"
                      value={planForm.phone}
                      onChange={(e) => setPlanForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="flex-1 border border-stone-200 rounded-lg px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-foreground mb-2 uppercase tracking-wider">Event Month</label>
                    <select
                      value={planForm.month}
                      onChange={(e) => setPlanForm((f) => ({ ...f, month: e.target.value }))}
                      className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:border-gold/60 transition-colors bg-white"
                    >
                      <option value="">Select a Month</option>
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-foreground mb-2 uppercase tracking-wider">Destination</label>
                    <select
                      value={planForm.destination}
                      onChange={(e) => setPlanForm((f) => ({ ...f, destination: e.target.value }))}
                      className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:border-gold/60 transition-colors bg-white"
                    >
                      <option value="">Select a Location</option>
                      {["Goa", "Udaipur", "Jaipur", "Jodhpur", "Kerala", "Jaisalmer", "Coorg", "International"].map(l => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="whatsapp"
                    checked={planForm.whatsappOptIn}
                    onChange={(e) => setPlanForm((f) => ({ ...f, whatsappOptIn: e.target.checked }))}
                    className="accent-gold"
                  />
                  <label htmlFor="whatsapp" className="text-sm font-sans text-muted-foreground">Send me updates on WhatsApp</label>
                </div>
                {planError && (
                  <p className="text-red-500 text-xs font-sans" data-testid="destination-form-error">{planError}</p>
                )}
                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="w-full py-4 bg-gold text-background font-sans text-sm font-semibold rounded-lg hover:bg-gold/90 transition-colors mt-2 disabled:opacity-60"
                >
                  {planSubmitting ? "Sending..." : "Request a Plan"}
                </button>
              </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-stone-50 border-t border-stone-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <span className="w-5 h-px bg-gold" />
              <span className="text-xs font-sans uppercase tracking-widest text-gold">FAQ</span>
              <span className="w-5 h-px bg-gold" />
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground text-center mb-3">Answers to common questions</h2>
            <p className="text-muted-foreground font-sans text-sm font-light text-center mb-10">If you want, we can share a sample budget breakdown for your style.</p>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-stone-200 rounded-xl bg-white overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-stone-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-sans font-semibold text-foreground text-sm pr-4">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`flex-shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <m.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 font-sans text-sm text-muted-foreground font-light">{faq.a}</p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="font-sans text-sm text-muted-foreground mb-4">Still have questions? We're happy to talk.</p>
              <Link href="/contact">
                <m.button
                  className="px-8 py-4 bg-gold text-background section-label hover:bg-gold/90 transition-all"
                  whileHover={{ scale: 1.03 }}
                >
                  Start the Conversation
                </m.button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
