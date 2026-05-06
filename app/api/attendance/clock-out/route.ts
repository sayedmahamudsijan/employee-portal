import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST() {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const record = await prisma.attendance.findFirst({
    where: { userId: session.user.id, date: { gte: today, lt: tomorrow } },
  });
  if (!record) return apiError("Not clocked in", 400);
  if (record.clockOut) return apiError("Already clocked out", 409);

  const now = new Date();
  const durationMin = Math.floor((now.getTime() - record.clockIn.getTime()) / 60000);

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { clockOut: now, durationMin },
  });
  return apiResponse(updated);
}
