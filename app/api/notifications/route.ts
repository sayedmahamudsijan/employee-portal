import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

// GET /api/notifications  — latest 15 for the current user (used by bell dropdown)
export async function GET(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return apiResponse(notifications);
}
