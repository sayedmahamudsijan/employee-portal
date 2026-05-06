import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const okr = await prisma.oKR.findUnique({ where: { id } });
  if (!okr) return apiError("Not found", 404);
  if (okr.userId !== session.user.id) return apiError("Forbidden", 403);

  const body = await req.json();
  const data: any = {};
  for (const key of ["objective", "description", "status", "keyResults", "quarter", "year"]) {
    if (key in body) data[key] = body[key];
  }
  const updated = await prisma.oKR.update({ where: { id }, data });
  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { id } = await params;
  const okr = await prisma.oKR.findUnique({ where: { id } });
  if (!okr) return apiError("Not found", 404);
  if (okr.userId !== session.user.id) return apiError("Forbidden", 403);
  await prisma.oKR.delete({ where: { id } });
  return apiResponse({ ok: true });
}
