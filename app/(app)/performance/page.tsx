import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyReviews } from "@/components/performance/my-reviews";
import { TeamReviews } from "@/components/performance/team-reviews";

export default async function PerformancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isManager = canAccess(session.user.role, "MANAGER");

  const [myReviews, reports] = await Promise.all([
    prisma.performanceReview.findMany({
      where: { subjectId: session.user.id, submitted: true },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
        cycle: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    isManager
      ? prisma.user.findMany({
          where: { managerId: session.user.id, status: "ACTIVE" },
          select: {
            id: true, name: true, image: true, jobTitle: true,
            reviews: {
              where: { reviewerId: session.user.id },
              select: { id: true, submitted: true, period: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Performance" description="Track reviews and goals progress" />

      <Tabs defaultValue={isManager ? "team" : "mine"}>
        <TabsList className="mb-6">
          <TabsTrigger value="mine">My Reviews</TabsTrigger>
          {isManager && <TabsTrigger value="team">My Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="mine">
          <MyReviews reviews={JSON.parse(JSON.stringify(myReviews))} />
        </TabsContent>

        {isManager && (
          <TabsContent value="team">
            <TeamReviews reports={JSON.parse(JSON.stringify(reports))} reviewerId={session.user.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
