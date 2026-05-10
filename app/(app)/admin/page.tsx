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
import { AccessRequestsManager } from "@/components/admin/access-requests-manager";
import { InvitationsManager } from "@/components/admin/invitations-manager";
import { Users, Building2, Briefcase, Activity, ShieldCheck, UserPlus, Mail } from "lucide-react";
import { isExecutive } from "@/lib/roles";
import type { Role } from "@prisma/client";

export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const year = new Date().getFullYear();

  const [settings, holidays, departments, assets, templates, activeUsers, pendingUsers, totalAssets, recentActivity, accessRequests, invitations, customRoles] =
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
      prisma.accessRequest.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.invitation.findMany({
        orderBy: { sentAt: "desc" },
        include: { sentBy: { select: { name: true, email: true } } },
      }),
      prisma.customRole.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]).catch(() => [
      // Graceful degradation if new tables don't exist yet
      { companyName: "Meta Build Dynamics" } as any,
      [], [], [], [], 0, 0, 0, [], [], [], [],
    ]);

  const pendingRequestCount = Array.isArray(accessRequests)
    ? accessRequests.filter((r: any) => r.status === "PENDING").length
    : 0;

  const pendingInviteCount = Array.isArray(invitations)
    ? invitations.filter((i: any) => i.status === "PENDING").length
    : 0;

  const canResetCode = isExecutive(session.user.role as Role);

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
        <StatCard label="Access Requests" value={pendingRequestCount} icon={UserPlus} color="blue" />
        <StatCard label="Tracked Assets" value={totalAssets} icon={Briefcase} color="default" />
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="activity"><Activity className="w-3.5 h-3.5 mr-1.5" />Activity</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />Access Requests
            {pendingRequestCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-yellow-500 text-white text-[10px] font-bold leading-none">
                {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Company Settings</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="invitations" className="relative">
            <Mail className="w-3.5 h-3.5 mr-1.5" />Invitations
            {pendingInviteCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold leading-none">
                {pendingInviteCount > 9 ? "9+" : pendingInviteCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="exports">Reports & Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <AdminActivityFeed initial={JSON.parse(JSON.stringify(recentActivity))} />
        </TabsContent>

        <TabsContent value="requests">
          <AccessRequestsManager initial={JSON.parse(JSON.stringify(accessRequests ?? []))} />
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

        <TabsContent value="invitations">
          <InvitationsManager
            initial={JSON.parse(JSON.stringify(invitations ?? []))}
            customRoles={JSON.parse(JSON.stringify(customRoles ?? []))}
            canResetCode={canResetCode}
          />
        </TabsContent>

        <TabsContent value="exports">
          <ExportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
