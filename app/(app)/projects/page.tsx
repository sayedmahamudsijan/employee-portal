import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVEL } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectsBoard } from "@/components/projects/projects-board";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      include: {
        lead: { select: { id: true, name: true, image: true } },
        _count: { select: { sprints: true, okrs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Group sprints into projects with budget, timeline and ownership"
      />
      <ProjectsBoard
        initial={JSON.parse(JSON.stringify(projects))}
        users={JSON.parse(JSON.stringify(users))}
        canEdit={isMgrPlus}
      />
    </div>
  );
}
