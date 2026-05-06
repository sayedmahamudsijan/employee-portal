import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TeamChat } from "@/components/teams/team-chat";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, jobTitle: true, department: true, lastSeenAt: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!team) redirect("/teams");

  const isMember = team.members.some((m) => m.userId === session.user.id);
  if (!isMember) redirect("/teams");

  // Last 60 messages
  const messages = await prisma.teamMessage.findMany({
    where: { teamId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // All active users for add-member picker
  const allUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true, image: true, jobTitle: true },
    orderBy: { name: "asc" },
  });

  return (
    <TeamChat
      team={JSON.parse(JSON.stringify(team))}
      initialMessages={JSON.parse(JSON.stringify(messages.reverse()))}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      allUsers={allUsers}
    />
  );
}
