import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin as checkAdmin } from "@/lib/roles";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { UserManagement } from "@/components/settings/user-management";
import { AllowedEmailsManager } from "@/components/settings/allowed-emails";
import { FeatureAccessControl } from "@/components/settings/feature-access";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = checkAdmin(session.user.role);

  const [user, allUsers, allowedEmails, featureAccess] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, jobTitle: true, department: true, role: true },
    }),
    isAdmin
      ? prisma.user.findMany({
          select: {
            id: true, name: true, email: true, role: true,
            status: true, createdAt: true, department: true, jobTitle: true, employeeId: true,
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    isAdmin ? prisma.allowedEmail.findMany({ orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    isAdmin ? prisma.featureAccess.findMany() : Promise.resolve([]),
  ]);

  // Merge saved overrides with defaults
  const mergedAccess = Object.entries(DEFAULT_FEATURE_ACCESS).map(([feature, defaultRoles]) => {
    const override = featureAccess.find((f) => f.feature === feature);
    return { feature, roles: override ? override.roles : defaultRoles };
  });

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and portal configuration" />

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
          {isAdmin && <TabsTrigger value="access">Access Control</TabsTrigger>}
          {isAdmin && <TabsTrigger value="whitelist">Email Whitelist</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          {user && <ProfileForm user={JSON.parse(JSON.stringify(user))} userId={session.user.id} />}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <UserManagement
              users={JSON.parse(JSON.stringify(allUsers))}
              currentUserRole={session.user.role}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="access">
            <FeatureAccessControl initial={JSON.parse(JSON.stringify(mergedAccess))} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="whitelist">
            <AllowedEmailsManager initial={JSON.parse(JSON.stringify(allowedEmails))} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
