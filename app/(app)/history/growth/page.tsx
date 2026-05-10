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

export default async function GrowthHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!(await canAccessHistory(session.user.role as Role))) redirect("/dashboard");

  const isExecutive = EXECUTIVE_ROLES.includes(session.user.role as any);

  return (
    <HistoryFeed
      section="Growth"
      title="Growth History"
      description="Goals, OKRs, performance reviews, and career development events"
      isExecutive={isExecutive}
      entityTabs={[
        { label: "Goal",               entity: "Goal" },
        { label: "Performance Review", entity: "PerformanceReview" },
        { label: "OKR",                entity: "OKR" },
        { label: "Mentorship",         entity: "Mentorship" },
      ]}
    />
  );
}
