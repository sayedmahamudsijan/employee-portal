import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { ROLE_LEVEL } from "@/lib/roles";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { id } = await params;
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      assignee: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!t) return apiError("Not found", 404);
  return apiResponse(t);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return apiError("Not found", 404);

  const isMgr = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;
  const body = await req.json();
  const data: any = {};

  // Manager+ can change status, assignee, priority
  if (isMgr) {
    if ("status" in body) {
      data.status = body.status;
      if (body.status === "RESOLVED") data.resolvedAt = new Date();
    }
    if ("assigneeId" in body) data.assigneeId = body.assigneeId || null;
    if ("priority" in body) data.priority = body.priority;
    if ("category" in body) data.category = body.category;
  }
  // Creator can edit title/desc only while still OPEN
  if (ticket.creatorId === session.user.id && ticket.status === "OPEN") {
    if ("title" in body) data.title = body.title;
    if ("description" in body) data.description = body.description;
  }

  const updated = await prisma.ticket.update({ where: { id }, data });

  // Notify creator of important state changes
  if (data.status && data.status !== ticket.status) {
    await createNotification({
      userId: ticket.creatorId,
      type: "ticket",
      message: `Ticket #${ticket.number} is now ${data.status.toLowerCase()}`,
      link: `/helpdesk/${ticket.id}`,
    });
  }

  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "ticket",
    entityId: id,
    details: `Updated ticket #${ticket.number}`,
  });

  return apiResponse(updated);
}
