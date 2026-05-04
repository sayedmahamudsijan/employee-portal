import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const existing = await prisma.workLog.findUnique({ where: { id } });
    if (!existing) return apiError("Worklog not found", 404);

    const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
    if (existing.userId !== session.user.id && roleOrder[session.user.role] < roleOrder["MANAGER"]) {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const { date, hours, description } = body;

    const data: Record<string, any> = {};
    if (date !== undefined) data.date = new Date(date);
    if (hours !== undefined) data.hours = hours;
    if (description !== undefined) data.description = description;

    if (hours !== undefined && existing.taskId) {
      const diff = hours - existing.hours;
      await prisma.task.update({
        where: { id: existing.taskId },
        data: { loggedHrs: { increment: diff } },
      });
    }

    const worklog = await prisma.workLog.update({ where: { id }, data });
    return apiResponse(worklog);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Worklog not found", 404);
    return apiError("Failed to update worklog", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const existing = await prisma.workLog.findUnique({ where: { id } });
    if (!existing) return apiError("Worklog not found", 404);

    const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
    if (existing.userId !== session.user.id && roleOrder[session.user.role] < roleOrder["MANAGER"]) {
      return apiError("Forbidden", 403);
    }

    if (existing.taskId) {
      await prisma.task.update({
        where: { id: existing.taskId },
        data: { loggedHrs: { decrement: existing.hours } },
      });
    }

    await prisma.workLog.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Worklog not found", 404);
    return apiError("Failed to delete worklog", 500);
  }
}
