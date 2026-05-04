import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/roles";
import { apiResponse } from "@/lib/utils";
import { subDays, format } from "date-fns";

export async function GET() {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const now = new Date();
  const requests = await prisma.leaveRequest.findMany({
    where: { status: "APPROVED", startDate: { gte: subDays(now, 180) } },
    select: { type: true, startDate: true, days: true },
  });

  const monthlyLeave = Array.from({ length: 6 }, (_, i) => {
    const d = subDays(now, (5 - i) * 30);
    const key = format(d, "MMM");
    const filtered = requests.filter(
      (l) => format(new Date(l.startDate), "MMM") === key
    );
    return {
      month: key,
      CASUAL: filtered.filter((l) => l.type === "CASUAL").reduce((s, l) => s + l.days, 0),
      SICK: filtered.filter((l) => l.type === "SICK").reduce((s, l) => s + l.days, 0),
      ANNUAL: filtered.filter((l) => l.type === "ANNUAL").reduce((s, l) => s + l.days, 0),
    };
  });

  return apiResponse(monthlyLeave);
}
