import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [sprints, tasks, users] = await Promise.all([
    prisma.sprint.findMany({
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      take: 20,
    }),
    prisma.task.findMany({
      where: { assigneeId: session.user.id },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        sprint: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TasksClient
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      sprints={JSON.parse(JSON.stringify(sprints))}
      users={JSON.parse(JSON.stringify(users))}
      currentUserId={session.user.id}
    />
  );
}
