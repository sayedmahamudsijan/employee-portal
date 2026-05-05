import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const userId = searchParams.get("userId") ?? undefined;
  const entity = searchParams.get("entity") ?? undefined;

  const logs = await prisma.activityLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(entity && { entity }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiResponse(logs);
}
