import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") ?? session.user.id;
  const quarter = searchParams.get("quarter");
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

  const where: any = { userId };
  if (quarter) where.quarter = quarter;
  if (year) where.year = year;

  const okrs = await prisma.oKR.findMany({
    where,
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
  });
  return apiResponse(okrs);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { objective, description, quarter, year, projectId, keyResults } = await req.json();
  if (!objective || !quarter || !year) return apiError("Objective, quarter and year are required");

  const okr = await prisma.oKR.create({
    data: {
      userId: session.user.id,
      objective, description: description ?? null,
      quarter, year: Number(year),
      projectId: projectId ?? null,
      keyResults: keyResults ?? [],
    },
  });
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "okr",
    entityId: okr.id,
    details: `Created OKR: ${objective}`,
  });
  return apiResponse(okr);
}
