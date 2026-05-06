import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVEL } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { MentorshipBoard } from "@/components/mentorship/mentorship-board";

export default async function MentorshipPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;

  const [mine, all, users] = await Promise.all([
    prisma.mentorship.findMany({
      where: { OR: [{ mentorId: session.user.id }, { menteeId: session.user.id }] },
      include: {
        mentor: { select: { id: true, name: true, image: true, jobTitle: true } },
        mentee: { select: { id: true, name: true, image: true, jobTitle: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isMgrPlus
      ? prisma.mentorship.findMany({
          include: {
            mentor: { select: { id: true, name: true, image: true, jobTitle: true } },
            mentee: { select: { id: true, name: true, image: true, jobTitle: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, image: true, jobTitle: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Mentorship"
        description="Pair mentors with mentees · drive growth and knowledge sharing"
      />
      <MentorshipBoard
        mine={JSON.parse(JSON.stringify(mine))}
        all={JSON.parse(JSON.stringify(all))}
        users={JSON.parse(JSON.stringify(users))}
        currentUserId={session.user.id}
        canManage={isMgrPlus}
      />
    </div>
  );
}
