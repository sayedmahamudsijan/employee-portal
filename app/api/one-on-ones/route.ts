import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const scope = req.nextUrl.searchParams.get("scope") ?? "all";
  const where: any = scope === "all"
    ? { OR: [{ managerId: session.user.id }, { reportId: session.user.id }] }
    : scope === "as-manager"
      ? { managerId: session.user.id }
      : { reportId: session.user.id };

  const meetings = await prisma.oneOnOne.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true, image: true } },
      report:  { select: { id: true, name: true, image: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
  return apiResponse(meetings);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { reportId, scheduledAt, durationMin, agenda } = await req.json();
  if (!reportId || !scheduledAt) return apiError("Report and date required");
  if (reportId === session.user.id) return apiError("Cannot schedule with yourself");

  const meeting = await prisma.oneOnOne.create({
    data: {
      managerId: session.user.id,
      reportId,
      scheduledAt: new Date(scheduledAt),
      durationMin: durationMin ?? 30,
      agenda: agenda ?? null,
    },
    include: {
      manager: { select: { id: true, name: true, image: true } },
      report: { select: { id: true, name: true, image: true } },
    },
  });

  await createNotification({
    userId: reportId,
    type: "1on1",
    message: `${meeting.manager.name} scheduled a 1:1 with you`,
    link: "/one-on-ones",
  });

  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "one-on-one",
    entityId: meeting.id,
    details: `Scheduled 1:1 with ${meeting.report.name}`,
  });

  return apiResponse(meeting);
}
