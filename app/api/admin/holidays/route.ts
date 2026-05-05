import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole, requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const holidays = await prisma.publicHoliday.findMany({
    where: { year },
    orderBy: { date: "asc" },
  });

  return apiResponse(holidays);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const body = await req.json();
  const { name, date } = body;
  if (!name || !date) return apiError("Name and date are required");

  const dateObj = new Date(date);
  const holiday = await prisma.publicHoliday.create({
    data: { name, date: dateObj, year: dateObj.getFullYear() },
  });

  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "holiday",
    entityId: holiday.id,
    details: `Added holiday "${name}" on ${dateObj.toDateString()}`,
  });

  return apiResponse(holiday);
}
