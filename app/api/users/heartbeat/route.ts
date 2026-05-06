import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

// Called every 30 seconds by the client-side Heartbeat component
export async function POST(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { lastSeenAt: new Date() },
    });
    return apiResponse({ ok: true });
  } catch {
    return apiError("Failed", 500);
  }
}
