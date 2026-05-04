import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;

  const sprints = await prisma.sprint.findMany({
    where: { ...(status && { status: status as any }) },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { tasks: true } } },
  });

  return apiResponse(sprints);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { name, startDate, endDate, teamId } = body;

    if (!name || !startDate || !endDate) return apiError("name, startDate and endDate are required");

    const sprint = await prisma.sprint.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate), teamId },
    });

    return apiResponse(sprint);
  } catch {
    return apiError("Failed to create sprint", 500);
  }
}
