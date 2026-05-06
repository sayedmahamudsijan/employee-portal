import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { userId } = await params;
  if (userId !== session.user.id && !isAdmin(session.user.role)) return apiError("Forbidden", 403);
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, jobTitle: true } } },
  });
  return apiResponse(profile);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { userId } = await params;
  if (userId !== session.user.id && !isAdmin(session.user.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const data: any = {};
  for (const k of ["track", "currentLevel", "targetLevel", "developmentPlan", "achievements"]) {
    if (k in body) data[k] = body[k];
  }
  if ("targetDate" in body) data.targetDate = body.targetDate ? new Date(body.targetDate) : null;

  const profile = await prisma.careerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return apiResponse(profile);
}
