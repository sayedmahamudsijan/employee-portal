import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Your activity and updates" />
      <NotificationList
        notifications={JSON.parse(JSON.stringify(notifications))}
        userId={session.user.id}
      />
    </div>
  );
}
