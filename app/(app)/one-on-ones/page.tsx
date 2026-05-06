import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { OneOnOneList } from "@/components/one-on-ones/one-on-one-list";

export default async function OneOnOnesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [meetings, reports, manager] = await Promise.all([
    prisma.oneOnOne.findMany({
      where: { OR: [{ managerId: session.user.id }, { reportId: session.user.id }] },
      include: {
        manager: { select: { id: true, name: true, image: true } },
        report: { select: { id: true, name: true, image: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.user.findMany({ where: { managerId: session.user.id }, select: { id: true, name: true, image: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { managerId: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="1:1 Meetings"
        description="Schedule, prepare and reflect on 1:1 conversations with your manager and reports"
      />
      <OneOnOneList
        initial={JSON.parse(JSON.stringify(meetings))}
        reports={JSON.parse(JSON.stringify(reports))}
        currentUserId={session.user.id}
        userManagerId={manager?.managerId ?? null}
      />
    </div>
  );
}
