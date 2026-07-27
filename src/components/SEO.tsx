import { Helmet } from "react-helmet-async";

/**
 * NOTE ON LCP PRELOADING
 *
 * This component deliberately does NOT emit `<link rel="preload" as="image">` for the hero.
 *
 * It used to, via a `preloadImage` prop. That preload was ineffective and actively harmful:
 *   - It pointed at the raw `getSlotImage(...)` URL — the full-resolution original — while the hero
 *     actually renders a responsive AVIF/WebP `srcset`. The two never matched, so the preload
 *     downloaded a *second*, larger copy of the hero that was then discarded.
 *   - Because `react-helmet-async@3` defers to React 19's native metadata handling, during SSR the
 *     tag was emitted inline in <body> rather than <head>, and it appeared twice.
 *
 * The authoritative preload is now synthesised at build time by `scripts/prerender.mjs`, which reads
 * the actual rendered `<picture>`/`<img>` for each route and emits head preloads whose `imagesrcset`
 * is byte-identical to what the browser will request. One hint, guaranteed to match.
 */
interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export default function SEO({ title, description, keywords, image = "/og-image.jpg", url = "https://alankaran.com" }: SEOProps) {
  const fullTitle = `${title} | Alankaran — Luxury Wedding Experiences`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <meta name="author" content="Alankaran Luxury Weddings" />
      <meta name="theme-color" content="#2A2421" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
