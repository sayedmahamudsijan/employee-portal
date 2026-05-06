import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { CompensationManager } from "@/components/admin/compensation-manager";

export default async function CompensationPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true, jobTitle: true, department: true, image: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Compensation"
        description="Salary history and compensation records — strictly admin-only"
      />
      <CompensationManager users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
