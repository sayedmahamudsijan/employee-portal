import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";
import { getCompanySettings } from "@/lib/company-settings";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") ?? session.user.id;
  const month = searchParams.get("month"); // YYYY-MM
  const today = searchParams.get("today");

  if (today === "true") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const record = await prisma.attendance.findFirst({
      where: { userId, date: { gte: start, lt: end } },
    });
    return apiResponse(record);
  }

  let where: any = { userId };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
    take: 100,
  });
  return apiResponse(records);
}

/** Clock in */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { workMode = "OFFICE", notes } = await req.json();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Already clocked in today?
  const existing = await prisma.attendance.findFirst({
    where: { userId: session.user.id, date: { gte: today, lt: tomorrow } },
  });
  if (existing) return apiError("Already clocked in today", 409);

  // Late if past working start time
  const settings = await getCompanySettings();
  const [startH, startM] = settings.workingHoursStart.split(":").map(Number);
  const startTime = new Date(today);
  startTime.setHours(startH, startM, 0, 0);
  const isLate = new Date() > startTime;

  const record = await prisma.attendance.create({
    data: {
      userId: session.user.id,
      date: today,
      clockIn: new Date(),
      workMode: workMode as any,
      notes: notes ?? null,
      isLate,
    },
  });
  logActivity({
    userId: session.user.id,
    action: "Clocked In",
    entity: "Attendance",
    entityId: record.id,
    section: "Workspace",
    details: `Clocked in (${workMode}${isLate ? ", late" : ""})`,
    newValue: { workMode, isLate, clockIn: record.clockIn },
  });
  return apiResponse(record);
}
