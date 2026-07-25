/**
 * Section keys supported in the Alankaran Custom Image CMS.
 * Future sections (`destinations`, `testimonials`) require no structural or database changes.
 */
export type SectionKey =
  | "hero"
  | "about"
  | "services"
  | "gallery"
  | "testimonials"
  | "contact"
  | "settings";

/**
 * Slot metadata record stored inside Firestore under `cmsSiteContent/{sectionKey}`.
 * Exposes full asset characteristics without relying solely on raw CDN URLs.
 */
export interface CMSSlotMetadata {
  id: string; // Domain unique slot ID (e.g. "hero_hero_main_1721200000000")
  sectionKey: SectionKey | string;
  slotName: string; // e.g. "hero_main", "about_portrait", "service_mandap", "gallery_grid_1"
  cloudinaryId: string; // Cloudinary public_id
  url: string; // Cloudinary secure_url (HTTPS)
  altText: string;
  width?: number;
  height?: number;
  format?: string;
  resourceType?: string;
  sizeBytes?: number;
  createdAt?: number;
  updatedAt: number;
  updatedBy: string; // Admin user email (`currentUser.email`)
  // Phase 6 Gallery Management Optional Fields (`Task 3 & 6`)
  caption?: string;
  tags?: string[];
  category?: string;
  order?: number;
  visibility?: boolean; // true = visible, false = hidden
  isDeleted?: boolean;
  deletedAt?: number;
}

/**
 * Complete document structure stored inside `cmsSiteContent/{sectionKey}`.
 * A section document contains its title, description, and a map of `slots` keyed by `slotName`.
 */
export interface CMSSectionContent {
  sectionKey: SectionKey | string;
  title?: string;
  description?: string;
  slots: Record<string, CMSSlotMetadata>;
  updatedAt: number;
  updatedBy: string;
}

/**
 * System configuration settings stored inside `cmsSettings/system`.
 */
export interface CMSSettings {
  cmsTitle: string;
  autoOptimize: boolean;
  maxUploadMB: number;
  allowedFormats: string[];
  updatedAt: number;
  updatedBy: string;
}

/**
 * UI loading and mutation state representation for administrative components.
 */
export type CMSMutationState = "idle" | "loading" | "saving" | "updating" | "deleting" | "error" | "success";

/**
 * Phase 3.5 Draft and Published Workflow.
 * Every section maintains both its working Draft (`slots` or `draftSlots`) and its immutable Published state (`publishedSlots`).
 */
export interface CMSSectionWithPublishing extends CMSSectionContent {
  draftSlots?: Record<string, CMSSlotMetadata>;
  publishedSlots?: Record<string, CMSSlotMetadata>;
  publishedAt?: number | null;
  publishedBy?: string | null;
  publishedVersionId?: string | null;
}

/**
 * Phase 3.5 Version History Snapshot.
 * Stored inside `cmsVersions/{sectionKey}_{versionId}` on every Publish action.
 */
export interface CMSVersionSnapshot {
  versionId: string;
  timestamp: number;
  user: string;
  section: SectionKey | string;
  changes: string; // Human-readable summary of slot changes in this snapshot
  metadata: {
    slots: Record<string, CMSSlotMetadata>;
  };
}

/**
 * Phase 3.5 Soft Delete Trash Record.
 * Stored inside `cmsTrash/{trashId}` when an image slot or record is deleted.
 */
export interface CMSTrashRecord {
  trashId: string;
  deletedAt: number;
  deletedBy: string;
  originalLocation: {
    sectionKey: string;
    slotName: string;
  };
  asset: CMSSlotMetadata;
}

/**
 * Phase 3.5 Audit Log Action Types and Entry Model.
 * Stored inside `cmsAuditLogs/{logId}`. Exclusively accessible by administrators.
 */
export type AuditActionType = "Upload" | "Replace" | "Delete" | "Publish" | "Restore" | "Login" | "Logout" | "Cache_Clear" | "Inquiry";

export interface CMSAuditLogEntry {
  id: string;
  action: AuditActionType;
  user: string;
  timestamp: number;
  target: string; // e.g. "hero/hero_main" or "cmsSettings/system"
  details: string;
}

/**
 * Phase 3.5 CMS Health & Diagnostic Status Report.
 */
export interface CMSHealthReport {
  score: number; // 0 to 100
  status: "healthy" | "degraded" | "critical";
  checks: {
    firestore: { reachable: boolean; latencyMs: number; message: string };
    cloudinary: { reachable: boolean; configured: boolean; message: string };
    authentication: { valid: boolean; userEmail: string | null; message: string };
    realtime: { active: boolean; listenerCount: number; message: string };
    storage: { available: boolean; provider: string; message: string };
  };
  timestamp: number;
}

/**
 * Phase 3.5 Cache Layer Entry Model.
 */
export interface CMSCacheEntry<T> {
  data: T;
  version: string;
  lastSync: number;
  expiration: number;
}

/**
 * Phase 3.5 Image Usage Tracking Reference.
 */
export interface ImageUsageReference {
  slotId: string;
  sectionKey: string;
  slotName: string;
  displayName: string;
  url: string;
  cloudinaryId: string;
}

