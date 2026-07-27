/**
 * Responsive delivery for the *bundled* images in `public/images`.
 *
 * This is the local-asset counterpart to `cloudinaryImage.ts`. The two are deliberately parallel
 * and non-overlapping:
 *
 *   - `cloudinaryImage.ts` → CMS-managed images. The CDN resizes on demand (`f_auto,q_auto,w_*`).
 *   - `localImage.ts`      → bundled fallback images. Variants are pre-generated at build time by
 *                            `scripts/generate-responsive-images.mjs`.
 *
 * A local image only ever resolves against the generated manifest, so every `srcset` candidate is
 * guaranteed to exist on disk — the browser never probes a 404. Any URL that is not a manifested
 * local image (a Cloudinary URL, a remote host, a data URI) returns `null` and the caller keeps its
 * existing behaviour untouched. That is what keeps the Cloudinary architecture unaffected.
 *
 * Why this matters for LCP: on a cold visit the CMS payload has not resolved yet, so the hero paints
 * from its bundled fallback. That fallback *is* the LCP element, and it was previously shipped as a
 * single full-resolution asset (1408x768, 337 KB) to every device including a 390px phone.
 */

import manifest from "@/generated/imageManifest.json";
import { isCloudinaryUrl, cldUrl } from "@/utils/cloudinaryImage";

interface ManifestEntry {
  /** Basename, used to rebuild variant URLs by convention. */
  n: string;
  /** Intrinsic width of the source. */
  w: number;
  /** Intrinsic height of the source. */
  h: number;
  /** The width ladder actually present on disk. */
  s: number[];
}

const MANIFEST = manifest as Record<string, ManifestEntry>;

export interface LocalImageSources {
  /** Original file — the `src` fallback for browsers that ignore `srcset` entirely. */
  fallback: string;
  /** `srcset` of AVIF candidates. */
  avifSrcSet: string;
  /** `srcset` of WebP candidates. */
  webpSrcSet: string;
  /** Intrinsic dimensions, so callers can set width/height and avoid layout shift. */
  width: number;
  height: number;
}

/** Variant URLs follow one convention, defined here and in the generator script only. */
function variantUrl(name: string, width: number, format: "avif" | "webp"): string {
  return `/images/responsive/${name}-${width}.${format}`;
}

function buildSrcSet(entry: ManifestEntry, format: "avif" | "webp"): string {
  return entry.s.map((w) => `${variantUrl(entry.n, w, format)} ${w}w`).join(", ");
}

/**
 * Resolves a local `/images/*` path to its pre-generated responsive variant set.
 * Returns `null` for anything not in the manifest — callers must fall back to the plain `src`.
 */
export function localImageSources(src: string | undefined | null): LocalImageSources | null {
  if (!src) return null;
  const entry = MANIFEST[src];
  if (!entry) return null;

  return {
    fallback: src,
    avifSrcSet: buildSrcSet(entry, "avif"),
    webpSrcSet: buildSrcSet(entry, "webp"),
    width: entry.w,
    height: entry.h,
  };
}

/** True when `src` is a bundled image with pre-generated responsive variants. */
export function hasLocalVariants(src: string | undefined | null): boolean {
  return Boolean(src && MANIFEST[src]);
}

/**
 * Resolves a bundled image to a right-sized variant for use in a CSS `background-image`.
 *
 * CSS backgrounds are the blind spot in any image pipeline: they carry no `srcset`, they are not
 * lazy (the fetch starts as soon as the element is laid out), and the preload scanner cannot see
 * them at all. So a decorative card background was pulling the same full-resolution original as a
 * full-bleed hero — measured at ~1.8 MB across the landing page's eight card backgrounds.
 *
 * WebP rather than AVIF is deliberate. A bare `url()` performs no format negotiation, so an AVIF
 * background would simply fail to render on a browser that cannot decode it. Plain `url()` with a
 * WebP variant is universally safe here because the originals are already WebP — this changes the
 * resolution, never the format, and therefore carries no compatibility risk.
 *
 * `width` should be the largest CSS width the element occupies, times its expected DPR. 768 covers
 * a full-width card on a 2x phone and any multi-column card on desktop.
 *
 * Handles BOTH asset sources, because a CMS-backed background is the common case in production:
 * bundled paths resolve against the build manifest, Cloudinary URLs get an equivalent CDN transform.
 * Passing a Cloudinary URL through untouched — as an earlier version of this helper did — resolves
 * to the full-resolution original; measured at 1,672 KB across seven gallery backgrounds on `/`.
 * Anything else (a remote host, a data URI) is returned unchanged.
 */
export function localBackgroundUrl(src: string | undefined | null, width = 768): string {
  if (!src) return "";

  const entry = MANIFEST[src];
  if (entry) {
    const chosen = entry.s.find((w) => w >= width) ?? entry.s[entry.s.length - 1];
    return variantUrl(entry.n, chosen, "webp");
  }

  // CMS-managed background → same width cap, delivered by the CDN. `f_auto` is intentional even
  // though a bare CSS `url()` performs no format negotiation: Cloudinary negotiates server-side
  // from the Accept header, so this is safe here in a way that a static `.avif` path would not be.
  if (isCloudinaryUrl(src)) return cldUrl(src, { width, crop: "limit" });

  return src;
}
