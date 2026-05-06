import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { id } = await params;
  const { body, isInternal } = await req.json();
  if (!body) return apiError("Body required");

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return apiError("Not found", 404);

  const comment = await prisma.ticketComment.create({
    data: { ticketId: id, authorId: session.user.id, body, isInternal: !!isInternal },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  // Notify the other side
  const recipient = session.user.id === ticket.creatorId
    ? (ticket.assigneeId ?? null)
    : ticket.creatorId;
  if (recipient && recipient !== session.user.id) {
    await createNotification({
      userId: recipient,
      type: "ticket",
      message: `New comment on ticket #${ticket.number}`,
      link: `/helpdesk/${id}`,
    });
  }

  return apiResponse(comment);
}
