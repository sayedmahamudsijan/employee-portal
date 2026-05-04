import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { CreateAnnouncementButton } from "@/components/announcements/create-announcement-button";

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const announcements = await prisma.announcement.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const canPost = canAccess(session.user.role, "MANAGER");

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Company updates and notices"
        action={canPost ? <CreateAnnouncementButton /> : undefined}
      />
      <AnnouncementFeed announcements={JSON.parse(JSON.stringify(announcements))} canManage={canPost} />
    </div>
  );
}
