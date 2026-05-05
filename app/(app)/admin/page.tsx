import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { getCompanySettings } from "@/lib/company-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AdminActivityFeed } from "@/components/admin/activity-feed";
import { HolidaysManager } from "@/components/admin/holidays-manager";
import { DepartmentsManager } from "@/components/admin/departments-manager";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { AssetsManager } from "@/components/admin/assets-manager";
import { OnboardingTemplatesManager } from "@/components/admin/onboarding-templates-manager";
import { ExportsPanel } from "@/components/admin/exports-panel";
import { Users, Building2, Briefcase, Activity, ShieldCheck } from "lucide-react";

export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const year = new Date().getFullYear();

  const [settings, holidays, departments, assets, templates, activeUsers, pendingUsers, totalAssets, recentActivity] =
    await Promise.all([
      getCompanySettings(),
      prisma.publicHoliday.findMany({ where: { year }, orderBy: { date: "asc" } }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.asset.findMany({
        include: {
          assignments: {
            where: { returnedAt: null },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.onboardingTemplate.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.asset.count(),
      prisma.activityLog.findMany({
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]).catch(() => [
      // Graceful degradation if new tables don't exist yet
      { companyName: "Meta Build Dynamics" } as any,
      [], [], [], [], 0, 0, 0, [],
    ]);

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Admin Hub"
        description="Centralized command centre for managing the entire portal"
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Employees" value={activeUsers} icon={Users} color="green" />
        <StatCard label="Pending Approvals" value={pendingUsers} icon={ShieldCheck} color="amber" />
        <StatCard label="Departments" value={departments.length} icon={Building2} color="blue" />
        <StatCard label="Tracked Assets" value={totalAssets} icon={Briefcase} color="default" />
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="activity"><Activity className="w-3.5 h-3.5 mr-1.5" />Activity</TabsTrigger>
          <TabsTrigger value="settings">Company Settings</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="exports">Reports & Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <AdminActivityFeed initial={JSON.parse(JSON.stringify(recentActivity))} />
        </TabsContent>

        <TabsContent value="settings">
          <CompanySettingsForm initial={JSON.parse(JSON.stringify(settings))} />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsManager
            initial={JSON.parse(JSON.stringify(departments))}
            users={JSON.parse(JSON.stringify(allUsers))}
          />
        </TabsContent>

        <TabsContent value="holidays">
          <HolidaysManager initial={JSON.parse(JSON.stringify(holidays))} year={year} />
        </TabsContent>

        <TabsContent value="assets">
          <AssetsManager
            initial={JSON.parse(JSON.stringify(assets))}
            users={JSON.parse(JSON.stringify(allUsers))}
          />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingTemplatesManager initial={JSON.parse(JSON.stringify(templates))} />
        </TabsContent>

        <TabsContent value="exports">
          <ExportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
