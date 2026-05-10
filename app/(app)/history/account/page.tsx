import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { HistoryFeed } from "@/components/history/history-feed";
import type { Role } from "@prisma/client";

async function canAccessHistory(role: Role) {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "history" } });
  const roles = (saved?.roles ?? DEFAULT_FEATURE_ACCESS.history) as string[];
  return roles.includes(role);
}

export default async function AccountHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!(await canAccessHistory(session.user.role as Role))) redirect("/dashboard");

  return (
    <HistoryFeed
      section="Account"
      title="Account History"
      description="Profile updates, settings changes, and personal account events"
    />
  );
}
