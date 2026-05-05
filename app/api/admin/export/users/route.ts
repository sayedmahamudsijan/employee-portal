import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { toCSV, csvResponse } from "@/lib/export";
import { format } from "date-fns";

export async function GET() {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    include: { manager: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const csv = toCSV(users, [
    { key: "employeeId", label: "Employee ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "department", label: "Department" },
    { key: "jobTitle", label: "Job Title" },
    { key: "manager", label: "Manager", map: (u: any) => u.manager?.name ?? "" },
    { key: "phone", label: "Phone" },
    { key: "joinedAt", label: "Joined", map: (u: any) => (u.joinedAt ? format(new Date(u.joinedAt), "yyyy-MM-dd") : "") },
    { key: "createdAt", label: "Created", map: (u: any) => format(new Date(u.createdAt), "yyyy-MM-dd") },
  ]);

  return csvResponse(csv, `users-${format(new Date(), "yyyy-MM-dd")}.csv`);
}
