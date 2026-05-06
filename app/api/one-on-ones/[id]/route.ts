import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const meeting = await prisma.oneOnOne.findUnique({ where: { id } });
  if (!meeting) return apiError("Not found", 404);
  if (meeting.managerId !== session.user.id && meeting.reportId !== session.user.id)
    return apiError("Forbidden", 403);

  const body = await req.json();
  const data: any = {};

  // Each side can only edit their own notes; status/agenda/schedule by manager only
  if ("managerNotes" in body && session.user.id === meeting.managerId)
    data.managerNotes = body.managerNotes;
  if ("reportNotes" in body && session.user.id === meeting.reportId)
    data.reportNotes = body.reportNotes;

  if (session.user.id === meeting.managerId) {
    if ("agenda" in body) data.agenda = body.agenda;
    if ("scheduledAt" in body) data.scheduledAt = new Date(body.scheduledAt);
    if ("durationMin" in body) data.durationMin = body.durationMin;
    if ("status" in body) data.status = body.status;
    if ("actionItems" in body) data.actionItems = body.actionItems;
  }

  const updated = await prisma.oneOnOne.update({ where: { id }, data });
  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { id } = await params;
  const meeting = await prisma.oneOnOne.findUnique({ where: { id } });
  if (!meeting) return apiError("Not found", 404);
  if (meeting.managerId !== session.user.id) return apiError("Forbidden", 403);

  await prisma.oneOnOne.delete({ where: { id } });
  return apiResponse({ ok: true });
}
