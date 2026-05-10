import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { getCompanySettings } from "@/lib/company-settings";
import { parseDesignConfig, type DesignConfig } from "@/lib/portal-design";
import type { Role } from "@prisma/client";

async function getUserFeatures(role: Role, customRoleId?: string | null): Promise<string[]> {
  const saved = await prisma.featureAccess.findMany();
  const allowed: string[] = [];
  for (const [feature, defaultRoles] of Object.entries(DEFAULT_FEATURE_ACCESS)) {
    const override = saved.find((s) => s.feature === feature);
    const roles = override ? (override.roles as string[]) : (defaultRoles as string[]);
    if (roles.includes(role) || (customRoleId && roles.includes(customRoleId))) {
      allowed.push(feature);
    }
  }
  return allowed;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");
  if (session.user.status === "PENDING") redirect("/pending");
  if (session.user.status === "INACTIVE") redirect("/");
  // Freshly-invited users must verify their access code before accessing the portal
  if (session.user.accessCodeUsed === false) redirect("/first-login");

  const [features, settings] = await Promise.all([
    getUserFeatures(session.user.role as Role, session.user.customRoleId),
    getCompanySettings(),
  ]);

  const designConfig: DesignConfig = parseDesignConfig(settings.designConfig);

  return (
    <AppShell session={session} features={features} designConfig={designConfig}>
      {children}
    </AppShell>
  );
}
