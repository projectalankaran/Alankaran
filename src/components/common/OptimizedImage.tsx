import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isCloudinaryUrl, cldUrl, cldSrcSet } from "@/utils/cloudinaryImage";
import { localImageSources } from "@/utils/localImage";

/**
 * The single image primitive for the public site.
 *
 * Responsibilities (so no page hand-rolls image optimization):
 *  - Cloudinary transforms: `f_auto,q_auto` on every variant, `dpr_auto` on the base src, and
 *    width/height crops so the CDN never ships an oversized original.
 *  - Bundled `/images/*` fallbacks: AVIF + WebP `srcset` from the build-time variant manifest
 *    (`src/utils/localImage.ts`). This is the local mirror of what Cloudinary does for CMS images,
 *    and it matters because a cold visit paints the bundled fallback *before* the CMS payload
 *    resolves — so that fallback is the LCP element, not the Cloudinary URL.
 *  - Responsive `srcSet` + `sizes` so the browser downloads only the resolution the viewport needs.
 *  - CLS prevention: reserves the box via an `aspect-ratio` wrapper (or explicit width/height).
 *  - Native lazy-loading + async decoding by default; `priority` opts an LCP image into eager/high.
 *
 * Resolution order is Cloudinary → local manifest → passthrough. A URL that matches neither (a
 * remote host, a data URI) is rendered untouched, so the CMS fallback system keeps working.
 */

const DEFAULT_WIDTHS = [480, 768, 1024, 1366, 1920];

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "loading"> {
  src: string;
  alt: string;
  /** Candidate widths for the responsive srcSet (Cloudinary only). */
  widths?: number[];
  /** The `sizes` attribute — how wide the image renders at each breakpoint. */
  sizes?: string;
  /** Fixed aspect ratio (e.g. "3 / 4" or "16 / 9"). Reserves layout space and drives the crop. */
  aspectRatio?: string;
  /** Absolute-fill mode: covers the nearest positioned ancestor (drop-in for a background-image). */
  fill?: boolean;
  /** LCP image: eager load, high fetch priority, sync decode, no lazy. */
  priority?: boolean;
  /**
   * Fade in on load. Disable when an ancestor already animates opacity (the hero crossfade), so the
   * two transitions don't compound into a visibly slower reveal.
   */
  fade?: boolean;
  /** Cloudinary crop mode. "fill" (default, exact box) or "limit" (scale down, keep whole image). */
  crop?: "fill" | "limit";
  /** object-fit for the rendered image. */
  fit?: "cover" | "contain";
  objectPosition?: string;
  /** Extra classes for the wrapper element. */
  wrapperClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = "100vw",
  aspectRatio,
  fill = false,
  priority = false,
  fade = true,
  crop = "fill",
  fit = "cover",
  objectPosition = "center",
  className,
  wrapperClassName,
  style,
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  const ratioParts = aspectRatio?.split("/").map((p) => parseFloat(p.trim()));
  const ratio = ratioParts && ratioParts.length === 2 ? ratioParts[0] / ratioParts[1] : undefined;

  const { finalSrc, srcSet, local } = useMemo(() => {
    if (isCloudinaryUrl(src)) {
      const set = cldSrcSet(src, widths, { crop, ratio });
      // Base src (used when srcSet can't apply) carries dpr_auto for correct retina scaling.
      const mid = widths[Math.floor(widths.length / 2)];
      return {
        finalSrc: cldUrl(src, { width: mid, height: ratio ? Math.round(mid / ratio) : undefined, crop, dpr: true }),
        srcSet: set,
        local: null,
      };
    }
    // Bundled image with build-time variants → AVIF/WebP <picture>. Returns null for anything not
    // in the manifest (remote host, data URI), which falls through to plain passthrough below.
    const localSources = localImageSources(src);
    return { finalSrc: src, srcSet: undefined as string | undefined, local: localSources };
  }, [src, widths, crop, ratio]);

  const positioned = fill || !!aspectRatio;

  const img = (
    <img
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet || local ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      // An LCP image is decoded synchronously so the paint is not deferred to a later frame.
      decoding={priority ? "sync" : "async"}
      onLoad={() => setLoaded(true)}
      className={cn(
        positioned ? "absolute inset-0 h-full w-full" : "h-auto w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        // Priority (LCP) images render opaque immediately so the fade never delays LCP.
        priority || !fade
          ? "opacity-100"
          : cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0"),
        className
      )}
      style={{ objectPosition, ...style }}
      {...rest}
    />
  );

  // `<picture>` carries `display:contents` so it contributes no box of its own — every existing
  // layout rule (absolute fill, aspect-ratio wrappers, object-fit) behaves exactly as it did when
  // the `<img>` was a direct child. The browser picks the first `<source>` whose type it decodes,
  // so pre-AVIF Safari transparently falls back to WebP, then to the original file.
  const picture = local ? (
    <picture style={{ display: "contents" }}>
      <source type="image/avif" srcSet={local.avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={local.webpSrcSet} sizes={sizes} />
      {img}
    </picture>
  ) : (
    img
  );

  // `fill` mode assumes the caller already provides a positioned ancestor (the hero <section>).
  if (fill) return picture;
  if (!aspectRatio) return picture;

  return (
    <div
      className={cn("relative overflow-hidden bg-muted/40", wrapperClassName)}
      style={{ aspectRatio }}
    >
      {picture}
    </div>
  );
}

export default OptimizedImage;
