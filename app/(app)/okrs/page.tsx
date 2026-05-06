import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { OKRsBoard } from "@/components/okrs/okrs-board";
import { getCurrentQuarter } from "@/lib/utils";

export default async function OKRsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const year = new Date().getFullYear();
  const quarter = getCurrentQuarter();

  const [okrs, projects] = await Promise.all([
    prisma.oKR.findMany({
      where: { userId: session.user.id },
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    }),
    prisma.project.findMany({ select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="OKRs"
        description="Set ambitious objectives and measurable key results"
      />
      <OKRsBoard
        initial={JSON.parse(JSON.stringify(okrs))}
        projects={JSON.parse(JSON.stringify(projects))}
        currentQuarter={quarter}
        currentYear={year}
      />
    </div>
  );
}
