import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentQuarter } from "@/lib/utils";
import { GoalsClient } from "@/components/goals/goals-client";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const year = new Date().getFullYear();
  const quarter = getCurrentQuarter();

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id, year, quarter },
    orderBy: { createdAt: "desc" },
  });

  return (
    <GoalsClient
      initialGoals={JSON.parse(JSON.stringify(goals))}
      userId={session.user.id}
      role={session.user.role}
      defaultQuarter={quarter}
      defaultYear={year}
    />
  );
}
