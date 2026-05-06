import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamsList } from "@/components/teams/teams-list";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, jobTitle: true, lastSeenAt: true } },
        },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // All active users for member picker
  const allUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true, image: true, jobTitle: true, department: true },
    orderBy: { name: "asc" },
  });

  return (
    <TeamsList
      initialTeams={JSON.parse(JSON.stringify(teams))}
      allUsers={allUsers}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
