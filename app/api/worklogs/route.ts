import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  const isManager = roleOrder[session.user.role] >= roleOrder["MANAGER"];

  const effectiveUserId = isManager ? userId : session.user.id;

  const worklogs = await prisma.workLog.findMany({
    where: {
      ...(effectiveUserId && { userId: effectiveUserId }),
      ...(from || to
        ? {
            date: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { date: "desc" },
  });

  return apiResponse(worklogs);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { taskId, date, hours, description } = body;

    if (!date || !hours || !description) return apiError("date, hours and description are required");
    if (hours <= 0) return apiError("hours must be positive");

    const worklog = await prisma.workLog.create({
      data: {
        userId: session.user.id,
        taskId,
        date: new Date(date),
        hours,
        description,
      },
    });

    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { loggedHrs: { increment: hours } },
      });
    }

    return apiResponse(worklog);
  } catch {
    return apiError("Failed to create worklog", 500);
  }
}
