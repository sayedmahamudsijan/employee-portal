import { NextRequest } from "next/server";
import { withRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { generateAccessCode, hashAccessCode } from "@/lib/access-code";
import { sendInvitationEmail } from "@/lib/email";
import { generateEmployeeId } from "@/lib/employee-id";
import type { Role } from "@prisma/client";

/**
 * GET /api/admin/invitations
 * List all invitations, newest first. Admin+ only.
 */
export async function GET() {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const invitations = await prisma.invitation.findMany({
    orderBy: { sentAt: "desc" },
    include: { sentBy: { select: { name: true, email: true } } },
  });

  return apiResponse(invitations);
}

/**
 * POST /api/admin/invitations
 * Body: { name, email, position, role, customRoleId? }
 * Sends an invitation email with auto-generated employeeId + accessCode.
 * Admin+ only.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error ?? apiError("Unauthorized", 401);

  const body = await req.json();
  const { name, email, position, role = "EMPLOYEE", customRoleId } = body as {
    name: string;
    email: string;
    position?: string;
    role?: Role;
    customRoleId?: string;
  };

  if (!name?.trim())  return apiError("Name is required", 400);
  if (!email?.trim()) return apiError("Email is required", 400);
  if (!email.includes("@")) return apiError("Invalid email", 400);

  const normalEmail = email.toLowerCase().trim();

  // Check for existing active user
  const existingUser = await prisma.user.findUnique({ where: { email: normalEmail } });
  if (existingUser && existingUser.status === "ACTIVE") {
    return apiError("A user with this email is already active on the portal.", 409);
  }

  // Check for existing pending invitation
  const pendingInvite = await prisma.invitation.findFirst({
    where: { email: normalEmail, status: "PENDING" },
  });
  if (pendingInvite) {
    return apiError("A pending invitation already exists for this email. Resend or revoke it first.", 409);
  }

  // Generate credentials
  const employeeId = await generateEmployeeId();
  const plainCode  = generateAccessCode();
  const codeHash   = hashAccessCode(plainCode);

  // Upsert AllowedEmail (whitelist)
  await prisma.allowedEmail.upsert({
    where:  { email: normalEmail },
    create: { email: normalEmail, note: `Invited as ${position ?? role}`, addedBy: session.user.id },
    update: {},
  });

  // Create or update User record (PENDING)
  if (existingUser) {
    // existing PENDING user — update with invitation fields
    await prisma.user.update({
      where: { email: normalEmail },
      data: {
        name,
        employeeId,
        role:          role as Role,
        jobTitle:      position ?? null,
        customRoleId:  customRoleId ?? null,
        accessCode:    codeHash,
        accessCodeUsed: false,
        invitedBy:     session.user.id,
        invitedAt:     new Date(),
      },
    });
  } else {
    // create new PENDING user
    await prisma.user.create({
      data: {
        name,
        email:         normalEmail,
        employeeId,
        role:          role as Role,
        jobTitle:      position ?? null,
        customRoleId:  customRoleId ?? null,
        status:        "PENDING",
        accessCode:    codeHash,
        accessCodeUsed: false,
        invitedBy:     session.user.id,
        invitedAt:     new Date(),
      },
    });
    // Create leave balance
    await prisma.leaveBalance.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email: normalEmail }, select: { id: true } }))!.id,
        casual: 12, sick: 10, annual: 15,
        year: new Date().getFullYear(),
      },
    }).catch(() => {}); // ignore if already exists
  }

  // Log invitation record
  await prisma.invitation.create({
    data: {
      name,
      email:       normalEmail,
      position:    position ?? null,
      role:        role as Role,
      customRoleId: customRoleId ?? null,
      employeeId,
      sentById:    session.user.id,
    },
  });

  // Send email
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
    // Don't fail the whole request — the record is created, admin can resend
    return apiResponse({ message: "Invitation created but email delivery failed. Please resend.", employeeId }, { emailFailed: true });
  }

  return apiResponse({ message: "Invitation sent successfully.", employeeId });
}
