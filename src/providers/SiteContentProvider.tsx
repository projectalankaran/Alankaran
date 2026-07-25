import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
// Firebase deferral: the Firestore SDK is the single largest eager chunk on public pages. We import
// only the Firebase-CLEAN pieces statically (path builders, the localStorage cache, coverage) and
// pull the actual `firestoreService` (which drags in firebase-app + firebase-firestore) lazily inside
// `loadSections`, which is already async. First paint renders from the memory/localStorage cache and
// bundled fallbacks; the SDK loads afterward and refreshes content exactly as before — same data,
// same resolution path, no new flicker class (the fallback→CMS swap already existed).
import { FirestorePaths } from "@/services/firestore/firestorePaths";
import { cmsCacheService } from "@/domains/cms/services/cmsCache.service";
import { slotCoverageService } from "@/domains/cms/services/slotCoverage.service";
import type { CMSSectionContent, SectionKey, CMSSlotMetadata, CMSContactInfo } from "@/domains/cms/types";
import { PUBLIC_SECTIONS, DEFAULT_CONTACT_INFO, BUNDLED_GALLERY_FALLBACKS } from "@/domains/cms/constants";
import { resolveGalleryImages, selectPublicSlotMap } from "@/domains/cms/utils/galleryResolver";
import { resolvePublicationState } from "@/domains/cms/utils/globalSettingsDiff";
import { probeImage, isImageBroken } from "@/domains/cms/utils/imageHealth";
import type { CoverageReport } from "@/domains/cms/services/slotCoverage.service";
import { useAuth } from "@/context/AuthContext";
import { useCMSAnalytics } from "@/domains/cms/hooks/useCMSAnalytics";

export interface SiteSlotResolvedImage {
  url: string;
  altText: string;
  isCMS: boolean;
  isCached: boolean;
  cloudinaryId?: string;
  slotName: string;
  sectionKey: string;
}

/** One image in the dynamic gallery collection, resolved for public rendering. */
export interface SiteGalleryImage {
  url: string;
  altText: string;
  caption?: string;
  category?: string;
  order: number;
  slotName: string;
  cloudinaryId?: string;
}

export interface SiteContentContextValue {
  /**
   * Resolves a slot image for the public website (`Task 1, 2, 4, 5`).
   * Prioritizes Published content. Falls back to cache or local bundled asset.
   */
  getSlotImage: (sectionKey: SectionKey | string, slotName: string, fallbackUrl: string, fallbackAlt?: string) => SiteSlotResolvedImage;
  /**
   * Resolves the dynamic gallery collection, ordered by `slot.order`.
   * Returns `[]` when the CMS holds no gallery images, letting callers use bundled defaults.
   * This is what the Gallery Manager writes to — the two are the same data.
   */
  getGalleryImages: () => SiteGalleryImage[];
  /**
   * Retrieves full section payload if needed.
   */
  getSection: (sectionKey: SectionKey | string) => CMSSectionContent | null;
  /**
   * Live CMS coverage report for Diagnostics.
   */
  getCoverageReport: () => CoverageReport;
  /**
   * Site-wide contact details from `cmsSiteContent/contact`.
   * Falls back field-by-field to `DEFAULT_CONTACT_INFO`, so a partially filled document is safe.
   */
  contactInfo: CMSContactInfo;
  /**
   * Indicates if initial load from cache/Firestore is currently processing.
   */
  isLoading: boolean;
  /**
   * Indicates whether browser is currently offline.
   */
  isOffline: boolean;
  /**
   * Admin Preview Mode state. When enabled by an authenticated admin, displays Draft instead of Published.
   */
  previewMode: boolean;
  setPreviewMode: (enabled: boolean) => void;
  /**
   * Background refresh to sync latest published data (`Task 3 & 9`).
   */
  refreshAll: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

/**
 * Every section the public website reads, derived from the slot catalog so a new section never has to
 * be registered in two places.
 */
const CORE_SECTIONS: SectionKey[] = PUBLIC_SECTIONS;

export interface SiteContentProviderProps {
  children: ReactNode;
}

/**
 * Phase 4 Enterprise SiteContentProvider.
 * Decouples public website UI from direct Firestore reads.
 * Guarantees Published-Only reads, Multi-Tier Caching, and Resilient Offline Fallback.
 */
export function SiteContentProvider({ children }: SiteContentProviderProps) {
  const { currentUser } = useAuth();
  const { trackEvent } = useCMSAnalytics();

  const [sections, setSections] = useState<Record<string, CMSSectionContent>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof window !== "undefined" ? !navigator.onLine : false
  );
  const [previewMode, setPreviewModeState] = useState<boolean>(false);
  // Bumped when a CMS image URL is confirmed dead, so consumers re-render and pick up the
  // bundled fallback. The health verdicts themselves live in the imageHealth module.
  const [brokenRevision, setBrokenRevision] = useState(0);
  const markBroken = useCallback(() => setBrokenRevision((n) => n + 1), []);

