import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { userId } = await params;

  if (userId !== session!.user.id && session!.user.role !== "ADMIN") {
    return apiError("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return apiResponse(notifications, { total, page, limit });
}