/**
 * Phase 4 CMS System Configuration Schema.
 * Stored under `cmsSettings/system` in Firestore.
 */
export interface CMSSystemConfig {
  cacheTTL: number; // in milliseconds
  maxUploadSizeMB: number;
  maxVersions: number;
  maintenanceMode: boolean;
  enablePublishing: boolean;
  featureFlags: {
    enablePreviewMode: boolean;
    enableScheduledPublishing: boolean;
    enableApprovalWorkflow: boolean;
    enableContentLocking: boolean;
  };
  updatedAt: number;
  updatedBy: string;
}

/**
 * Phase 4 Content Locking Architecture.
 * Prevents simultaneous administrative overwrites when multiple admins edit the same section.
 */
export interface ContentEditLock {
  sectionKey: SectionKey | string;
  lockedBy: string; // Admin user email
  userName?: string;
  timestamp: number;
  expiresAt: number; // Lock automatically expires if inactive
}

/**
 * Phase 4 Scheduled Publishing Architecture.
 * Prepares system for future scheduled publishing without requiring immediate cron execution.
 */
export interface ScheduledPublication {
  scheduleId: string;
  sectionKey: SectionKey | string;
  versionId: string;
  scheduledPublishTime: number;
  expiresAt?: number | null;
  status: "pending" | "published" | "cancelled" | "expired";
  createdBy: string;
  createdAt: number;
}

/**
 * Phase 4 Approval Workflow Architecture.
 * Defines role hierarchy (`viewer -> editor -> admin -> owner`) and review state progression.
 */
export type RoleHierarchyLevel = "viewer" | "editor" | "admin" | "owner";
export type WorkflowStatus = "draft" | "in_review" | "approved" | "rejected" | "published";

export interface ApprovalWorkflowRecord {
  workflowId: string;
  sectionKey: SectionKey | string;
  submittedBy: string;
  submittedAt: number;
  status: WorkflowStatus;
  reviewedBy?: string | null;
  reviewedAt?: number | null;
  comments?: string;
}

/**
 * Phase 4 Analytics & Telemetry Event.
 */
export type CMSAnalyticsEventType = "load" | "update" | "cache_hit" | "cache_miss" | "fallback_trigger";

export interface CMSAnalyticsEvent {
  eventId: string;
  eventType: CMSAnalyticsEventType;
  target: string; // e.g. "hero/hero_main"
  durationMs?: number;
  timestamp: number;
  details?: string;
}


/**
 * Phase A Task 7 — Public website inquiry submissions.
 * Stored inside `cmsInquiries/{inquiryId}`. Created by anonymous visitors; readable by admins only.
 */
/**
 * Lead lifecycle. `new` is the only status a public form may write (pinned by the `cmsInquiries`
 * create rule); every later status is set by an admin from the Inquiries dashboard. `archived` is
 * retained for backward compatibility with any pre-existing records.
 */
export type InquiryStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "quotation_sent"
  | "converted"
  | "closed"
  | "archived";

/** Which form/page produced the inquiry — used to route follow-up. */
export type InquirySourcePage = "contact" | "booking" | "consultation" | "destinations";

export interface CMSInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  message: string;
  createdAt: number;
  status: InquiryStatus;
  sourcePage: InquirySourcePage;
  // Optional fields — populated by whichever form collected them.
  eventDate?: string;
  guestCount?: string;
  location?: string;
  budget?: string;
  company?: string;
  referralSource?: string;
  /** Internal admin-only note, editable from the Inquiries dashboard. Never written by public forms. */
  notes?: string;
  /** Epoch millis of the last admin edit (status/notes). Absent on submitter-created records. */
  updatedAt?: number;
}

/**
 * The caller-supplied portion of an inquiry; `id`, `createdAt`, and `status` are assigned on write.
 * `notes` and `updatedAt` are admin-only and excluded so a public form can never send them.
 */
export type CMSInquiryInput = Omit<CMSInquiry, "id" | "createdAt" | "status" | "notes" | "updatedAt">;

/**
 * Phase A Task 8 — Site-wide contact details.
 * Stored inside `cmsSiteContent/contact` alongside that section's image slots, so Contact, Footer,
 * and the WhatsApp button all read one record instead of duplicating literals.
 */
export interface CMSContactInfo {
  phones: string[];
  emails: string[];
  addressLine: string;
  addressShort: string;
  mapQuery: string;
  whatsappNumber: string;
  whatsappMessage: string;
  instagramUrl: string;
  facebookUrl: string;
  businessHours: string;
  studios: string[];
  updatedAt?: number;
  updatedBy?: string;
}

/**
 * The seven editable global text settings, in the order the admin editor renders them.
 * Derived from `CMSContactInfo` so the two can never drift.
 */
export type GlobalSettingField =
  | "phones"
  | "emails"
  | "addressLine"
  | "mapQuery"
  | "whatsappNumber"
  | "instagramUrl"
  | "facebookUrl";

/** Result of validating a single global setting. */
export interface GlobalSettingValidation {
  valid: boolean;
  error?: string;
}
