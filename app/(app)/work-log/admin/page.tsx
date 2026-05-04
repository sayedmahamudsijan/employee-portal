import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AdminWorkLog } from "@/components/work-log/admin-work-log";

export default async function AdminWorkLogPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) redirect("/work-log");

  const employees = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Work Log — Admin View"
        description="View and export work logs across all employees and departments"
      />
      <AdminWorkLog employees={JSON.parse(JSON.stringify(employees))} />
    </div>
  );
}