  // Task 17: Preview Mode is restricted exclusively to authenticated administrators
  const setPreviewMode = useCallback((enabled: boolean) => {
    if (currentUser) {
      setPreviewModeState(enabled);
      trackEvent("update", "previewMode", undefined, `Preview mode set to ${enabled}`);
    } else {
      setPreviewModeState(false);
    }
  }, [currentUser, trackEvent]);

  // Monitor network online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      trackEvent("fallback_trigger", "network_offline", undefined, "Switched to offline cache & bundled asset fallback");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [trackEvent]);

  // Load section data via Cache Strategy + Firestore background sync
  const loadSections = useCallback(async (backgroundSync = false) => {
    const startTime = Date.now();
    const loadedMap: Record<string, CMSSectionContent> = { ...sections };
    let anyCacheMiss = false;

    // Step 1: Instant check of Level 1 (Memory) and Level 2 (localStorage)
    for (const key of CORE_SECTIONS) {
      const cached = cmsCacheService.get<CMSSectionContent>(key);
      if (cached) {
        loadedMap[key] = cached;
        if (!backgroundSync) {
          trackEvent("cache_hit", key);
        }
      } else {
        anyCacheMiss = true;
      }
    }

    if (Object.keys(loadedMap).length > 0 && !backgroundSync) {
      setSections(loadedMap);
      setIsLoading(false);
    }

    // Step 2: If cache miss or background sync, fetch from Firestore (`Task 3 & 9`)
    if (anyCacheMiss || backgroundSync) {
      if (typeof window !== "undefined" && !navigator.onLine) {
        setIsLoading(false);
        return;
      }

      try {
        // Lazy-load the Firestore SDK only now (after first paint / cache render).
        const { firestoreService } = await import("@/services/firestore/firestore.service");
        const fetchPromises = CORE_SECTIONS.map(async (key) => {
          try {
            const doc = await firestoreService.get<any>(FirestorePaths.siteContent(key));
            if (doc) {
              const sanitized: CMSSectionContent = {
                sectionKey: doc.sectionKey || key,
                title: doc.title,
                description: doc.description,
                slots: doc.slots || {},
                ...doc,
              };
              cmsCacheService.set(key, sanitized);
              return { key, doc: sanitized };
            }
          } catch (err) {
            // Offline or permission issue, fallback gracefully
          }
          return { key, doc: null };
        });

        const results = await Promise.all(fetchPromises);
        const updatedMap = { ...loadedMap };
        results.forEach(({ key, doc }) => {
          if (doc) {
            updatedMap[key] = doc;
            if (anyCacheMiss) trackEvent("cache_miss", key, Date.now() - startTime);
          }
        });

        setSections(updatedMap);
      } finally {
        setIsLoading(false);
      }
    }
  }, [sections, trackEvent]);

  // Initial load and background refresh (`Task 3 & 9`)
  useEffect(() => {
    loadSections(false);
  }, []);

  const refreshAll = useCallback(async () => {
    await loadSections(true);
  }, [loadSections]);

  const getSection = useCallback(
    (sectionKey: SectionKey | string): CMSSectionContent | null => {
      return sections[sectionKey] || null;
    },
    [sections]
  );

  /**
   * Core public website image resolution logic (`Task 2, 4, 5`).
   * Evaluates Published slots vs Draft slots (if admin Preview Mode is active) vs Local bundled fallbacks.
   */
  const getSlotImage = useCallback(
    (sectionKey: SectionKey | string, slotName: string, fallbackUrl: string, fallbackAlt?: string): SiteSlotResolvedImage => {
      const section = sections[sectionKey] as any;
      const isCached = Boolean(cmsCacheService.get(sectionKey));

      // Which slot map the public site reads. This delegates to `selectPublicSlotMap` so named slots
      // and the gallery collection resolve publish state through exactly one implementation.
      //
      // The map is chosen ONCE and then indexed — it is NOT a per-slot `publishedSlots?.[name] ||
      // slots?.[name]` fallback. That per-slot form leaked unpublished drafts to the live site: for a
      // section that had been published at least once, any slot missing from `publishedSlots` fell
      // through to the draft in `slots` and went live without ever being published. The map-level
      // fallback still covers legacy records that predate the publish workflow (no `publishedSlots`
      // key at all), which is the only case it was meant to handle.
      const slotMap = selectPublicSlotMap(section, previewMode && Boolean(currentUser));
      const slot: CMSSlotMetadata | undefined = slotMap[slotName];

      // A slot record exists AND its asset still resolves. `isImageBroken` only ever returns true
      // for a URL a previous probe positively failed, so the happy path is unaffected: the CMS URL
      // is returned immediately, with no probe latency and no flash of fallback content.
      if (slot && slot.url && !isImageBroken(slot.url)) {
        // Verify the asset in the background. Firestore can only tell us a URL was stored, not that
        // the underlying Cloudinary asset still exists — so a deleted or renamed asset would render
        // broken with no fallback. A failed probe flips this slot to its bundled asset on the next
        // render. Deduped per URL, skipped during SSR, and never run for local paths.
        probeImage(slot.url, markBroken);

        slotCoverageService.record(String(sectionKey), slotName, true);
        return {
          url: slot.url,
          altText: slot.altText || fallbackAlt || `${sectionKey.toUpperCase()} — ${slotName}`,
          isCMS: true,
          isCached,
          cloudinaryId: slot.cloudinaryId,
          slotName,
          sectionKey,
        };
      }

      // Task 4: Resilient Offline / Bundled Fallback (`Website should never break`).
      // Phase A Task 4: the fallback is no longer silent — it is recorded here, warned about in DEV,
      // and reported in Diagnostics.
      slotCoverageService.record(String(sectionKey), slotName, false, fallbackUrl);
      return {
        url: fallbackUrl,
        altText: fallbackAlt || `${sectionKey.toUpperCase()} — ${slotName} (Bundled Fallback)`,
        isCMS: false,
        isCached: false,
        slotName,
        sectionKey,
      };
    },
    [sections, previewMode, currentUser, brokenRevision, markBroken]
  );

