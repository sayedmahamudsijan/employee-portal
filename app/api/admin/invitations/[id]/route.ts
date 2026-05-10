import { NextRequest } from "next/server";
import { withRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { generateAccessCode, hashAccessCode } from "@/lib/access-code";
import { sendInvitationEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/invitations/[id]
 * body: { action: "resend" | "revoke" }
 * Admin+ only.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error ?? apiError("Unauthorized", 401);

  const { id } = await params;
  const { action } = await req.json() as { action: "resend" | "revoke" };

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) return apiError("Invitation not found", 404);

  if (action === "revoke") {
    if (invitation.status !== "PENDING") {
      return apiError("Only pending invitations can be revoked", 409);
    }
    await prisma.invitation.update({
      where: { id },
      data:  { status: "REVOKED", revokedAt: new Date() },
    });
    return apiResponse({ message: "Invitation revoked." });
  }

  if (action === "resend") {
    if (invitation.status === "ACCEPTED") {
      return apiError("This invitation has already been accepted", 409);
    }
    if (invitation.status === "REVOKED") {
      return apiError("Cannot resend a revoked invitation", 409);
    }

    // Generate fresh access code
    const plainCode = generateAccessCode();
    const codeHash  = hashAccessCode(plainCode);

    // Update user's access code
    await prisma.user.updateMany({
      where: { email: invitation.email },
      data:  { accessCode: codeHash, accessCodeUsed: false },
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

    return apiResponse({ message: "Invitation resent." });
  }

  return apiError('action must be "resend" or "revoke"', 400);
}
