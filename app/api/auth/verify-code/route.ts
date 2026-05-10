import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { verifyAccessCode } from "@/lib/access-code";

/**
 * POST /api/auth/verify-code
 * Body: { employeeId: string, accessCode: string }
 *
 * Verifies the one-time access code for a freshly-invited user.
 * On success: marks accessCodeUsed = true, activates the user account.
 * The user must already be signed in with Google (session required).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("You must be signed in with Google first", 401);

  const { employeeId, accessCode } = await req.json() as {
    employeeId?: string;
    accessCode?: string;
  };

  if (!employeeId?.trim()) return apiError("Employee ID is required", 400);
  if (!accessCode?.trim()) return apiError("Access code is required", 400);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, employeeId: true, accessCode: true, accessCodeUsed: true, status: true },
  });

  if (!user) return apiError("User not found", 404);

  // Verify employee ID
  if (!user.employeeId || user.employeeId.toUpperCase() !== employeeId.toUpperCase().trim()) {
    return apiError("Invalid Employee ID or Access Code", 401);
  }

  // Already verified
  if (user.accessCodeUsed) {
    return apiResponse({ message: "Account already verified." });
  }

  // Verify access code
  if (!user.accessCode) return apiError("No access code set. Contact your administrator.", 400);

  const valid = verifyAccessCode(accessCode.trim(), user.accessCode);
  if (!valid) return apiError("Invalid Employee ID or Access Code", 401);

  // Mark verified + activate
  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessCodeUsed: true,
      status:         "ACTIVE",
    },
  });

  // Mark invitation as accepted
  await prisma.invitation.updateMany({
    where: { email: { equals: session.user.email ?? "", mode: "insensitive" }, status: "PENDING" },
    data:  { status: "ACCEPTED" },
  }).catch(() => {});

  return apiResponse({ message: "Access verified. Welcome to MBD Portal!" });
}
