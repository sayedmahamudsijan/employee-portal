import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET() {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const emails = await prisma.allowedEmail.findMany({ orderBy: { createdAt: "desc" } });
  return apiResponse(emails);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { email, note } = await req.json();
  if (!email || typeof email !== "string") return apiError("Email required", 400);

  const normalised = email.toLowerCase().trim();
  try {
    const entry = await prisma.allowedEmail.create({
      data: { email: normalised, note: note ?? null, addedBy: session.user.id },
    });
    return Response.json({ data: entry, error: null, meta: null }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Email already in the whitelist", 409);
    return apiError("Failed to add email", 500);
  }
}
