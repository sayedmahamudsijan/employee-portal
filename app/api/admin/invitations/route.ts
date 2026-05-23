import { NextRequest } from "next/server";
import { z } from "zod";
import { withFeature } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { generateAccessCode, hashAccessCode, defaultAccessCodeExpiry } from "@/lib/access-code";
import { sendInvitationEmail } from "@/lib/email";
import { generateEmployeeId } from "@/lib/employee-id";
import { audit } from "@/lib/security/audit";
import { rateLimit, POLICIES } from "@/lib/security/rate-limit";
import { parseBody, emailField, nameField, noteField, cuidField } from "@/lib/security/validate";
import { getClientIp, getUserAgent } from "@/lib/security/request-ip";
import type { Role } from "@prisma/client";

const RoleEnum = z.enum(["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"]);

const InvitationSchema = z.object({
  name:         nameField,
  email:        emailField,
  position:     noteField.max(120).optional(),
  role:         RoleEnum.default("EMPLOYEE"),
  customRoleId: cuidField.optional().nullable(),
});

/**
 * GET /api/admin/invitations
 * List all invitations, newest first.
 * Requires send_invitation feature permission.
 */
export async function GET() {
  const { error } = await withFeature("send_invitation");
  if (error) return error;

  const invitations = await prisma.invitation.findMany({
    orderBy: { sentAt: "desc" },
    include: { sentBy: { select: { name: true, email: true } } },
  });

  return apiResponse(invitations);
}

/**
 * POST /api/admin/invitations
 * Body: { name, email, position?, role?, customRoleId? }
 * Sends an invitation email with auto-generated employeeId + accessCode.
 *
 * Defences:
 *   - withFeature("send_invitation") guard
 *   - Per-sender rate limit (30 invites / hour)
 *   - Zod-validated body
 *   - Audit log on every create
 */
export async function POST(req: NextRequest) {
  const { session, error } = await withFeature("send_invitation");
  if (error || !session) return error ?? apiError("Unauthorized", 401);

  const ip        = getClientIp(req);
  const userAgent = getUserAgent(req);

  // ── 1. Validate body ──────────────────────────────────────────────────
  const parsed = await parseBody(req, InvitationSchema);
  if (!parsed.ok) return parsed.error;
  const { name, email, position, role, customRoleId } = parsed.data;

  // ── 2. Per-sender rate limit ──────────────────────────────────────────
  const rl = await rateLimit({ key: `invite-send:${session.user.id}`, ...POLICIES.inviteSend });
  if (!rl.allowed) {
    await audit({
      event: "RATE_LIMIT_HIT",
      userId: session.user.id,
      email: session.user.email,
      ip,
      userAgent,
      severity: "warn",
      metadata: { route: "POST invitations", retryAfterSeconds: rl.retryAfterSeconds },
    });
    return apiError(`Too many invitations sent. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.`, 429);
  }

  const normalEmail = email; // already lowercased by zod

  // ── 3. Duplicate checks ───────────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email: normalEmail } });
  if (existingUser && existingUser.status === "ACTIVE") {
    return apiError("A user with this email is already active on the portal.", 409);
  }

  const pendingInvite = await prisma.invitation.findFirst({
    where: { email: normalEmail, status: "PENDING" },
  });
  if (pendingInvite) {
    return apiError("A pending invitation already exists for this email. Resend or revoke it first.", 409);
  }

  // ── 4. Generate credentials ───────────────────────────────────────────
  const employeeId = await generateEmployeeId();
  const plainCode  = generateAccessCode();
  const codeHash   = await hashAccessCode(plainCode);
  const expiresAt  = defaultAccessCodeExpiry();

  // ── 5. Whitelist + audit-log the allow ────────────────────────────────
  const whitelisted = await prisma.allowedEmail.upsert({
    where:  { email: normalEmail },
    create: { email: normalEmail, note: `Invited as ${position ?? role}`, addedBy: session.user.id },
    update: {},
  });
  if (whitelisted.createdAt.getTime() >= Date.now() - 5000) {
    await audit({
      event:  "ADMIN_ALLOWED_EMAIL_ADDED",
      userId: session.user.id,
      email:  session.user.email,
      ip,
      userAgent,
      metadata: { allowedEmail: normalEmail },
    });
  }

  // ── 6. Create / update user (PENDING) ─────────────────────────────────
  if (existingUser) {
    await prisma.user.update({
      where: { email: normalEmail },
      data: {
        name,
        employeeId,
        role:                  role as Role,
        jobTitle:              position ?? null,
        customRoleId:          customRoleId ?? null,
        accessCode:            codeHash,
        accessCodeUsed:        false,
        accessCodeExpiresAt:   expiresAt,
        accessCodeAttempts:    0,
        accessCodeLockedUntil: null,
        invitedBy:             session.user.id,
        invitedAt:             new Date(),
      },
    });
  } else {
    const newUser = await prisma.user.create({
      data: {
        name,
        email:                 normalEmail,
        employeeId,
        role:                  role as Role,
        jobTitle:              position ?? null,
        customRoleId:          customRoleId ?? null,
        status:                "PENDING",
        accessCode:            codeHash,
        accessCodeUsed:        false,
        accessCodeExpiresAt:   expiresAt,
        invitedBy:             session.user.id,
        invitedAt:             new Date(),
      },
      select: { id: true },
    });
    await prisma.leaveBalance.create({
      data: {
        userId: newUser.id,
        casual: 12, sick: 10, annual: 15,
        year: new Date().getFullYear(),
      },
    }).catch(() => {});
  }

  // ── 7. Log invitation record ──────────────────────────────────────────
  await prisma.invitation.create({
    data: {
      name,
      email:        normalEmail,
      position:     position ?? null,
      role:         role as Role,
      customRoleId: customRoleId ?? null,
      employeeId,
      sentById:     session.user.id,
    },
  });

  // ── 8. Audit ──────────────────────────────────────────────────────────
  await audit({
    event:  "INVITATION_SENT",
    userId: session.user.id,
    email:  session.user.email,
    ip,
    userAgent,
    metadata: {
      invitedEmail: normalEmail,
      employeeId,
      role,
      expiresAt:    expiresAt.toISOString(),
    },
  });

  // ── 9. Send email (non-fatal if it fails) ─────────────────────────────
  try {
    await sendInvitationEmail({
      toEmail:    normalEmail,
      toName:     name,
      position:   position ?? role,
      employeeId,
      accessCode: plainCode,
      sentByName: session.user.name ?? "Admin",
    });
  } catch (emailErr) {
    console.error("Failed to send invitation email:", emailErr);
    return apiResponse({ message: "Invitation created but email delivery failed. Please resend.", employeeId }, { emailFailed: true });
  }

  return apiResponse({ message: "Invitation sent successfully.", employeeId });
}
