import { useSiteContent } from "@/providers/SiteContentProvider";
import { cldUrl } from "@/utils/cloudinaryImage";

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

/**
 * Resolves the CMS logo, if one has been published.
 *
 * Deliberately defensive: `useSiteContent` throws outside its provider, and `Logo` is a generic
 * component that could legitimately be mounted somewhere the provider is absent (an admin shell, a
 * test, a future standalone page). Falling back to the built-in vector there is strictly better than
 * crashing the whole tree over a logo.
 */
function useCmsLogoUrl(): string | null {
  try {
    const { getSlotImage } = useSiteContent();
    // Empty fallback => a published slot returns its URL, an unset slot returns "".
    const resolved = getSlotImage("contact", "site_logo", "", "Alankaran").url;
    return resolved || null;
  } catch {
    return null;
  }
}

export default function Logo({ size = 52, showText = true, textColor = "hsl(var(--foreground))" }: LogoProps) {
  const gold = "hsl(36,36%,52%)";
  const goldLight = "hsl(36,36%,61%)";

  const calculatedTextSize = size ? `${Math.max(0.85, (size / 52) * 1.35)}rem` : "1.35rem";
  const calculatedGap = size < 40 ? "gap-2" : "gap-3";

  const cmsLogoUrl = useCmsLogoUrl();

  // A published CMS logo replaces the vector mark only. The wordmark keeps its `textColor`, so the
  // Footer's light-on-dark lockup still works with an uploaded mark.
  if (cmsLogoUrl) {
    const logoH = Math.round(size * 1.15);
    // Request the mark at ~2× its rendered box (retina) instead of the full-resolution upload —
    // a published logo previously downloaded at hundreds of KB to display at ~52px.
    const optimizedLogo = cldUrl(cmsLogoUrl, { width: size * 2, height: logoH * 2, crop: "limit" });
    return (
      <div className={`flex items-center ${calculatedGap} select-none`}>
        <img
          src={optimizedLogo}
          alt="Alankaran"
          width={size}
          height={logoH}
          style={{ width: size, height: logoH, objectFit: "contain" }}
          decoding="async"
          loading="eager"
        />
        {showText && (
          <div className="flex flex-col leading-none">
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: calculatedTextSize,
                letterSpacing: "0.22em",
                color: textColor,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              ALANKARAN
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${calculatedGap} select-none`}>
      {/* ── SVG Mark ── */}
      <svg
        width={size}
        height={Math.round(size * 1.15)}
        viewBox="0 0 56 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Alankaran logo mark"
      >
        {/* ── Outer decorative arch ring ── */}
        <path
          d="M28 4 C14 4 4 14 4 28 C4 42 14 52 28 52 C42 52 52 42 52 28 C52 14 42 4 28 4 Z"
          stroke={gold}
          strokeWidth="0.6"
          strokeDasharray="2.5 2"
          fill="none"
          opacity="0.45"
        />

        {/* ── Lotus petals (top crown) ── */}
        <ellipse cx="28" cy="10" rx="3" ry="6" fill={gold} opacity="0.9" transform="rotate(0,28,10)" />
        <ellipse cx="22" cy="12" rx="2.5" ry="5.5" fill={gold} opacity="0.6" transform="rotate(-28,22,12)" />
        <ellipse cx="34" cy="12" rx="2.5" ry="5.5" fill={gold} opacity="0.6" transform="rotate(28,34,12)" />
        <ellipse cx="17" cy="17" rx="2" ry="4.5" fill={gold} opacity="0.35" transform="rotate(-52,17,17)" />
        <ellipse cx="39" cy="17" rx="2" ry="4.5" fill={gold} opacity="0.35" transform="rotate(52,39,17)" />

        {/* ── Central apex diamond ornament ── */}
        <polygon
          points="28,14 30.5,18 28,22 25.5,18"
          fill={gold}
        />

        {/* ── Left leg of A ── */}
        <path
          d="M28 22 L10 56"
          stroke={textColor}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* ── Right leg of A ── */}
        <path
          d="M28 22 L46 56"
          stroke={textColor}
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* ── Left base serif ── */}
        <path d="M6 56 L14 56" stroke={textColor} strokeWidth="2.2" strokeLinecap="round" />
        {/* ── Right base serif ── */}
        <path d="M42 56 L50 56" stroke={textColor} strokeWidth="2.2" strokeLinecap="round" />

        {/* ── Crossbar ── */}
        <path
          d="M19 40 L37 40"
          stroke={gold}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* ── Crossbar left diamond ── */}
        <polygon points="15,40 18,36.5 21,40 18,43.5" fill={gold} />
        {/* ── Crossbar right diamond ── */}
        <polygon points="35,40 38,36.5 41,40 38,43.5" fill={gold} />

        {/* ── Small accent dots on legs (mid-point) ── */}
        <circle cx="19.5" cy="39.5" r="1.2" fill={goldLight} opacity="0.5" />
        <circle cx="36.5" cy="39.5" r="1.2" fill={goldLight} opacity="0.5" />

        {/* ── Bottom center ornament ── */}
        <polygon points="28,56 30,60 28,64 26,60" fill={gold} opacity="0.7" />
      </svg>

      {/* ── Text lockup ── */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: calculatedTextSize,
              letterSpacing: "0.22em",
              color: textColor,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            ALANKARAN
          </span>
        </div>
      )}
    </div>
  );
}
