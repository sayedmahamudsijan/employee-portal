import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

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
  return apiResponse({ deleted: true });
}
