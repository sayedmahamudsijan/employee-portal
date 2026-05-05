import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { toCSV, csvResponse } from "@/lib/export";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const userId = searchParams.get("userId") ?? undefined;

  const logs = await prisma.workLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(from || to
        ? { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true, employeeId: true } },
      task: { select: { title: true } },
    },
    orderBy: { date: "desc" },
  });

  const csv = toCSV(logs, [
    { key: "date", label: "Date", map: (l: any) => format(new Date(l.date), "yyyy-MM-dd") },
    { key: "employeeId", label: "Employee ID", map: (l: any) => l.user.employeeId ?? "" },
    { key: "name", label: "Name", map: (l: any) => l.user.name },
    { key: "email", label: "Email", map: (l: any) => l.user.email },
    { key: "hours", label: "Hours" },
    { key: "task", label: "Task", map: (l: any) => l.task?.title ?? "" },
    { key: "description", label: "Description" },
  ]);

  return csvResponse(csv, `worklogs-${format(new Date(), "yyyy-MM-dd")}.csv`);
}
