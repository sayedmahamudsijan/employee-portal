import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { LeaveBalanceCards } from "@/components/leave/leave-balance-cards";
import { LeaveTable } from "@/components/leave/leave-table";
import { TeamLeaveTable } from "@/components/leave/team-leave-table";
import { LeaveRequestButton } from "@/components/leave/leave-request-button";

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isManager = canAccess(session.user.role, "MANAGER");

  const [balance, myRequests, teamRequests] = await Promise.all([
    prisma.leaveBalance.findUnique({ where: { userId: session.user.id } }),
    prisma.leaveRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    isManager
      ? prisma.leaveRequest.findMany({
          where: { user: { managerId: session.user.id }, status: "PENDING" },
          include: { user: { select: { id: true, name: true, image: true, email: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const pendingCount = teamRequests.length;

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Request time off and manage your team's leave"
        action={<LeaveRequestButton />}
      />

      <Tabs defaultValue="my-leave">
        <TabsList className="mb-6">
          <TabsTrigger value="my-leave">My Leave</TabsTrigger>
          {isManager && (
            <TabsTrigger value="team-requests" className="gap-2">
              Team Requests
              {pendingCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-leave" className="space-y-6">
          <LeaveBalanceCards balance={balance} />
          <LeaveTable requests={JSON.parse(JSON.stringify(myRequests))} />
        </TabsContent>

        {isManager && (
          <TabsContent value="team-requests">
            <TeamLeaveTable requests={JSON.parse(JSON.stringify(teamRequests))} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
