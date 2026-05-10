import { NextRequest } from "next/server";
import { withRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * PATCH /api/admin/access-requests/[id]
 * Body: { action: "approve" | "reject", note?: string }
 *
 * Approve  → adds email to AllowedEmail whitelist + auto-activates
 *            any existing PENDING user with that email.
 * Reject   → updates status to REJECTED with optional note.
 *
 * Admin-only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error ?? apiError("Unauthorized", 401);

  const { id } = await params;
  const { action, note } = await req.json();

  if (action !== "approve" && action !== "reject") {
    return apiError('action must be "approve" or "reject"', 400);
  }

  const request = await prisma.accessRequest.findUnique({ where: { id } });
  if (!request) return apiError("Request not found", 404);
  if (request.status !== "PENDING") {
    return apiError("Request has already been reviewed", 409);
  }

  if (action === "approve") {
    // Add to AllowedEmail (ignore if already there)
    await prisma.allowedEmail.upsert({
      where:  { email: request.email },
      create: { email: request.email, note: `Auto-approved from access request: ${request.name}`, addedBy: session.user.id },
      update: {},
    });

    // Auto-activate any PENDING user with this email
    await prisma.user.updateMany({
      where: { email: request.email, status: "PENDING" },
      data:  { status: "ACTIVE" },
    });

    await prisma.accessRequest.update({
      where: { id },
      data: {
        status:     "APPROVED",
        reviewedBy: session.user.id,
        reviewNote: note?.trim() || null,
        reviewedAt: new Date(),
      },
    });

    return apiResponse({ message: "Request approved and email whitelisted." });
  }

  // Reject
  await prisma.accessRequest.update({
    where: { id },
    data: {
      status:     "REJECTED",
      reviewedBy: session.user.id,
      reviewNote: note?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  return apiResponse({ message: "Request rejected." });
}
