import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity, diffObjects } from "@/lib/activity-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return apiError("Goal not found", 404);

  if (goal.userId !== session!.user.id && session!.user.role === "EMPLOYEE") {
    return apiError("Forbidden", 403);
  }

  const oldSnap = { title: goal.title, progress: goal.progress, status: goal.status };

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
  });

  const newSnap = { title: updated.title, progress: updated.progress, status: updated.status };
  const diff = diffObjects(oldSnap as any, newSnap as any);
  const action = body.status === "COMPLETED" ? "Completed" : "Updated";

  logActivity({
    userId: session!.user.id,
    action,
    entity: "Goal",
    entityId: id,
    section: "Growth",
    details: action === "Completed"
      ? `Completed goal "${updated.title}"`
      : `Updated goal "${updated.title}"`,
    oldValue: diff.old,
    newValue: diff.new,
  });

  return apiResponse(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return apiError("Goal not found", 404);

  if (goal.userId !== session!.user.id && session!.user.role === "EMPLOYEE") {
    return apiError("Forbidden", 403);
  }

  await prisma.goal.delete({ where: { id } });

  logActivity({
    userId: session!.user.id,
    action: "Deleted",
    entity: "Goal",
    entityId: id,
    section: "Growth",
    details: `Deleted goal "${goal.title}"`,
    oldValue: { title: goal.title, status: goal.status },
  });

  return apiResponse({ deleted: true });
}
