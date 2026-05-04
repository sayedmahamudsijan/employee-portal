import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ROLE_LEVEL } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const userId     = searchParams.get("userId")     ?? undefined;
  const department = searchParams.get("department") ?? undefined;
  const from       = searchParams.get("from")       ?? undefined;
  const to         = searchParams.get("to")         ?? undefined;
  const period     = searchParams.get("period")     ?? undefined; // day|week|month|year

  const isManager = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL["MANAGER"];
  const effectiveUserId = isManager ? userId : session.user.id;

  // Compute date range from period shortcut
  let dateFrom: Date | undefined = from ? new Date(from) : undefined;
  let dateTo:   Date | undefined = to   ? new Date(to)   : undefined;
  if (period && !from && !to) {
    const now = new Date();
    dateTo = new Date(now);
    dateTo.setHours(23, 59, 59, 999);
    if (period === "day") {
      dateFrom = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === "week") {
      const day = now.getDay();
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - day);
      dateFrom.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      dateFrom = new Date(now.getFullYear(), 0, 1);
    }
  }

  // Filter by department requires joining through user
  const userFilter = department
    ? await prisma.user.findMany({ where: { department }, select: { id: true } })
    : null;
  const userIds = userFilter ? userFilter.map((u) => u.id) : undefined;

  const worklogs = await prisma.workLog.findMany({
    where: {
      ...(effectiveUserId
        ? { userId: effectiveUserId }
        : userIds
        ? { userId: { in: userIds } }
        : {}),
      ...((dateFrom || dateTo) && {
        date: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo  && { lte: dateTo  }),
        },
      }),
    },
    include: {
      user: { select: { id: true, name: true, employeeId: true, department: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { date: "desc" },
    take: 500,
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
      data: { userId: session.user.id, taskId, date: new Date(date), hours, description },
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
