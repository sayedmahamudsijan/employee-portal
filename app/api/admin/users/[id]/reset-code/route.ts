import { NextRequest } from "next/server";
import { getSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { generateAccessCode, hashAccessCode, defaultAccessCodeExpiry } from "@/lib/access-code";
import { sendResetCodeEmail } from "@/lib/email";
import { EXECUTIVE_ROLES } from "@/lib/roles";
import { audit } from "@/lib/security/audit";
import { getClientIp, getUserAgent } from "@/lib/security/request-ip";
import type { Role } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/reset-code
 * Resets a user's access code and emails them a fresh one.
 * CEO / CMO / CTO only.
 *
 * Side effects:
 *   - New code with fresh expiry
 *   - Attempt counter & lockout cleared
 *   - sessionsValidFrom set so any existing session is invalidated (forces re-login)
 *   - Audited as ACCESS_CODE_RESET + SESSION_ALL_REVOKED
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.user.status !== "ACTIVE") return apiError("Forbidden", 403);

  if (!EXECUTIVE_ROLES.includes(session.user.role as Role)) {
    await audit({
      event:    "FORBIDDEN_ACCESS",
      userId:   session.user.id,
      email:    session.user.email,
      metadata: { route: "reset-code", userRole: session.user.role },
    });
    return apiError("Only CEO, CMO, or CTO can reset access codes", 403);
  }

  const ip        = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, employeeId: true, status: true },
  });
  if (!user) return apiError("User not found", 404);
  if (user.status !== "ACTIVE" && user.status !== "PENDING") {
    return apiError("Cannot reset code for an inactive account", 400);
  }
  if (!user.employeeId) {
    return apiError("User does not have an employee ID (not yet invited)", 400);
  }

  const plainCode = generateAccessCode();
  const codeHash  = await hashAccessCode(plainCode);
  const expiresAt = defaultAccessCodeExpiry();
  const now       = new Date();

  await prisma.user.update({
    where: { id },
    data: {
      accessCode:            codeHash,
      accessCodeUsed:        false,
      accessCodeExpiresAt:   expiresAt,
      accessCodeAttempts:    0,
      accessCodeLockedUntil: null,
      sessionsValidFrom:     now, // force re-login on next request
    },
  });

  // Also delete any existing session rows so the user is kicked out immediately.
  await prisma.session.deleteMany({ where: { userId: id } }).catch(() => {});

  try {
    await sendResetCodeEmail({
      toEmail:     user.email,
      toName:      user.name,
      employeeId:  user.employeeId,
      accessCode:  plainCode,
      resetByName: session.user.name ?? "Admin",
    });
  } catch (emailErr) {
    console.error("Failed to send reset code email:", emailErr);
    return apiError("Code was reset but email delivery failed. The user must contact you to receive their new code.", 502);
  }

  await audit({
    event:    "ACCESS_CODE_RESET",
    userId:   session.user.id,
    email:    session.user.email,
    ip,
    userAgent,
    severity: "critical",
    metadata: { targetUserId: id, targetEmail: user.email, expiresAt: expiresAt.toISOString() },
  });
  await audit({
    event:    "SESSION_ALL_REVOKED",
    userId:   session.user.id,
    email:    session.user.email,
    ip,
    userAgent,
    severity: "critical",
    metadata: { targetUserId: id, reason: "access_code_reset" },
  });

  return apiResponse({ message: "Access code reset and email sent." });
}
