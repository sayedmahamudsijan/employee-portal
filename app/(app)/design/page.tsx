import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { getCompanySettings } from "@/lib/company-settings";
import { parseDesignConfig } from "@/lib/portal-design";
import { DesignStudio } from "@/components/design/design-studio";
import type { Role } from "@prisma/client";

async function canAccessDesign(role: Role): Promise<boolean> {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "design" } });
  const roles = (saved?.roles ?? DEFAULT_FEATURE_ACCESS.design) as string[];
  return roles.includes(role);
}

async function getDesignRoles(): Promise<string[]> {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "design" } });
  return (saved?.roles as string[]) ?? (DEFAULT_FEATURE_ACCESS.design as string[]);
}

export default async function DesignPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!(await canAccessDesign(session.user.role as Role))) redirect("/dashboard");

  const [settings, designRoles] = await Promise.all([
    getCompanySettings(),
    getDesignRoles(),
  ]);

  const designConfig = parseDesignConfig(settings.designConfig);

  return (
    <DesignStudio
      initialConfig={designConfig}
      designRoles={designRoles}
      companyName={settings.companyName}
    />
  );
}
