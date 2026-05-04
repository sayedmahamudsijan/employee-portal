import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { userId } = await params;

  const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  const isSelf = session.user.id === userId;
  const isManager = roleOrder[session.user.role] >= roleOrder["MANAGER"];

  if (!isSelf && !isManager) return apiError("Forbidden", 403);

  const balance = await prisma.leaveBalance.findUnique({ where: { userId } });
  if (!balance) return apiError("Leave balance not found", 404);

  return apiResponse(balance);
}
