import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isCloudinaryUrl, cldUrl, cldSrcSet } from "@/utils/cloudinaryImage";

/**
 * The single image primitive for the public site.
 *
 * Responsibilities (so no page hand-rolls image optimization):
 *  - Cloudinary transforms: `f_auto,q_auto` on every variant, `dpr_auto` on the base src, and
 *    width/height crops so the CDN never ships an oversized original.
 *  - Responsive `srcSet` + `sizes` so the browser downloads only the resolution the viewport needs.
 *  - CLS prevention: reserves the box via an `aspect-ratio` wrapper (or explicit width/height).
 *  - Native lazy-loading + async decoding by default; `priority` opts an LCP image into eager/high.
 *
 * Non-Cloudinary URLs (local `/images/*` fallbacks, remote hosts) are passed through untouched — the
 * component never rewrites a URL it can't safely transform, so the CMS fallback system keeps working.
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

  const { finalSrc, srcSet } = useMemo(() => {
    if (!isCloudinaryUrl(src)) {
      // Local fallback or remote host — serve as-is (no duplicate/oversized download attempted).
      return { finalSrc: src, srcSet: undefined as string | undefined };
    }
    const set = cldSrcSet(src, widths, { crop, ratio });
    // Base src (used when srcSet can't apply) carries dpr_auto for correct retina scaling.
    const mid = widths[Math.floor(widths.length / 2)];
    return { finalSrc: cldUrl(src, { width: mid, height: ratio ? Math.round(mid / ratio) : undefined, crop, dpr: true }), srcSet: set };
  }, [src, widths, crop, ratio]);

  const positioned = fill || !!aspectRatio;

  const img = (
    <img
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        positioned ? "absolute inset-0 h-full w-full" : "h-auto w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        // Priority (LCP) images render opaque immediately so the fade never delays LCP.
        priority ? "opacity-100" : cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0"),
        className
      )}
      style={{ objectPosition, ...style }}
      {...rest}
    />
  );

  // `fill` mode assumes the caller already provides a positioned ancestor (the hero <section>).
  if (fill) return img;
  if (!aspectRatio) return img;

  return (
    <div
      className={cn("relative overflow-hidden bg-muted/40", wrapperClassName)}
      style={{ aspectRatio }}
    >
      {img}
    </div>
  );
}

export default OptimizedImage;
