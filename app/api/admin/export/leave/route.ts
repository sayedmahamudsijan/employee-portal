import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { toCSV, csvResponse } from "@/lib/export";
import { format } from "date-fns";

export async function GET() {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const requests = await prisma.leaveRequest.findMany({
    include: { user: { select: { name: true, email: true, employeeId: true, department: true } } },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCSV(requests, [
    { key: "employeeId", label: "Employee ID", map: (r: any) => r.user.employeeId ?? "" },
    { key: "name", label: "Name", map: (r: any) => r.user.name },
    { key: "email", label: "Email", map: (r: any) => r.user.email },
    { key: "department", label: "Department", map: (r: any) => r.user.department ?? "" },
    { key: "type", label: "Type" },
    { key: "startDate", label: "Start", map: (r: any) => format(new Date(r.startDate), "yyyy-MM-dd") },
    { key: "endDate", label: "End", map: (r: any) => format(new Date(r.endDate), "yyyy-MM-dd") },
    { key: "days", label: "Days" },
    { key: "status", label: "Status" },
    { key: "reason", label: "Reason" },
    { key: "createdAt", label: "Requested", map: (r: any) => format(new Date(r.createdAt), "yyyy-MM-dd") },
  ]);

  return csvResponse(csv, `leave-${format(new Date(), "yyyy-MM-dd")}.csv`);
}
