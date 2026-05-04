import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

export async function GET() {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      tasks: {
        where: { sprint: { status: "ACTIVE" } },
        select: { status: true, estimatedHrs: true, loggedHrs: true },
      },
    },
  });

  const workload = users
    .map((u) => ({
      name: u.name.split(" ")[0],
      tasks: u.tasks.length,
      logged: u.tasks.reduce((s, t) => s + t.loggedHrs, 0),
      estimated: u.tasks.reduce((s, t) => s + (t.estimatedHrs ?? 0), 0),
    }))
    .filter((u) => u.tasks > 0);

  return apiResponse(workload);
}
