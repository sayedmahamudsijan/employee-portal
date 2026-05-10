import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

// GET /api/notifications?unread=true  — latest notifications for current user
// unread=true  → only unread (used by bell dropdown)
// unread omitted → all (used by /notifications full page)
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: unreadOnly ? 30 : 50,
  });

  return apiResponse(notifications);
}
