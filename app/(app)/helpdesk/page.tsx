import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVEL } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketsList } from "@/components/helpdesk/tickets-list";

export default async function HelpdeskPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;

  const [myTickets, assignedTickets, allTickets] = await Promise.all([
    prisma.ticket.findMany({
      where: { creatorId: session.user.id },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        assignee: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticket.findMany({
      where: { assigneeId: session.user.id },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        assignee: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isMgrPlus
      ? prisma.ticket.findMany({
          include: {
            creator: { select: { id: true, name: true, image: true } },
            assignee: { select: { id: true, name: true, image: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Helpdesk"
        description="Submit IT/HR/Office tickets and track their resolution"
      />
      <Tabs defaultValue="my">
        <TabsList className="mb-6">
          <TabsTrigger value="my">My Tickets</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          {isMgrPlus && <TabsTrigger value="all">All Tickets</TabsTrigger>}
        </TabsList>
        <TabsContent value="my"><TicketsList initial={JSON.parse(JSON.stringify(myTickets))} canCreate={true} /></TabsContent>
        <TabsContent value="assigned"><TicketsList initial={JSON.parse(JSON.stringify(assignedTickets))} canCreate={false} /></TabsContent>
        {isMgrPlus && <TabsContent value="all"><TicketsList initial={JSON.parse(JSON.stringify(allTickets))} canCreate={false} /></TabsContent>}
      </Tabs>
    </div>
  );
}
