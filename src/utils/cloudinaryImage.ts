/**
 * Cloudinary URL helpers — the single place that builds delivery transforms for the public site.
 *
 * Every transformed URL carries `f_auto` (AVIF/WebP negotiation) and `q_auto` (perceptual quality),
 * so the CDN never ships an original-resolution asset. Callers pass the width they actually render at;
 * the CDN returns exactly that. Non-Cloudinary URLs (local `/images/*` fallbacks, remote hosts) are
 * returned untouched so the CMS fallback system keeps working.
 */

export function isCloudinaryUrl(url: string | undefined | null): url is string {
  return typeof url === "string" && /^https?:\/\//.test(url) && url.includes("/image/upload/");
}

export interface CldOptions {
  width: number;
  height?: number;
  /** "limit" scales down but preserves the whole image; "fill" crops to an exact box. */
  crop?: "limit" | "fill";
  /** Add `dpr_auto` (correct for a single non-srcSet <img>; omit when using width-based srcSet). */
  dpr?: boolean;
}

/** Injects a Cloudinary transformation segment right after `/image/upload/`. */
export function cldUrl(url: string, opts: CldOptions): string {
  if (!isCloudinaryUrl(url)) return url;
  const parts = ["f_auto", "q_auto"];
  if (opts.dpr) parts.push("dpr_auto");
  parts.push(`c_${opts.crop ?? "limit"}`, `w_${Math.round(opts.width)}`);
  if (opts.height) parts.push(`h_${Math.round(opts.height)}`);
  return url.replace("/image/upload/", `/image/upload/${parts.join(",")}/`);
}

/**
 * Canonical transform for a full-bleed hero image. Deterministic (one URL string) so the same value
 * can be used for BOTH the rendered `<img>` and its `<link rel=preload>` — matching them exactly is
 * what prevents a duplicate hero download. Caps at 1920 + `f_auto,q_auto,dpr_auto`.
 */
export function heroImageUrl(url: string): string {
  return cldUrl(url, { width: 1920, crop: "limit", dpr: true });
}

/** Builds a responsive `srcSet` string across candidate widths (Cloudinary only). */
export function cldSrcSet(
  url: string,
  widths: number[],
  opts: { crop?: "limit" | "fill"; ratio?: number } = {}
): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths
    .map((w) => {
      const height = opts.ratio ? Math.round(w / opts.ratio) : undefined;
      return `${cldUrl(url, { width: w, height, crop: opts.crop })} ${w}w`;
    })
    .join(", ");
}
