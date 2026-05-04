import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeDirectory } from "@/components/team/employee-directory";
import { Users } from "lucide-react";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const employees = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      jobTitle: true,
      department: true,
      status: true,
      createdAt: true,
      manager: {
        select: { id: true, name: true, image: true },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ) as string[];

  if (employees.length === 0) {
    return (
      <div>
        <PageHeader title="Employee Directory" description="Browse all active team members" />
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Active employees will appear here once accounts are activated."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        description={`${employees.length} active team member${employees.length !== 1 ? "s" : ""}`}
      />
      <EmployeeDirectory employees={employees} departments={departments} />
    </div>
  );
}
