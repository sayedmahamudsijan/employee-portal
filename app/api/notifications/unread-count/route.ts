import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return Response.json({ data: 0 });

  const count = await prisma.notification.count({
    where: { userId: session!.user.id, read: false },
  });

  return apiResponse(count);
}
