import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { UserManagement } from "@/components/settings/user-management";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = canAccess(session.user.role, "ADMIN");

  const [user, allUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, jobTitle: true, department: true, role: true },
    }),
    isAdmin
      ? prisma.user.findMany({
          select: {
            id: true, name: true, email: true, role: true,
            status: true, createdAt: true, department: true, jobTitle: true,
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Settings" />

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">User Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          {user && (
            <ProfileForm
              user={JSON.parse(JSON.stringify(user))}
              userId={session.user.id}
            />
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <UserManagement users={JSON.parse(JSON.stringify(allUsers))} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
