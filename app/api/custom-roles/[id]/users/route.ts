import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const EXEC_ROLES = ["CEO", "CMO", "CTO", "ADMIN"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const { id } = await params;

  const existing = await prisma.customRole.findUnique({ where: { id } });
  if (!existing) return apiError("Custom role not found", 404);

  const users = await prisma.user.findMany({
    where: { customRoleId: id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      jobTitle: true,
      department: true,
    },
  });

  return apiResponse(users);
}

export async function PUT(
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
  const { userIds } = body as { userIds: string[] };

  if (!Array.isArray(userIds)) return apiError("userIds must be an array");

  const existing = await prisma.customRole.findUnique({ where: { id } });
  if (!existing) return apiError("Custom role not found", 404);

  // Clear all users currently assigned to this custom role
  await prisma.user.updateMany({
    where: { customRoleId: id },
    data: { customRoleId: null },
  });

  // Assign the new set of users
  if (userIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { customRoleId: id },
    });
  }

  return apiResponse({ updated: true });
}