  /**
   * Phase A Task 1 — Dynamic gallery resolution.
   *
   * The gallery is an admin-managed collection, not a fixed slot list: whatever the Gallery Manager
   * writes into `cmsSiteContent/gallery` is exactly what renders here, ordered by `slot.order`.
   * Deleted and hidden slots are excluded. Returns `[]` when the CMS has no gallery content so the
   * caller can fall back to bundled defaults.
   */
  const getGalleryImages = useCallback((): SiteGalleryImage[] => {
    const slotMap = selectPublicSlotMap(sections["gallery"], previewMode && Boolean(currentUser));
    const resolved = resolveGalleryImages(slotMap);

    // Resolution order is Cloudinary first, bundled asset only if that is unavailable.
    //
    // A confirmed-dead entry is SUBSTITUTED with the bundled image at the same position, not
    // dropped. Dropping would shift every later entry up by one, so a single dead URL would
    // silently change which photo appears in every downstream position — `WeddingStories` reads
    // gallery[0..7] and `HomeBelowFold` reads gallery[0..11] positionally. Substituting keeps the
    // collection's length and ordering stable.
    const images = resolved
      .map((img, index) => {
        if (!isImageBroken(img.url)) {
          probeImage(img.url, markBroken); // verify in the background; no cost on the happy path
          return img;
        }
        const bundled = BUNDLED_GALLERY_FALLBACKS[index];
        // Past the end of the bundled list there is nothing to substitute, so the entry is dropped.
        return bundled ? { ...img, url: bundled.url } : null;
      })
      .filter((img): img is SiteGalleryImage => img !== null);

    slotCoverageService.recordGalleryCount(images.length);
    return images;
  }, [sections, previewMode, currentUser, brokenRevision, markBroken]);

  const getCoverageReport = useCallback(
    (): CoverageReport => slotCoverageService.buildReport(sections),
    [sections]
  );

  /**
   * Phase A Task 8 — one source of truth for contact details.
   * Stored as a `contact` payload on the `cmsSiteContent/contact` document (beside that section's
   * image slots). Merged over the bundled defaults so a missing or partial record still renders.
   */
  const contactInfo = useMemo<CMSContactInfo>(() => {
    const section = sections["contact"] as any;

    // Publication state is resolved by the shared helper — the same one the editor and Diagnostics
    // use — so the website can never disagree with what the CMS reports as live. Admins in Preview
    // Mode see the working draft; everyone else sees the live record.
    const { draft, live } = resolvePublicationState(section, DEFAULT_CONTACT_INFO);
    const stored = previewMode && currentUser ? draft || live : live;

    if (!stored || typeof stored !== "object") return DEFAULT_CONTACT_INFO;
    return {
      ...DEFAULT_CONTACT_INFO,
      ...stored,
      // Never let an empty array blank out the site's only phone number or email.
      phones: stored.phones?.length ? stored.phones : DEFAULT_CONTACT_INFO.phones,
      emails: stored.emails?.length ? stored.emails : DEFAULT_CONTACT_INFO.emails,
      studios: stored.studios?.length ? stored.studios : DEFAULT_CONTACT_INFO.studios,
    };
  }, [sections, previewMode, currentUser]);

  const value = useMemo(
    () => ({
      getSlotImage,
      getGalleryImages,
      getSection,
      getCoverageReport,
      contactInfo,
      isLoading,
      isOffline,
      previewMode: previewMode && Boolean(currentUser),
      setPreviewMode,
      refreshAll,
    }),
    [
      getSlotImage,
      getGalleryImages,
      getSection,
      getCoverageReport,
      contactInfo,
      isLoading,
      isOffline,
      previewMode,
      currentUser,
      setPreviewMode,
      refreshAll,
    ]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/**
 * Public website hook (`useSiteContent`).
 * Guarantees zero direct Firestore calls across public UI components.
 */
export function useSiteContent(): SiteContentContextValue {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used within a <SiteContentProvider>.");
  }
  return context;
}

/**
 * Convenience hook for the site-wide contact details.
 * Every phone number, email, address, social link, and WhatsApp URL on the website resolves here.
 */
export function useContactInfo(): CMSContactInfo {
  return useSiteContent().contactInfo;
}
