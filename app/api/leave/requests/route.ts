import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError, calcWorkingDays } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  const role = session.user.role;

  let where: Record<string, any> = {};

  if (roleOrder[role] >= roleOrder["ADMIN"]) {
    // admin sees all
  } else if (roleOrder[role] >= roleOrder["MANAGER"]) {
    const reports = await prisma.user.findMany({
      where: { managerId: session.user.id },
      select: { id: true },
    });
    const reportIds = reports.map((r) => r.id);
    where.userId = { in: [session.user.id, ...reportIds] };
  } else {
    where.userId = session.user.id;
  }

  if (status) where.status = status;

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: { user: { select: { id: true, name: true, image: true, department: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse(requests);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { type, startDate, endDate, reason } = body;

    if (!type || !startDate || !endDate) return apiError("type, startDate and endDate are required");

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return apiError("startDate must be before endDate");

    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlap) return apiError("You already have an approved leave during this period", 409);

    const days = calcWorkingDays(start, end);

    if (type !== "UNPAID") {
      const balance = await prisma.leaveBalance.findUnique({ where: { userId: session.user.id } });
      if (!balance) return apiError("Leave balance not found", 404);
      const key = type.toLowerCase() as keyof typeof balance;
      const available = balance[key] as number;
      if (available < days) return apiError(`Insufficient ${type.toLowerCase()} leave balance. Available: ${available}, Requested: ${days}`);
    }

    const request = await prisma.leaveRequest.create({
      data: {
        userId: session.user.id,
        type,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: "PENDING",
      },
    });

    return apiResponse(request);
  } catch {
    return apiError("Failed to create leave request", 500);
  }
}
