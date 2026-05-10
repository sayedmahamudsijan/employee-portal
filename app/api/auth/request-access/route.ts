import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * POST /api/auth/request-access
 * Public endpoint — no authentication required.
 * Creates a new AccessRequest record for admin review.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, department, reason } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return apiError("Name is required", 400);
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return apiError("Valid email is required", 400);
    }

    const normalisedEmail = email.toLowerCase().trim();

    // Check if this email already has a pending request
    const existing = await prisma.accessRequest.findFirst({
      where: { email: normalisedEmail, status: "PENDING" },
    });
    if (existing) {
      return apiError("A request for this email is already pending review.", 409);
    }

    // Check if email is already approved / active user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalisedEmail },
      select: { status: true },
    });
    if (existingUser?.status === "ACTIVE") {
      return apiError("This email already has an active account. Please sign in.", 409);
    }

    const request = await prisma.accessRequest.create({
      data: {
        name:       name.trim(),
        email:      normalisedEmail,
        department: department?.trim() || null,
        reason:     reason?.trim()     || null,
      },
    });

    return Response.json({ data: request, error: null, meta: null }, { status: 201 });
  } catch {
    return apiError("Failed to submit request. Please try again.", 500);
  }
}
