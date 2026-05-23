import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { verifyAccessCode, hashAccessCode, isLegacyHash } from "@/lib/access-code";
import { audit } from "@/lib/security/audit";
import { rateLimit, resetRateLimit, POLICIES } from "@/lib/security/rate-limit";
import { parseBody, accessCodeField, employeeIdField } from "@/lib/security/validate";
import { getClientIp, getUserAgent } from "@/lib/security/request-ip";

/**
 * POST /api/auth/verify-code
 * Body: { employeeId: string, accessCode: string }
 *
 * Verifies the one-time access code for a freshly-invited user.
 *
 * Defences in depth:
 *   1. Must be signed in with Google (session required)
 *   2. Per-user rate limit: 5 attempts / 15 min, then 30-min lockout
 *   3. Per-user attempt counter persisted on User row (survives serverless cold starts)
 *   4. Constant-time hash comparison
 *   5. Access-code expiry honoured
 *   6. Every attempt + outcome written to SecurityEvent
 *   7. Legacy SHA-256 hashes auto-upgraded to bcrypt on successful verify
 *
 * On success: marks accessCodeUsed = true, activates the user account,
 * resets attempt counter, accepts the invitation.
 */

const BodySchema = z.object({
  employeeId: employeeIdField,
  accessCode: accessCodeField,
});

const MAX_PERSISTENT_ATTEMPTS = 5;
const LOCKOUT_MS              = 30 * 60 * 1000; // 30 minutes

export async function POST(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = getUserAgent(req);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    await audit({ event: "UNAUTHORIZED_ACCESS", ip, userAgent, metadata: { route: "verify-code" } });
    return apiError("You must be signed in with Google first", 401);
  }

  // ── 1. Validate body with zod ──────────────────────────────────────────
  const parsed = await parseBody(req, BodySchema);
  if (!parsed.ok) return parsed.error;
  const { employeeId, accessCode } = parsed.data;

  // ── 2. Per-user IP-coupled rate limit ──────────────────────────────────
  const rlKey = `verify-code:${session.user.id}`;
  const rl    = await rateLimit({ key: rlKey, ...POLICIES.verifyCode });
  if (!rl.allowed) {
    await audit({
      event:    rl.locked ? "ACCESS_CODE_LOCKED" : "RATE_LIMIT_HIT",
      userId:   session.user.id,
      email:    session.user.email,
      ip,
      userAgent,
      severity: "critical",
      metadata: { retryAfterSeconds: rl.retryAfterSeconds, route: "verify-code" },
    });
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // ── 3. Load user row ───────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id:                    true,
      email:                 true,
      employeeId:            true,
      accessCode:            true,
      accessCodeUsed:        true,
      accessCodeExpiresAt:   true,
      accessCodeLockedUntil: true,
      accessCodeAttempts:    true,
      status:                true,
    },
  });
  if (!user) return apiError("User not found", 404);

  // ── 4. Persistent lockout (survives token rotation / cache cold starts) ─
  if (user.accessCodeLockedUntil && user.accessCodeLockedUntil > new Date()) {
    const mins = Math.ceil((user.accessCodeLockedUntil.getTime() - Date.now()) / 60_000);
    await audit({
      event:    "ACCESS_CODE_LOCKED",
      userId:   user.id,
      email:    user.email,
      ip,
      userAgent,
      severity: "critical",
      metadata: { reason: "persistent_lockout", minutesRemaining: mins },
    });
    return NextResponse.json(
      { error: `Account verification temporarily locked. Try again in ${mins} minutes.` },
      { status: 429 },
    );
  }

  // ── 5. Already-verified short-circuit ──────────────────────────────────
  if (user.accessCodeUsed) {
    return apiResponse({ message: "Account already verified." });
  }

  // ── 6. No stored code ──────────────────────────────────────────────────
  if (!user.accessCode) {
    return apiError("No access code set. Contact your administrator.", 400);
  }

  // ── 7. Expiry check ────────────────────────────────────────────────────
  if (user.accessCodeExpiresAt && user.accessCodeExpiresAt < new Date()) {
    await audit({
      event:    "ACCESS_CODE_EXPIRED",
      userId:   user.id,
      email:    user.email,
      ip,
      userAgent,
      severity: "warn",
    });
    return apiError("This access code has expired. Ask your administrator to resend the invitation.", 410);
  }

  // ── 8. Employee ID match (case-insensitive) ────────────────────────────
  if (!user.employeeId || user.employeeId.toUpperCase() !== employeeId.toUpperCase()) {
    await recordFailedAttempt(user.id, user.email, user.accessCodeAttempts, ip, userAgent, "employee_id_mismatch");
    return apiError("Invalid Employee ID or Access Code", 401);
  }

  // ── 9. Constant-time access-code comparison ────────────────────────────
  const valid = await verifyAccessCode(accessCode, user.accessCode);
  if (!valid) {
    await recordFailedAttempt(user.id, user.email, user.accessCodeAttempts, ip, userAgent, "code_mismatch");
    return apiError("Invalid Employee ID or Access Code", 401);
  }

  // ── 10. Success: activate, reset counters, accept invitation ───────────
  // Auto-upgrade legacy SHA-256 hashes to bcrypt while we have the plain code.
  const upgradedHash = isLegacyHash(user.accessCode) ? await hashAccessCode(accessCode) : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessCodeUsed:        true,
      status:                "ACTIVE",
      accessCodeAttempts:    0,
      accessCodeLockedUntil: null,
      ...(upgradedHash ? { accessCode: upgradedHash } : {}),
    },
  });

  await prisma.invitation.updateMany({
    where: { email: { equals: user.email, mode: "insensitive" }, status: "PENDING" },
    data:  { status: "ACCEPTED" },
  }).catch(() => {});

  await resetRateLimit(rlKey);

  await audit({
    event:  "ACCESS_CODE_VERIFIED",
    userId: user.id,
    email:  user.email,
    ip,
    userAgent,
    metadata: { upgradedHash: !!upgradedHash },
  });
  await audit({
    event:  "INVITATION_ACCEPTED",
    userId: user.id,
    email:  user.email,
    ip,
    userAgent,
  });

  return apiResponse({ message: "Access verified. Welcome to MBD Portal!" });
}

/**
 * Persist a failed-attempt counter on the User row. If we hit the threshold,
 * set a hard lockout window and zero the counter.
 */
async function recordFailedAttempt(
  userId:     string,
  email:      string | null,
  prevCount:  number,
  ip:         string | null,
  userAgent:  string | null,
  reason:     string,
): Promise<void> {
  const next = prevCount + 1;
  if (next >= MAX_PERSISTENT_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessCodeAttempts:    0,
        accessCodeLockedUntil: new Date(Date.now() + LOCKOUT_MS),
      },
    });
    await audit({
      event:    "ACCESS_CODE_LOCKED",
      userId,
      email,
      ip,
      userAgent,
      severity: "critical",
      metadata: { trigger: "max_attempts_exceeded", lockoutMs: LOCKOUT_MS },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { accessCodeAttempts: next },
  });
  await audit({
    event:    "ACCESS_CODE_FAILED",
    userId,
    email,
    ip,
    userAgent,
    severity: "warn",
    metadata: { attempt: next, reason },
  });
}
