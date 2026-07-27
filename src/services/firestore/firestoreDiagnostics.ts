// NOTE: deliberately does NOT import `@/lib/firebase`'s `auth`.
//
// That module calls `getAuth(app)` at module scope, so merely importing it boots Firebase Auth —
// which fetches `firebaseapp.com/__/auth/iframe.js` (93 KB), `apis.google.com` gapi (41 KB) and an
// `identitytoolkit/getProjectConfig` round trip. Because `firestore.service` imports this file, and
// `SiteContentProvider` lazy-imports that service, every anonymous visitor to a public marketing
// page was booting the entire auth stack purely so this module could log a UID.
//
// Lighthouse measured that chain as the LONGEST critical request chain on `/`
// (`network-dependency-tree-insight`: document → iframe.js @2,755 ms → getProjectConfig @3,909 ms).
//
// The identity is now pushed in by `AuthProvider` when it exists. Public pages have no provider, so
// this correctly reports "anonymous" — which is exactly what the security rules see for them.
import { firebaseConfig } from "@/config/firebase";
import type { FirestoreDocumentPath } from "./firestorePaths";

/**
 * Write-pipeline instrumentation.
 *
 * Every Firestore operation is traced with the four facts needed to tell apart the failure modes
 * that all present identically as "no data appears in Firestore":
 *
 *   1. the resolved document path   -> catches wrong/misbuilt collection paths
 *   2. the payload                  -> proves the write was actually executed, and with what
 *   3. the authenticated UID        -> catches a missing/expired auth session (rules see request.auth == null)
 *   4. the raw Firestore error code -> distinguishes permission-denied (rules) from unavailable (network)
 *
 * The project id is included on failures because a valid-looking config pointed at the wrong Firebase
 * project fails exactly like a rules rejection.
 *
 * Tracing is DEV-only by default so production consoles stay clean and payloads are never logged for
 * real users. Set `VITE_FIRESTORE_TRACE=true` to force it on in a built environment while debugging.
 */
const TRACE_ENABLED =
  import.meta.env.DEV || String(import.meta.env.VITE_FIRESTORE_TRACE) === "true";

export type FirestoreOp = "save" | "update" | "get" | "delete" | "list" | "subscribe" | "transaction" | "batch";

/** Preserves the raw Firestore error code, which the friendly-message layer would otherwise discard. */
export class FirestoreOperationError extends Error {
  public readonly code: string;
  public readonly op: FirestoreOp;
  public readonly path: string;

  constructor(message: string, code: string, op: FirestoreOp, path: string) {
    super(message);
    this.name = "FirestoreOperationError";
    this.code = code;
    this.op = op;
    this.path = path;
  }
}

/** Renders a `FirestoreDocumentPath` (or bare collection name) as the path Firestore actually receives. */
export function formatPath(target: FirestoreDocumentPath | string): string {
  return typeof target === "string" ? `${target}/*` : `${target.collection}/${target.docId}`;
}

/**
 * Identity for diagnostics, pushed in by `AuthProvider`. Null until an auth stack actually exists,
 * which on public routes is never — see the import note above.
 */
let diagnosticsUser: { uid: string; email: string | null } | null = null;

/** Called by `AuthProvider` on every auth state change. No-op on public routes. */
export function setDiagnosticsUser(user: { uid: string; email: string | null } | null): void {
  diagnosticsUser = user;
}

/** Current auth identity as the security rules see it. */
export function getAuthContext(): { uid: string | null; email: string | null; signedIn: boolean } {
  return {
    uid: diagnosticsUser?.uid ?? null,
    email: diagnosticsUser?.email ?? null,
    signedIn: Boolean(diagnosticsUser),
  };
}

/** Extracts the raw Firestore error code (`permission-denied`, `unavailable`, …). */
export function extractCode(error: any): string {
  return String(error?.code || error?.name || error?.message || "unknown");
}

/** Logs an outgoing operation before it hits the network. */
export function traceAttempt(
  op: FirestoreOp,
  target: FirestoreDocumentPath | string,
  payload?: unknown
): void {
  if (!TRACE_ENABLED) return;

  const { uid, email, signedIn } = getAuthContext();
  console.groupCollapsed(
    `%c[Firestore ${op}]%c ${formatPath(target)} %c${signedIn ? `uid=${uid}` : "UNAUTHENTICATED"}`,
    "color:#7dd3fc;font-weight:bold",
    "color:inherit",
    signedIn ? "color:#4ade80" : "color:#f87171;font-weight:bold"
  );
  console.log("path    :", formatPath(target));
  console.log("uid     :", uid ?? "(none — security rules will evaluate request.auth as null)");
  console.log("email   :", email ?? "(none)");
  if (payload !== undefined) console.log("payload :", payload);
  console.groupEnd();
}

/** Logs a successful operation. */
export function traceSuccess(op: FirestoreOp, target: FirestoreDocumentPath | string): void {
  if (!TRACE_ENABLED) return;
  console.log(
    `%c[Firestore ${op}] OK%c ${formatPath(target)}`,
    "color:#4ade80;font-weight:bold",
    "color:inherit"
  );
}

/**
 * Logs a failed operation with the diagnosis attached, then returns the raw code so the caller can
 * wrap it in a `FirestoreOperationError`.
 */
export function traceFailure(
  op: FirestoreOp,
  target: FirestoreDocumentPath | string,
  error: any
): string {
  const code = extractCode(error);
  if (!TRACE_ENABLED) return code;

  const { uid, signedIn } = getAuthContext();

  console.group(
    `%c[Firestore ${op}] FAILED%c ${formatPath(target)} — ${code}`,
    "color:#f87171;font-weight:bold",
    "color:inherit"
  );
  console.log("path      :", formatPath(target));
  console.log("uid       :", uid ?? "(none)");
  console.log("project   :", firebaseConfig.projectId);
  console.log("raw error :", error);

  if (code.includes("permission-denied")) {
    console.warn(
      signedIn
        ? `Diagnosis: signed in as ${uid}, so the request carried an identity and Firestore still refused it.\n` +
            `This means the rules DEPLOYED to project "${firebaseConfig.projectId}" do not match ./firestore.rules.\n` +
            `Editing the local rules file has no effect until it is deployed:\n` +
            `    firebase deploy --only firestore:rules`
        : `Diagnosis: NO authenticated user. Rules evaluate request.auth as null and every CMS ` +
            `collection requires isSignedIn(). Sign in at /admin/login, or wait for onAuthStateChanged ` +
            `to resolve before writing.`
    );
  } else if (code.includes("not-found") || code.includes("NOT_FOUND")) {
    console.warn(
      `Diagnosis: project "${firebaseConfig.projectId}" may have no Firestore database provisioned, ` +
        `or VITE_FIREBASE_PROJECT_ID points at the wrong project.`
    );
  } else if (code.includes("unavailable") || code.includes("offline")) {
    console.warn("Diagnosis: network/transport failure — the write never reached Firestore.");
  }

  console.groupEnd();
  return code;
}

/** One-time startup banner making the effective Firebase target explicit. */
export function traceConfig(): void {
  if (!TRACE_ENABLED) return;
  console.log(
    `%c[Firestore] project=${firebaseConfig.projectId} authDomain=${firebaseConfig.authDomain}` +
      (firebaseConfig.isPlaceholder ? " (PLACEHOLDER CREDENTIALS)" : ""),
    firebaseConfig.isPlaceholder ? "color:#f87171;font-weight:bold" : "color:#7dd3fc"
  );
}
