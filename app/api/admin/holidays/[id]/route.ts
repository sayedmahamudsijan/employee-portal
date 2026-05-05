import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  const body = await req.json();
  const { name, date } = body;

  const data: any = {};
  if (name) data.name = name;
  if (date) {
    const d = new Date(date);
    data.date = d;
    data.year = d.getFullYear();
  }

  const holiday = await prisma.publicHoliday.update({ where: { id }, data });
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "holiday",
    entityId: id,
    details: `Updated holiday "${holiday.name}"`,
  });
  return apiResponse(holiday);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  try {
    const holiday = await prisma.publicHoliday.delete({ where: { id } });
    await logActivity({
      userId: session.user.id,
      action: "delete",
      entity: "holiday",
      entityId: id,
      details: `Removed holiday "${holiday.name}"`,
    });
    return apiResponse({ ok: true });
  } catch {
    return apiError("Failed to delete holiday", 500);
  }
}
