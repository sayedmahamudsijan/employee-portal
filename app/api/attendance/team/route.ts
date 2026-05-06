import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

/** Manager+ view: all attendance for a date */
export async function GET(req: NextRequest) {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: date, lt: next } },
    include: { user: { select: { id: true, name: true, email: true, image: true, employeeId: true, department: true } } },
    orderBy: { clockIn: "asc" },
  });

  // Also list users with no record today
  const allUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true, image: true, employeeId: true, department: true },
  });
  const presentIds = new Set(records.map((r) => r.userId));
  const absent = allUsers.filter((u) => !presentIds.has(u.id));

  return apiResponse({ present: records, absent });
}
