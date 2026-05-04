import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      sprint: { select: { id: true, name: true, status: true } },
      workLogs: { include: { user: { select: { id: true, name: true } } } },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task) return apiError("Task not found", 404);
  return apiResponse(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const body = await req.json();
    const { title, description, status, priority, estimatedHrs, dueDate, assigneeId, sprintId, blockedById, tags } = body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (estimatedHrs !== undefined) data.estimatedHrs = estimatedHrs;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (sprintId !== undefined) data.sprintId = sprintId;
    if (blockedById !== undefined) data.blockedById = blockedById;
    if (tags !== undefined) data.tags = tags;

    const task = await prisma.task.update({ where: { id }, data });
    return apiResponse(task);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Task not found", 404);
    return apiError("Failed to update task", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.task.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Task not found", 404);
    return apiError("Failed to delete task", 500);
  }
}
