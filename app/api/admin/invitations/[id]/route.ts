import { NextRequest } from "next/server";
import { z } from "zod";
import { withFeature } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { generateAccessCode, hashAccessCode, defaultAccessCodeExpiry } from "@/lib/access-code";
import { sendInvitationEmail } from "@/lib/email";
import { audit } from "@/lib/security/audit";
import { rateLimit, POLICIES } from "@/lib/security/rate-limit";
import { parseBody } from "@/lib/security/validate";
import { getClientIp, getUserAgent } from "@/lib/security/request-ip";

type Params = { params: Promise<{ id: string }> };

const ActionSchema = z.object({
  action: z.enum(["resend", "revoke"]),
});

/**
 * PATCH /api/admin/invitations/[id]
 * body: { action: "resend" | "revoke" }
 * Requires send_invitation feature permission.
 *
 * On resend:  generates a new access code, persists fresh expiry,
 *             resets attempt counter, increments resendCount, re-emails.
 * On revoke:  marks invitation REVOKED + invalidates the user's session.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await withFeature("send_invitation");
  if (error || !session) return error ?? apiError("Unauthorized", 401);

  const ip        = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { id } = await params;
  const parsed = await parseBody(req, ActionSchema);
  if (!parsed.ok) return parsed.error;
  const { action } = parsed.data;

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) return apiError("Invitation not found", 404);

  // ── REVOKE ────────────────────────────────────────────────────────────
  if (action === "revoke") {
    if (invitation.status !== "PENDING") {
      return apiError("Only pending invitations can be revoked", 409);
    }
    await prisma.invitation.update({
      where: { id },
      data:  { status: "REVOKED", revokedAt: new Date() },
    });
    // Invalidate the invited user's stored access code (in case they're mid-flight)
    await prisma.user.updateMany({
      where: { email: invitation.email, accessCodeUsed: false },
      data:  {
        accessCode:            null,
        accessCodeExpiresAt:   null,
        accessCodeAttempts:    0,
        accessCodeLockedUntil: null,
        sessionsValidFrom:     new Date(),
      },
    });
    await audit({
      event:    "INVITATION_REVOKED",
      userId:   session.user.id,
      email:    session.user.email,
      ip,
      userAgent,
      severity: "warn",
      metadata: { invitationId: id, revokedEmail: invitation.email },
    });
    return apiResponse({ message: "Invitation revoked." });
  }

  // ── RESEND ────────────────────────────────────────────────────────────
  if (invitation.status === "ACCEPTED") {
    return apiError("This invitation has already been accepted", 409);
  }
  if (invitation.status === "REVOKED") {
    return apiError("Cannot resend a revoked invitation", 409);
  }

  // Per-sender resend rate limit (uses the same bucket as create)
  const rl = await rateLimit({ key: `invite-send:${session.user.id}`, ...POLICIES.inviteSend });
  if (!rl.allowed) {
    return apiError(`Too many invitations sent. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.`, 429);
  }

  const plainCode = generateAccessCode();
  const codeHash  = await hashAccessCode(plainCode);
  const expiresAt = defaultAccessCodeExpiry();

  await prisma.user.updateMany({
    where: { email: invitation.email },
    data: {
      accessCode:            codeHash,
      accessCodeUsed:        false,
      accessCodeExpiresAt:   expiresAt,
      accessCodeAttempts:    0,
      accessCodeLockedUntil: null,
    },
  });

  await prisma.invitation.update({
    where: { id },
    data:  { resendCount: { increment: 1 } },
  });

  try {
    await sendInvitationEmail({
      toEmail:    invitation.email,
      toName:     invitation.name,
      position:   invitation.position ?? invitation.role,
      employeeId: invitation.employeeId,
      accessCode: plainCode,
      sentByName: session.user.name ?? "Admin",
    });
  } catch (emailErr) {
    console.error("Failed to resend invitation email:", emailErr);
    return apiError("Failed to send email. Please try again.", 502);
  }

  await audit({
    event:  "INVITATION_RESENT",
    userId: session.user.id,
    email:  session.user.email,
    ip,
    userAgent,
    metadata: {
      invitationId: id,
      invitedEmail: invitation.email,
      expiresAt:    expiresAt.toISOString(),
    },
  });

  return apiResponse({ message: "Invitation resent." });
}
