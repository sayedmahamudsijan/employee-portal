import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const body = await req.json();
    const { status } = body;

    if (!status) return apiError("status is required");

    const existing = await prisma.task.findUnique({ where: { id }, select: { status: true, title: true } });
    if (!existing) return apiError("Task not found", 404);

    const task = await prisma.task.update({ where: { id }, data: { status } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        taskId: id,
        action: "STATUS_CHANGED",
        details: `Status changed from ${existing.status} to ${status}`,
      },
    });

    return apiResponse(task);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Task not found", 404);
    return apiError("Failed to update status", 500);
  }
}
