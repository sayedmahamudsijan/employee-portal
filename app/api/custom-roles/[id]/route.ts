import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const EXEC_ROLES = ["CEO", "CMO", "CTO", "ADMIN"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  if (!EXEC_ROLES.includes(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { name, color, description } = body as {
    name?: string;
    color?: string;
    description?: string;
  };

  const existing = await prisma.customRole.findUnique({ where: { id } });
  if (!existing) return apiError("Custom role not found", 404);

  const updated = await prisma.customRole.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });

  return apiResponse(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  if (!EXEC_ROLES.includes(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;

  const existing = await prisma.customRole.findUnique({ where: { id } });
  if (!existing) return apiError("Custom role not found", 404);

  // Remove this customRoleId from all FeatureAccess.roles arrays
  const featureEntries = await prisma.featureAccess.findMany({
    where: { roles: { has: id } },
  });

  for (const entry of featureEntries) {
    await prisma.featureAccess.update({
      where: { id: entry.id },
      data: { roles: (entry.roles as string[]).filter((r) => r !== id) },
    });
  }

  await prisma.customRole.delete({ where: { id } });

  return apiResponse({ deleted: true });
}
