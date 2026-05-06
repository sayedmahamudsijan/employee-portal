import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { DiversityDashboard } from "@/components/admin/diversity-dashboard";

export default async function DiversityPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) redirect("/dashboard");

  return (
    <div>
      <PageHeader
        title="Diversity & Inclusion"
        description="Aggregate metrics — only counts, never individual records"
      />
      <DiversityDashboard />
    </div>
  );
}
