import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";

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

  await prisma.notification.create({
    data: {
      userId: toId,
      type: "kudos",
      message: `${kudos.from.name} gave you kudos: "${message.slice(0, 80)}"`,
      link: "/kudos",
    },
  });

  logActivity({
    userId: session.user.id,
    action: "Created",
    entity: "Kudos",
    entityId: kudos.id,
    section: "Company",
    details: `Gave ${emoji ?? "🌟"} kudos to ${recipient.name}: "${message.slice(0, 60)}"`,
    newValue: { toId, category: category ?? "teamwork", emoji: emoji ?? "🌟" },
  });

  return apiResponse(kudos);
}
