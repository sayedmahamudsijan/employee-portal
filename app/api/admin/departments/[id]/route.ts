import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  const body = await req.json();
  const dept = await prisma.department.update({ where: { id }, data: body });
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "department",
    entityId: id,
    details: `Updated department "${dept.name}"`,
  });
  return apiResponse(dept);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  try {
    const dept = await prisma.department.delete({ where: { id } });
    await logActivity({
      userId: session.user.id,
      action: "delete",
      entity: "department",
      entityId: id,
      details: `Deleted department "${dept.name}"`,
    });
    return apiResponse({ ok: true });
  } catch {
    return apiError("Failed to delete department", 500);
  }
}
