import type { CMSInquiry } from "../types";

/**
 * Client-side CSV export for the Inquiries dashboard.
 *
 * Read-only: it serialises whatever leads the admin currently has on screen (post-filter) into a
 * spreadsheet-friendly file. No Firestore, network, or submission logic is touched. Excel opens the
 * `.csv` natively, satisfying the "CSV / Excel" export requirement without a heavy XLSX dependency.
 */

const COLUMNS: { key: keyof CMSInquiry; header: string }[] = [
  { key: "createdAt", header: "Created At" },
  { key: "status", header: "Status" },
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  { key: "eventType", header: "Event Type" },
  { key: "eventDate", header: "Wedding Date" },
  { key: "guestCount", header: "Guest Count" },
  { key: "budget", header: "Budget" },
  { key: "location", header: "Location" },
  { key: "company", header: "Company" },
  { key: "referralSource", header: "Referral Source" },
  { key: "sourcePage", header: "Source Page" },
  { key: "message", header: "Message" },
  { key: "notes", header: "Internal Notes" },
];

/** Escapes a value per RFC 4180 — wrap in quotes and double any embedded quote. */
function csvCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function formatValue(inquiry: CMSInquiry, key: keyof CMSInquiry): string {
  if (key === "createdAt") {
    return new Date(inquiry.createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  return csvCell(inquiry[key]);
}

/** Builds the CSV text for a set of inquiries. */
export function inquiriesToCsv(inquiries: CMSInquiry[]): string {
  const header = COLUMNS.map((c) => csvCell(c.header)).join(",");
  const rows = inquiries.map((inq) =>
    COLUMNS.map((c) => (c.key === "createdAt" ? csvCell(formatValue(inq, c.key)) : csvCell(inq[c.key]))).join(",")
  );
  return [header, ...rows].join("\r\n");
}

/** Triggers a browser download of the given inquiries as a timestamped CSV file. */
export function downloadInquiriesCsv(inquiries: CMSInquiry[], filenamePrefix = "alankaran-inquiries"): void {
  const csv = inquiriesToCsv(inquiries);
  // Prepend a UTF-8 BOM so Excel renders ₹ and accented names correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
