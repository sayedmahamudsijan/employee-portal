import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

export async function GET() {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const sprints = await prisma.sprint.findMany({
    orderBy: { startDate: "desc" },
    take: 7,
    include: { tasks: { select: { status: true } } },
  });

  const velocity = sprints
    .slice(0, 6)
    .reverse()
    .map((s) => ({
      name: s.name,
      completed: s.tasks.filter((t) => t.status === "DONE").length,
      total: s.tasks.length,
    }));

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");
  const statusBreakdown = activeSprint
    ? {
        TODO: activeSprint.tasks.filter((t) => t.status === "TODO").length,
        IN_PROGRESS: activeSprint.tasks.filter((t) => t.status === "IN_PROGRESS").length,
        IN_REVIEW: activeSprint.tasks.filter((t) => t.status === "IN_REVIEW").length,
        DONE: activeSprint.tasks.filter((t) => t.status === "DONE").length,
        BLOCKED: activeSprint.tasks.filter((t) => t.status === "BLOCKED").length,
      }
    : null;

  const overdueTasks = await prisma.task.count({
    where: { dueDate: { lt: new Date() }, status: { not: "DONE" } },
  });

  return apiResponse({ velocity, statusBreakdown, overdueTasks, activeSprint });
}
