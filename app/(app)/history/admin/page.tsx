import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { EXECUTIVE_ROLES } from "@/lib/roles";
import { HistoryFeed } from "@/components/history/history-feed";
import type { Role } from "@prisma/client";

async function canAccessHistory(role: Role) {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "history" } });
  const roles = (saved?.roles ?? DEFAULT_FEATURE_ACCESS.history) as string[];
  return roles.includes(role);
}

export default async function AdminHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!(await canAccessHistory(session.user.role as Role))) redirect("/dashboard");

  const isExecutive = EXECUTIVE_ROLES.includes(session.user.role as any);

  return (
    <HistoryFeed
      section="Admin"
      title="Admin History"
      description="Role changes, account status, access control modifications, and user deletions"
      isExecutive={isExecutive}
      entityTabs={[
        { label: "User",            entity: "User" },
        { label: "Feature Access",  entity: "FeatureAccess" },
        { label: "Settings",        entity: "CompanySettings" },
      ]}
    />
  );
}
