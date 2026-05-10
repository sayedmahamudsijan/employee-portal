import { NextRequest } from "next/server";
import { getSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { generateAccessCode, hashAccessCode } from "@/lib/access-code";
import { sendResetCodeEmail } from "@/lib/email";
import { EXECUTIVE_ROLES } from "@/lib/roles";
import type { Role } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/reset-code
 * Resets a user's access code and sends them a new one via email.
 * CEO / CMO / CTO only.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.user.status !== "ACTIVE") return apiError("Forbidden", 403);

  // Only executives can reset access codes
  if (!EXECUTIVE_ROLES.includes(session.user.role as Role)) {
    return apiError("Only CEO, CMO, or CTO can reset access codes", 403);
  }

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
  const codeHash  = hashAccessCode(plainCode);

  await prisma.user.update({
    where: { id },
    data:  { accessCode: codeHash, accessCodeUsed: false },
  });

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

  return apiResponse({ message: "Access code reset and email sent." });
}
