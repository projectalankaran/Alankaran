import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
  Inbox,
  Search,
  SlidersHorizontal,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronDetail,
  Phone,
  Mail,
  Copy,
  PhoneCall,
  FileText,
  CheckCircle2,
  Users,
  Download,
  X,
  Bell,
  BellOff,
  Trash2,
  Calendar,
  MapPin,
  Wallet,
  Building2,
  Sparkles,
  MessageSquareText,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  AdminBreadcrumb,
  PageLoader,
  EmptyState,
  ErrorState,
  StatsCard,
} from "@/components/admin/ui";
import { useAuth } from "@/context/AuthContext";
import { inquiryService } from "@/domains/cms/services";
import { downloadInquiriesCsv } from "@/domains/cms/utils";
import { showSuccess, showError } from "@/utils/toast";
import { ROUTES } from "@/constants/routes";
import type { CMSInquiry, InquiryStatus, InquirySourcePage } from "@/domains/cms/types";

// ─── Status presentation ──────────────────────────────────────────────────────

const STATUS_META: Record<
  InquiryStatus,
  { label: string; pill: string; rank: number }
> = {
  new: { label: "New", pill: "text-blue-300 bg-blue-950/50 border-blue-800/70", rank: 0 },
  contacted: { label: "Contacted", pill: "text-amber-300 bg-amber-950/50 border-amber-800/70", rank: 1 },
  follow_up: { label: "Follow Up", pill: "text-purple-300 bg-purple-950/50 border-purple-800/70", rank: 2 },
  quotation_sent: { label: "Quotation Sent", pill: "text-indigo-300 bg-indigo-950/50 border-indigo-800/70", rank: 3 },
  converted: { label: "Converted", pill: "text-emerald-300 bg-emerald-950/50 border-emerald-800/70", rank: 4 },
  closed: { label: "Closed", pill: "text-stone-300 bg-stone-900/60 border-stone-700/70", rank: 5 },
  archived: { label: "Archived", pill: "text-stone-400 bg-stone-900/50 border-stone-700/60", rank: 6 },
};

// Statuses an admin can assign, in workflow order (archived is legacy-only, not offered).
const ASSIGNABLE_STATUSES: InquiryStatus[] = [
  "new",
  "contacted",
  "follow_up",
  "quotation_sent",
  "converted",
  "closed",
];

const SOURCE_LABELS: Record<InquirySourcePage, string> = {
  contact: "Contact",
  booking: "Booking",
  consultation: "Consultation",
  destinations: "Destinations",
};

type SortKey = "newest" | "oldest" | "name" | "weddingDate" | "status";

const PAGE_SIZE = 25;
const SOUND_PREF_KEY = "alankaran.inquiries.sound";

// ─── Formatters ────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function absoluteTime(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatWeddingDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Subtle two-note WebAudio chime for a new lead. Best-effort — silently no-ops if blocked. */
function playChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.13;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* audio unavailable — ignore */
  }
}

// ─── Status pill + inline status select ─────────────────────────────────────────

function StatusPill({ status }: { status: InquiryStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-wide ${meta.pill}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function StatusSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: InquiryStatus;
  onChange: (next: InquiryStatus) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value === "archived" ? "archived" : value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as InquiryStatus)}
      onClick={(e) => e.stopPropagation()}
      className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:border-gold outline-none disabled:opacity-50 cursor-pointer"
      aria-label="Change inquiry status"
    >
      {value === "archived" && <option value="archived">Archived</option>}
      {ASSIGNABLE_STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_META[s].label}</option>
      ))}
    </select>
  );
}

// ─── Detail Drawer ───────────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-stone-800/50 last:border-b-0">
      <Icon className="size-4 text-gold/70 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500">{label}</p>
        <p className="text-sm text-stone-200 break-words">{value || <span className="text-stone-600">—</span>}</p>
      </div>
    </div>
  );
}

