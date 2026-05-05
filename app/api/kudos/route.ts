import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 30)));
  const userId = searchParams.get("userId") ?? undefined;

  const where = userId
    ? { OR: [{ fromId: userId }, { toId: userId }], isPublic: true }
    : { isPublic: true };

  const kudos = await prisma.kudos.findMany({
    where,
    include: {
      from: { select: { id: true, name: true, image: true } },
      to: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiResponse(kudos);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { toId, message, category, emoji, isPublic } = await req.json();
  if (!toId || !message) return apiError("Recipient and message are required");
  if (toId === session.user.id) return apiError("You can't give kudos to yourself");

  const recipient = await prisma.user.findUnique({ where: { id: toId } });
  if (!recipient) return apiError("Recipient not found", 404);

  const kudos = await prisma.kudos.create({
    data: {
      fromId: session.user.id,
      toId,
      message,
      category: category ?? "teamwork",
      emoji: emoji ?? "🌟",
      isPublic: isPublic ?? true,
    },
    include: {
      from: { select: { id: true, name: true, image: true } },
      to: { select: { id: true, name: true, image: true } },
    },
  });

  await createNotification({
    userId: toId,
    type: "kudos",
    message: `${kudos.from.name} gave you kudos: "${message.slice(0, 80)}"`,
    link: "/kudos",
  });

  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "kudos",
    entityId: kudos.id,
    details: `Gave kudos to ${recipient.name}`,
  });

  return apiResponse(kudos);
}
