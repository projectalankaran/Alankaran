import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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

function isCloudinary(url: string): boolean {
  return /^https?:\/\//.test(url) && url.includes("/image/upload/");
}

/** Injects a Cloudinary transformation segment right after `/image/upload/`. */
function withTransform(url: string, transform: string): string {
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}

export function OptimizedImage({
  src,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = "100vw",
  aspectRatio,
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
    if (!isCloudinary(src)) {
      // Local fallback or remote host — serve as-is (no duplicate/oversized download attempted).
      return { finalSrc: src, srcSet: undefined as string | undefined };
    }
    const build = (w: number, includeDpr: boolean) => {
      const parts = ["f_auto", "q_auto"];
      if (includeDpr) parts.push("dpr_auto");
      parts.push(`c_${crop}`, `w_${w}`);
      if (ratio) parts.push(`h_${Math.round(w / ratio)}`);
      return withTransform(src, parts.join(","));
    };
    const set = widths.map((w) => `${build(w, false)} ${w}w`).join(", ");
    // Base src (used when srcSet can't apply) carries dpr_auto for correct retina scaling.
    const mid = widths[Math.floor(widths.length / 2)];
    return { finalSrc: build(mid, true), srcSet: set };
  }, [src, widths, crop, ratio]);

  const img = (
    <img
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "async" : "async"}
      onLoad={() => setLoaded(true)}
      className={cn(
        aspectRatio ? "absolute inset-0 h-full w-full" : "h-auto w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        "transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ objectPosition, ...style }}
      {...rest}
    />
  );

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
