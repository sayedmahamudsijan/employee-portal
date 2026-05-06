import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { ROLE_LEVEL } from "@/lib/roles";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { id } = await params;
  const m = await prisma.mentorship.findUnique({ where: { id } });
  if (!m) return apiError("Not found", 404);

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;
  const isInvolved = m.mentorId === session.user.id || m.menteeId === session.user.id;
  if (!isMgrPlus && !isInvolved) return apiError("Forbidden", 403);

  const body = await req.json();
  const data: any = {};
  for (const k of ["focusArea", "goals", "notes", "status"]) {
    if (k in body) data[k] = body[k];
  }
  if ("endDate" in body) data.endDate = body.endDate ? new Date(body.endDate) : null;

  const updated = await prisma.mentorship.update({ where: { id }, data });
  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  if (ROLE_LEVEL[session.user.role] < ROLE_LEVEL.MANAGER) return apiError("Forbidden", 403);
  const { id } = await params;
  await prisma.mentorship.delete({ where: { id } });
  return apiResponse({ ok: true });
}
