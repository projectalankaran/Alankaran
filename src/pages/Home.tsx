import { useState, useEffect, lazy, Suspense, memo } from "react";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";

// We use an IntersectionObserver wrapper (LazySection) later, but for now we just lazy load it
const HomeBelowFold = memo(lazy(() => import("@/components/home/HomeBelowFold")));

export default function Home() {
  // The hero image is resolved inside <HeroSection>; Home no longer duplicates that lookup just to
  // feed a preload prop. The LCP preload is synthesised at build time from the rendered markup
  // (see scripts/prerender.mjs), which is the only way to guarantee it matches the actual request.
  const [pulseHighlight, setPulseHighlight] = useState(false);

  useEffect(() => {
    const handleHighlight = () => {
      setPulseHighlight(true);
      const timer = setTimeout(() => setPulseHighlight(false), 3000);
      return () => clearTimeout(timer);
    };
    window.addEventListener("highlight-royal-themes", handleHighlight);
    return () => window.removeEventListener("highlight-royal-themes", handleHighlight);
  }, []);

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Hyderabad Luxury Wedding Planner & Nizami Floral Design"
        description="Alankaran is Hyderabad's premier luxury wedding planning and management company, creating immersive royal celebrations inspired by Nizami heritage, romance, and modern editorial beauty."
        url="https://alankaran.com/"
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": ["LocalBusiness", "Organization"],
          "name": "Alankaran Luxury Weddings",
          "url": "https://alankaran.com",
          "logo": "https://alankaran.com/favicon.svg",
          "image": "https://alankaran.com/og-image.jpg",
          "description": "Hyderabad's premier luxury wedding planning and management company.",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Hyderabad",
            "addressCountry": "IN"
          }
        }}
      />

      <HeroSection />

      <Suspense fallback={<div className="h-screen w-full" />}>
        <HomeBelowFold pulseHighlight={pulseHighlight} />
      </Suspense>

      <Footer />
    </div>
  );
}
