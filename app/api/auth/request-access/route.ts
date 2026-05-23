import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { audit } from "@/lib/security/audit";
import { rateLimit, POLICIES } from "@/lib/security/rate-limit";
import { parseBody, emailField, nameField, noteField } from "@/lib/security/validate";
import { getClientIp, getUserAgent } from "@/lib/security/request-ip";

const RequestSchema = z.object({
  name:       nameField,
  email:      emailField,
  department: noteField.max(120).optional().nullable(),
  reason:     noteField.optional().nullable(),
});

/**
 * POST /api/auth/request-access
 * Public endpoint — no authentication required.
 *
 * Defences for an internet-exposed form:
 *   - Per-IP rate limit (5 / hour, then locked 1 hour)
 *   - Zod validation (length caps, control-char filter, email format)
 *   - Idempotency: returns 409 on duplicate PENDING request
 *   - Audit log entry for both success and rate-limit hits
 */
export async function POST(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = getUserAgent(req);

  // ── 1. Rate limit per IP ───────────────────────────────────────────────
  const rl = await rateLimit({ key: `access-request:${ip}`, ...POLICIES.accessRequest });
  if (!rl.allowed) {
    await audit({
      event: "RATE_LIMIT_HIT",
      ip,
      userAgent,
      severity: "warn",
      metadata: { route: "request-access", retryAfterSeconds: rl.retryAfterSeconds },
    });
    return apiError(`Too many requests. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.`, 429);
  }

  // ── 2. Validate body ───────────────────────────────────────────────────
  const parsed = await parseBody(req, RequestSchema);
  if (!parsed.ok) return parsed.error;
  const { name, email, department, reason } = parsed.data;

  try {
    const existing = await prisma.accessRequest.findFirst({
      where: { email, status: "PENDING" },
    });
    if (existing) {
      return apiError("A request for this email is already pending review.", 409);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { status: true },
    });
    if (existingUser?.status === "ACTIVE") {
      return apiError("This email already has an active account. Please sign in.", 409);
    }

    const request = await prisma.accessRequest.create({
      data: {
        name,
        email,
        department: department ?? null,
        reason:     reason     ?? null,
      },
    });

    await audit({
      event: "USER_CREATED",      // (re-use catch-all for self-service request creation; reviewed in admin UI)
      email,
      ip,
      userAgent,
      metadata: { kind: "access-request", requestId: request.id, department: department ?? null },
    });

    return Response.json({ data: request, error: null, meta: null }, { status: 201 });
  } catch {
    return apiError("Failed to submit request. Please try again.", 500);
  }
}
