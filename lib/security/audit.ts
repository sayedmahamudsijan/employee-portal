import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

/**
 * Centralised security audit log.
 *
 * Every security-relevant event in the portal flows through here:
 *   - Sign-ins (success + failure)
 *   - Access-code verifications (success + failure)
 *   - Invitations (sent / resent / revoked)
 *   - Role and permission changes
 *   - User activation / deactivation
 *   - Session revocations
 *   - Rate-limit hits
 *
 * All entries are append-only (no UPDATE / DELETE) and indexed for fast
 * forensic queries from the admin Security page.
 */

export type SecurityEventName =
  // Authentication
  | "SIGN_IN_SUCCESS"
  | "SIGN_IN_BLOCKED"           // email not on AllowedEmail whitelist
  | "SIGN_IN_OAUTH_ERROR"       // Google returned an error
  | "SIGN_OUT"
  // Access code (first-login verification)
  | "ACCESS_CODE_VERIFIED"
  | "ACCESS_CODE_FAILED"
  | "ACCESS_CODE_EXPIRED"
  | "ACCESS_CODE_LOCKED"
  | "ACCESS_CODE_RESET"
  // Invitations
  | "INVITATION_SENT"
  | "INVITATION_RESENT"
  | "INVITATION_REVOKED"
  | "INVITATION_ACCEPTED"
  // User lifecycle
  | "USER_CREATED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "USER_DELETED"
  | "USER_ROLE_CHANGED"
  | "USER_PERMISSION_CHANGED"
  // Sessions
  | "SESSION_REVOKED"
  | "SESSION_ALL_REVOKED"
  // Admin
  | "ADMIN_FEATURE_ACCESS_CHANGED"
  | "ADMIN_ALLOWED_EMAIL_ADDED"
  | "ADMIN_ALLOWED_EMAIL_REMOVED"
  // Rate limiting / abuse
  | "RATE_LIMIT_HIT"
  | "FORBIDDEN_ACCESS"           // user tried to hit a protected endpoint without permission
  | "UNAUTHORIZED_ACCESS";       // unauthenticated request to a protected endpoint

export interface AuditEntry {
  event:     SecurityEventName;
  userId?:   string | null;
  email?:    string | null;
  severity?: "info" | "warn" | "critical";
  ip?:       string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Write a security event. Fire-and-forget — never throws, never blocks
 * the response. If the DB write fails we log to stderr and move on
 * (we never want auditing to brick a real request).
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        event:     entry.event,
        userId:    entry.userId ?? null,
        email:     entry.email?.toLowerCase() ?? null,
        severity:  entry.severity ?? defaultSeverity(entry.event),
        ip:        entry.ip ?? null,
        userAgent: entry.userAgent?.slice(0, 256) ?? null,
        metadata:  entry.metadata ? (entry.metadata as any) : undefined,
      },
    });
  } catch (err) {
    // Last-resort fallback: log to server stderr so the event is recoverable from Vercel logs.
    console.error("[security-audit] failed to persist event", { entry, err });
  }
}

/**
 * Extract client IP and user-agent from a NextRequest in a way that works
 * across Vercel, localhost, and proxied deployments.
 */
export function reqContext(req: NextRequest): { ip: string | null; userAgent: string | null } {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  const ip  = (xff?.split(",")[0].trim()) || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent") || null;
  return { ip, userAgent };
}

function defaultSeverity(event: SecurityEventName): "info" | "warn" | "critical" {
  switch (event) {
    case "SIGN_IN_BLOCKED":
    case "ACCESS_CODE_FAILED":
    case "ACCESS_CODE_EXPIRED":
    case "RATE_LIMIT_HIT":
    case "FORBIDDEN_ACCESS":
    case "UNAUTHORIZED_ACCESS":
      return "warn";
    case "ACCESS_CODE_LOCKED":
    case "USER_DEACTIVATED":
    case "USER_DELETED":
    case "USER_ROLE_CHANGED":
    case "USER_PERMISSION_CHANGED":
    case "ADMIN_FEATURE_ACCESS_CHANGED":
    case "ADMIN_ALLOWED_EMAIL_ADDED":
    case "ADMIN_ALLOWED_EMAIL_REMOVED":
    case "SESSION_ALL_REVOKED":
      return "critical";
    default:
      return "info";
  }
}
