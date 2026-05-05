import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { KudosFeed } from "@/components/kudos/kudos-feed";

export default async function KudosPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // graceful: if Kudos table doesn't exist yet, fall back to empty
  let kudos: any[] = [];
  try {
    kudos = await prisma.kudos.findMany({
      where: { isPublic: true },
      include: {
        from: { select: { id: true, name: true, image: true } },
        to: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {}

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", id: { not: session.user.id } },
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Kudos"
        description="Recognise teammates for great work — celebrate wins, big and small"
      />
      <KudosFeed
        initial={JSON.parse(JSON.stringify(kudos))}
        users={JSON.parse(JSON.stringify(users))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
