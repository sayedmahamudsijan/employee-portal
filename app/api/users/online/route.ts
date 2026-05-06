import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

// Returns online status for a list of userIds or all active users
// ?ids=id1,id2,id3  OR  no param = all ACTIVE users
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  try {
    const idsParam = req.nextUrl.searchParams.get("ids");
    const userIds  = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        ...(userIds ? { id: { in: userIds } } : {}),
      },
      select: { id: true, lastSeenAt: true },
    });

    const now = Date.now();
    const result = users.map((u) => {
      const ms = u.lastSeenAt ? now - u.lastSeenAt.getTime() : Infinity;
      const status =
        ms < 3 * 60 * 1000  ? "online"  :   // < 3 min  → online
        ms < 30 * 60 * 1000 ? "away"    :   // < 30 min → away
        "offline";
      return { id: u.id, status, lastSeenAt: u.lastSeenAt };
    });

    return apiResponse(result);
  } catch {
    return apiError("Failed", 500);
  }
}