function DetailDrawer({
  inquiry,
  onClose,
  onStatusChange,
  onSaveNotes,
  onDelete,
  savingNotes,
}: {
  inquiry: CMSInquiry;
  onClose: () => void;
  onStatusChange: (status: InquiryStatus) => void;
  onSaveNotes: (notes: string) => Promise<void>;
  onDelete: () => void;
  savingNotes: boolean;
}) {
  const [entered, setEntered] = useState(false);
  const [notes, setNotes] = useState(inquiry.notes || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setNotes(inquiry.notes || "");
  }, [inquiry.id, inquiry.notes]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copied`, text);
    } catch {
      showError("Copy failed", "Your browser blocked clipboard access.");
    }
  };

  const notesDirty = (inquiry.notes || "") !== notes;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Inquiry from ${inquiry.name}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`relative h-full w-full max-w-md bg-nizami-dark border-l border-gold/15 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${entered ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-6 py-5 border-b border-stone-800/70 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusPill status={inquiry.status} />
              <span className="text-[10px] font-mono text-stone-500">{SOURCE_LABELS[inquiry.sourcePage] ?? inquiry.sourcePage}</span>
            </div>
            <h2 className="font-serif text-xl text-stone-100 truncate">{inquiry.name}</h2>
            <p className="text-xs text-stone-500 mt-0.5" title={absoluteTime(inquiry.createdAt)}>
              Received {relativeTime(inquiry.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-gold transition-colors shrink-0"
            aria-label="Close details"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <a href={`tel:${inquiry.phone}`} className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 text-xs font-medium hover:bg-emerald-950/60 transition-colors">
              <PhoneCall className="size-3.5" /> Call
            </a>
            <a href={`mailto:${inquiry.email}`} className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-sky-800/60 bg-sky-950/30 text-sky-300 text-xs font-medium hover:bg-sky-950/60 transition-colors">
              <Mail className="size-3.5" /> Email
            </a>
            <button type="button" onClick={() => copy(inquiry.phone, "Phone")} className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-stone-700 bg-stone-900/60 text-stone-300 text-xs font-medium hover:border-gold/40 transition-colors">
              <Copy className="size-3.5" /> Copy Phone
            </button>
            <button type="button" onClick={() => copy(inquiry.email, "Email")} className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-stone-700 bg-stone-900/60 text-stone-300 text-xs font-medium hover:border-gold/40 transition-colors">
              <Copy className="size-3.5" /> Copy Email
            </button>
          </div>

          {/* Status control */}
          <div>
            <label htmlFor="drawer-status" className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-1.5">Status</label>
            <div className="flex items-center gap-2">
              <StatusSelect id="drawer-status" value={inquiry.status} onChange={onStatusChange} />
              {inquiry.status !== "contacted" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("contacted")}
                  className="gap-1.5 text-xs border-stone-700 bg-stone-900 text-stone-300 hover:border-gold"
                >
                  <PhoneCall className="size-3.5" /> Mark Contacted
                </Button>
              )}
            </div>
          </div>

          {/* Full details */}
          <div className="rounded-xl border border-stone-800/70 bg-black/20 px-4">
            <DetailRow icon={Phone} label="Phone" value={inquiry.phone} />
            <DetailRow icon={Mail} label="Email" value={inquiry.email} />
            <DetailRow icon={Sparkles} label="Event Type" value={inquiry.eventType} />
            <DetailRow icon={Calendar} label="Wedding Date" value={formatWeddingDate(inquiry.eventDate)} />
            <DetailRow icon={Users} label="Guest Count" value={inquiry.guestCount} />
            <DetailRow icon={Wallet} label="Budget" value={inquiry.budget} />
            <DetailRow icon={MapPin} label="Location" value={inquiry.location} />
            <DetailRow icon={Building2} label="Company" value={inquiry.company} />
            <DetailRow icon={RotateCcw} label="Referral Source" value={inquiry.referralSource} />
            <DetailRow icon={Clock} label="Created At" value={absoluteTime(inquiry.createdAt)} />
          </div>

          {/* Message */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1.5">
              <MessageSquareText className="size-3.5" /> Message
            </p>
            <div className="rounded-xl border border-stone-800/70 bg-black/20 p-4 text-sm text-stone-300 leading-relaxed whitespace-pre-wrap min-h-[64px]">
              {inquiry.message || <span className="text-stone-600">No message provided.</span>}
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <label htmlFor="drawer-notes" className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1.5 block">Internal Notes (admin only)</label>
            <textarea
              id="drawer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add a private note about this lead…"
              className="w-full rounded-xl border border-stone-700 bg-black/40 p-3 text-sm text-stone-200 focus:border-gold outline-none resize-none placeholder:text-stone-600"
            />
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                size="sm"
                disabled={!notesDirty || savingNotes}
                onClick={() => onSaveNotes(notes)}
                className="gap-1.5 text-xs bg-gold text-nizami-dark hover:bg-gold-light font-semibold disabled:opacity-50"
              >
                {savingNotes ? "Saving…" : "Save Note"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer — destructive */}
        <footer className="px-6 py-4 border-t border-stone-800/70 shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 flex-1">Delete this inquiry permanently?</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="text-xs border-stone-700 bg-stone-900 text-stone-300">
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={onDelete} className="text-xs bg-red-900/80 hover:bg-red-800 text-red-100 gap-1.5">
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 text-xs text-red-400/80 hover:text-red-300 transition-colors"
            >
              <Trash2 className="size-3.5" /> Delete inquiry
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export function AdminInquiries() {
  const { currentUser } = useAuth();
  const adminEmail = currentUser?.email || "admin@alankaran.com";

  const [inquiries, setInquiries] = useState<CMSInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subKey, setSubKey] = useState(0); // bump to re-subscribe after an error

  // Filters / search / sort
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<InquirySourcePage | "all">("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
  });

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // ── Realtime subscription ──
  useEffect(() => {
    setIsLoading(true);
    initializedRef.current = false;
    knownIdsRef.current = new Set();

    const unsubscribe = inquiryService.subscribeRecent((data, error) => {
      if (error) {
        setLoadError(error.message || "Failed to load inquiries from Firestore.");
        setIsLoading(false);
        return;
      }
      setLoadError(null);

      if (initializedRef.current) {
        const fresh = data.filter((d) => !knownIdsRef.current.has(d.id));
        if (fresh.length > 0) {
          showSuccess(
            fresh.length === 1 ? "New Inquiry Received" : `${fresh.length} New Inquiries Received`,
            fresh.length === 1 ? `${fresh[0].name} · ${fresh[0].eventType}` : undefined
          );
          if (soundEnabledRef.current) playChime();
        }
      }

      knownIdsRef.current = new Set(data.map((d) => d.id));
      initializedRef.current = true;
      setInquiries(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [subKey]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(SOUND_PREF_KEY, next ? "on" : "off"); } catch { /* ignore */ }
      return next;
    });
  };

  // ── Derived filter option lists ──
  const eventTypeOptions = useMemo(
    () => Array.from(new Set(inquiries.map((i) => i.eventType).filter(Boolean))).sort(),
    [inquiries]
  );
  const budgetOptions = useMemo(
    () => Array.from(new Set(inquiries.map((i) => i.budget).filter(Boolean) as string[])).sort(),
    [inquiries]
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(inquiries.map((i) => i.sourcePage))),
    [inquiries]
  );

  // ── Summary stats (over all leads, unaffected by filters) ──
  const stats = useMemo(() => {
    const count = (s: InquiryStatus) => inquiries.filter((i) => i.status === s).length;
    return {
      new: count("new"),
      contacted: count("contacted"),
      quotationSent: count("quotation_sent"),
      converted: count("converted"),
      total: inquiries.length,
    };
  }, [inquiries]);

  // ── Filter + search + sort ──
  const filtered = useMemo(() => {
    const fromMs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toMs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;
    const q = searchQuery.trim().toLowerCase();

    const result = inquiries.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (eventTypeFilter !== "all" && i.eventType !== eventTypeFilter) return false;
      if (sourceFilter !== "all" && i.sourcePage !== sourceFilter) return false;
      if (budgetFilter !== "all" && i.budget !== budgetFilter) return false;
      if (fromMs !== null && i.createdAt < fromMs) return false;
      if (toMs !== null && i.createdAt > toMs) return false;
      if (q) {
        const haystack = [i.name, i.phone, i.email, i.location, i.eventType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...result];
    switch (sortBy) {
      case "oldest": sorted.sort((a, b) => a.createdAt - b.createdAt); break;
      case "name": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "weddingDate":
        sorted.sort((a, b) => {
          const at = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
          const bt = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
          return at - bt;
        });
        break;
      case "status":
        sorted.sort((a, b) => (STATUS_META[a.status]?.rank ?? 99) - (STATUS_META[b.status]?.rank ?? 99));
        break;
      case "newest":
      default: sorted.sort((a, b) => b.createdAt - a.createdAt); break;
    }
    return sorted;
  }, [inquiries, statusFilter, eventTypeFilter, sourceFilter, budgetFilter, dateFrom, dateTo, searchQuery, sortBy]);

  const filtersActive =
    statusFilter !== "all" || eventTypeFilter !== "all" || sourceFilter !== "all" ||
    budgetFilter !== "all" || !!dateFrom || !!dateTo || !!searchQuery.trim();

  // Reset to page 1 whenever the result set changes shape.
  useEffect(() => { setCurrentPage(1); }, [statusFilter, eventTypeFilter, sourceFilter, budgetFilter, dateFrom, dateTo, searchQuery, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const selected = useMemo(
    () => inquiries.find((i) => i.id === selectedId) || null,
    [inquiries, selectedId]
  );

  // ── Mutations ──
  const handleStatusChange = useCallback(async (id: string, status: InquiryStatus) => {
    setPendingStatusId(id);
    try {
      await inquiryService.updateStatus(id, status, adminEmail);
      showSuccess("Status updated", `Marked as ${STATUS_META[status]?.label ?? status}.`);
    } catch (err: any) {
      showError("Update failed", err?.message || "Could not update the inquiry status.");
    } finally {
      setPendingStatusId(null);
    }
  }, [adminEmail]);

  const handleSaveNotes = useCallback(async (id: string, notes: string) => {
    setSavingNotes(true);
    try {
      await inquiryService.updateNotes(id, notes, adminEmail);
      showSuccess("Note saved");
    } catch (err: any) {
      showError("Save failed", err?.message || "Could not save the note.");
    } finally {
      setSavingNotes(false);
    }
  }, [adminEmail]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await inquiryService.remove(id, adminEmail);
      setSelectedId(null);
      showSuccess("Inquiry deleted");
    } catch (err: any) {
      showError("Delete failed", err?.message || "Could not delete the inquiry.");
    }
  }, [adminEmail]);

  const handleExport = () => {
    if (filtered.length === 0) {
      showError("Nothing to export", "There are no inquiries matching the current view.");
      return;
    }
    downloadInquiriesCsv(filtered);
    showSuccess("Export ready", `${filtered.length} inquiries downloaded as CSV.`);
  };

  const clearFilters = () => {
    setSearchQuery(""); setStatusFilter("all"); setEventTypeFilter("all");
    setSourceFilter("all"); setBudgetFilter("all"); setDateFrom(""); setDateTo("");
  };

  const selectCls = "bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:border-gold outline-none";

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminBreadcrumb items={[{ label: "Inquiries", href: ROUTES.ADMIN.INQUIRIES }]} />

      <PageHeader
        title="Inquiries"
        description="Every lead submitted from the website — updated live as they arrive."
        badge="Lead Management"
      >
        <button
          type="button"
          onClick={toggleSound}
          className="inline-flex items-center gap-1.5 py-2 px-3 rounded-md border border-stone-700 bg-stone-900/60 text-xs text-stone-300 hover:border-gold/40 hover:text-gold transition-all"
          title={soundEnabled ? "Notification sound on" : "Notification sound off"}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
          <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Sound Off"}</span>
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 text-xs font-sans border-stone-700 bg-stone-900 text-stone-300 hover:border-gold"
        >
          <Download className="size-3.5" aria-hidden="true" />
          <span>Export CSV</span>
        </Button>
        <Link href={ROUTES.ADMIN.DASHBOARD}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-sans border-stone-700 bg-stone-900 text-stone-300 hover:border-gold"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard label="New Leads" value={stats.new} icon={Inbox} loading={isLoading} />
        <StatsCard label="Contacted" value={stats.contacted} icon={PhoneCall} loading={isLoading} />
        <StatsCard label="Quotation Sent" value={stats.quotationSent} icon={FileText} loading={isLoading} />
        <StatsCard label="Converted" value={stats.converted} icon={CheckCircle2} loading={isLoading} />
        <StatsCard label="Total Leads" value={stats.total} icon={Users} loading={isLoading} />
      </div>

      {/* Search + filters */}
      <div className="space-y-3 bg-black/30 border border-gold/15 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search by name, phone, email, location, or event type…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/60 border-stone-800 text-xs text-stone-200 h-9 rounded-xl focus:border-gold"
              aria-label="Search inquiries"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="size-3.5 text-gold shrink-0" aria-hidden="true" />
            <label htmlFor="sort-by" className="sr-only">Sort by</label>
            <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className={selectCls} aria-label="Sort inquiries">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A–Z)</option>
              <option value="weddingDate">Wedding Date</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="filter-status" className="sr-only">Filter by status</label>
          <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={selectCls} aria-label="Filter by status">
            <option value="all">All Statuses</option>
            {ASSIGNABLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>

          <label htmlFor="filter-event" className="sr-only">Filter by event type</label>
          <select id="filter-event" value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className={selectCls} aria-label="Filter by event type">
            <option value="all">All Event Types</option>
            {eventTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <label htmlFor="filter-source" className="sr-only">Filter by source page</label>
          <select id="filter-source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as any)} className={selectCls} aria-label="Filter by source page">
            <option value="all">All Sources</option>
            {sourceOptions.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s] ?? s}</option>)}
          </select>

          <label htmlFor="filter-budget" className="sr-only">Filter by budget</label>
          <select id="filter-budget" value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)} className={selectCls} aria-label="Filter by budget">
            <option value="all">All Budgets</option>
            {budgetOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          <div className="flex items-center gap-1.5">
            <label htmlFor="date-from" className="text-[10px] font-mono uppercase text-stone-500">From</label>
            <input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectCls} style={{ colorScheme: "dark" }} aria-label="Filter from date" />
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="date-to" className="text-[10px] font-mono uppercase text-stone-500">To</label>
            <input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectCls} style={{ colorScheme: "dark" }} aria-label="Filter to date" />
          </div>

          {filtersActive && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-[11px] text-gold/80 hover:text-gold ml-1">
              <X className="size-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] font-mono text-stone-500 -mt-4">
        {filtered.length} {filtered.length === 1 ? "lead" : "leads"} shown{filtersActive ? ` (of ${inquiries.length})` : ""}
      </p>

      {/* Content */}
      {isLoading ? (
        <PageLoader text="Connecting to Firestore inquiries…" />
      ) : loadError ? (
        <ErrorState
          type={navigator.onLine ? "firestore_unavailable" : "offline"}
          title="Inquiries Unavailable"
          description={loadError}
          onRetry={() => { setIsLoading(true); setLoadError(null); setSubKey((k) => k + 1); }}
          retryLabel="Retry"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filtersActive ? "No matching inquiries" : "No inquiries received yet"}
          description={
            filtersActive
              ? "No leads match your current search and filters. Try widening or clearing them."
              : "When a visitor submits any form on the website, their inquiry will appear here instantly — no refresh needed."
          }
          actionLabel={filtersActive ? "Clear Filters" : undefined}
          onAction={filtersActive ? clearFilters : undefined}
        />
      ) : (
        <>
          <div className="bg-black/30 border border-stone-800 rounded-2xl overflow-hidden shadow-xl" role="region" aria-label="Inquiries">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-900/80 border-b border-stone-800 text-[11px] font-mono uppercase text-gold">
                    <th className="p-3.5 whitespace-nowrap" scope="col">Status</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Name</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Phone</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Email</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Event</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Wedding Date</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Budget</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Location</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Created</th>
                    <th className="p-3.5 whitespace-nowrap" scope="col">Source</th>
                    <th className="p-3.5 whitespace-nowrap text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {paginated.map((inq) => (
                    <tr
                      key={inq.id}
                      onClick={() => setSelectedId(inq.id)}
                      className="hover:bg-stone-900/40 transition-colors text-xs font-sans cursor-pointer"
                      tabIndex={0}
                      role="button"
                      aria-label={`Open inquiry from ${inq.name}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(inq.id); } }}
                    >
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect value={inq.status} disabled={pendingStatusId === inq.id} onChange={(s) => handleStatusChange(inq.id, s)} />
                      </td>
                      <td className="p-3.5 text-stone-200 font-medium whitespace-nowrap">{inq.name}</td>
                      <td className="p-3.5 text-stone-400 font-mono whitespace-nowrap">{inq.phone}</td>
                      <td className="p-3.5 text-stone-400 max-w-[180px] truncate" title={inq.email}>{inq.email}</td>
                      <td className="p-3.5 text-stone-300 whitespace-nowrap">{inq.eventType}</td>
                      <td className="p-3.5 text-stone-400 whitespace-nowrap">{formatWeddingDate(inq.eventDate)}</td>
                      <td className="p-3.5 text-stone-400 whitespace-nowrap">{inq.budget || "—"}</td>
                      <td className="p-3.5 text-stone-400 max-w-[140px] truncate" title={inq.location}>{inq.location || "—"}</td>
                      <td className="p-3.5 text-stone-500 whitespace-nowrap" title={absoluteTime(inq.createdAt)}>{relativeTime(inq.createdAt)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800/80 text-stone-400 border border-stone-700">{SOURCE_LABELS[inq.sourcePage] ?? inq.sourcePage}</span>
                      </td>
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <a href={`tel:${inq.phone}`} className="p-1.5 rounded-md text-stone-400 hover:text-emerald-400 hover:bg-emerald-950/30 transition-colors" title="Call" aria-label={`Call ${inq.name}`}>
                            <Phone className="size-3.5" />
                          </a>
                          <a href={`mailto:${inq.email}`} className="p-1.5 rounded-md text-stone-400 hover:text-sky-400 hover:bg-sky-950/30 transition-colors" title="Email" aria-label={`Email ${inq.name}`}>
                            <Mail className="size-3.5" />
                          </a>
                          <button type="button" onClick={() => setSelectedId(inq.id)} className="p-1.5 rounded-md text-stone-400 hover:text-gold hover:bg-gold/10 transition-colors" title="View details" aria-label={`View details for ${inq.name}`}>
                            <ChevronDetail className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden divide-y divide-stone-800/50">
              {paginated.map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => setSelectedId(inq.id)}
                  className="w-full text-left p-4 space-y-2.5 hover:bg-stone-900/40 transition-colors"
                  aria-label={`Open inquiry from ${inq.name}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill status={inq.status} />
                    <span className="text-[10px] font-mono text-stone-500" title={absoluteTime(inq.createdAt)}>{relativeTime(inq.createdAt)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-100">{inq.name}</p>
                    <p className="text-xs text-stone-400">{inq.eventType}{inq.eventDate ? ` · ${formatWeddingDate(inq.eventDate)}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500 font-mono">
                    <span className="inline-flex items-center gap-1"><Phone className="size-3" />{inq.phone}</span>
                    {inq.budget && <span className="inline-flex items-center gap-1"><Wallet className="size-3" />{inq.budget}</span>}
                    {inq.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{inq.location}</span>}
                  </div>
                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:${inq.phone}`} className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-emerald-800/50 bg-emerald-950/20 text-emerald-300 text-[11px]">
                      <PhoneCall className="size-3" /> Call
                    </a>
                    <a href={`mailto:${inq.email}`} className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-sky-800/50 bg-sky-950/20 text-sky-300 text-[11px]">
                      <Mail className="size-3" /> Email
                    </a>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800/80 text-stone-400 border border-stone-700 ml-auto">{SOURCE_LABELS[inq.sourcePage] ?? inq.sourcePage}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/40 border border-stone-800 px-5 py-3 rounded-xl text-xs font-mono text-stone-400">
            <span>
              Showing <strong className="text-stone-200">{(currentPage - 1) * PAGE_SIZE + 1}</strong>–
              <strong className="text-stone-200">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> of{" "}
              <strong className="text-gold">{filtered.length}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="h-7 w-7 p-0 border-stone-700 bg-black/60 text-stone-300 disabled:opacity-30" aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <span className="px-2">Page <strong className="text-gold">{currentPage}</strong> / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="h-7 w-7 p-0 border-stone-700 bg-black/60 text-stone-300 disabled:opacity-30" aria-label="Next page">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          inquiry={selected}
          onClose={() => setSelectedId(null)}
          onStatusChange={(s) => handleStatusChange(selected.id, s)}
          onSaveNotes={(notes) => handleSaveNotes(selected.id, notes)}
          onDelete={() => handleDelete(selected.id)}
          savingNotes={savingNotes}
        />
      )}
    </div>
  );
}
