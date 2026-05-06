import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { ROLE_LEVEL } from "@/lib/roles";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const scope = searchParams.get("scope") ?? "me";
  const status = searchParams.get("status") ?? undefined;
  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;

  const where: any = {};
  if (scope === "me") where.creatorId = session.user.id;
  else if (scope === "assigned") where.assigneeId = session.user.id;
  else if (scope === "all" && isMgrPlus) {
    /* no filter */
  } else {
    where.creatorId = session.user.id;
  }
  if (status) where.status = status;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, image: true } },
      assignee: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return apiResponse(tickets);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { title, description, category, priority } = await req.json();
  if (!title || !description || !category) return apiError("Title, description, category required");

  const ticket = await prisma.ticket.create({
    data: {
      title, description, category,
      priority: priority ?? "MEDIUM",
      creatorId: session.user.id,
    },
  });
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "ticket",
    entityId: ticket.id,
    details: `Opened ticket #${ticket.number}: ${title}`,
  });
  return apiResponse(ticket);
}
