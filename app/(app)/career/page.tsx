import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CareerProfileView } from "@/components/career/career-profile-view";

export default async function CareerPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [profile, levels] = await Promise.all([
    prisma.careerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.careerLevel.findMany({ orderBy: [{ track: "asc" }, { level: "asc" }] }),
  ]);

  return (
    <div>
      <PageHeader
        title="Career Path"
        description="See where you are, where you're going, and how to get there"
      />
      <CareerProfileView
        initial={JSON.parse(JSON.stringify(profile))}
        levels={JSON.parse(JSON.stringify(levels))}
        userId={session.user.id}
      />
    </div>
  );
}
