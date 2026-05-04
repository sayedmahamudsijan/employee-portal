import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { ids, all } = body;

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session!.user.id, read: false },
      data: { read: true },
    });
  } else if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session!.user.id },
      data: { read: true },
    });
  }

  return apiResponse({ success: true });
}
