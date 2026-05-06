import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

/**
 * Returns calendar events for a month: leaves (approved), holidays, birthdays, anniversaries.
 * Query: ?month=YYYY-MM
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const [leaves, holidays, users] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { startDate: { gte: start, lt: end } },
          { endDate: { gte: start, lt: end } },
          { AND: [{ startDate: { lt: start } }, { endDate: { gte: end } }] },
        ],
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
    prisma.publicHoliday.findMany({
      where: { date: { gte: start, lt: end } },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", OR: [{ birthday: { not: null } }, { joinedAt: { not: null } }] },
      select: { id: true, name: true, image: true, birthday: true, joinedAt: true },
    }),
  ]);

  // Build events array
  const events: any[] = [];

  for (const l of leaves) {
    events.push({
      type: "leave",
      title: `${l.user.name} on ${l.type.toLowerCase()} leave`,
      startDate: l.startDate,
      endDate: l.endDate,
      user: l.user,
      meta: { leaveType: l.type, days: l.days },
    });
  }

  for (const h of holidays) {
    events.push({
      type: "holiday",
      title: h.name,
      startDate: h.date,
      endDate: h.date,
    });
  }

  // Birthdays / anniversaries that fall within month
  for (const u of users) {
    if (u.birthday) {
      const bd = new Date(u.birthday);
      const thisYear = new Date(y, bd.getMonth(), bd.getDate());
      if (thisYear >= start && thisYear < end) {
        events.push({
          type: "birthday",
          title: `🎂 ${u.name}'s birthday`,
          startDate: thisYear,
          endDate: thisYear,
          user: u,
        });
      }
    }
    if (u.joinedAt) {
      const j = new Date(u.joinedAt);
      const thisYear = new Date(y, j.getMonth(), j.getDate());
      if (thisYear >= start && thisYear < end && y > j.getFullYear()) {
        const yrs = y - j.getFullYear();
        events.push({
          type: "anniversary",
          title: `🎉 ${u.name}'s ${yrs}-year anniversary`,
          startDate: thisYear,
          endDate: thisYear,
          user: u,
        });
      }
    }
  }

  return apiResponse(events);
}
