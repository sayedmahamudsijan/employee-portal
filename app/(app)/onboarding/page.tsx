import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { OnboardingChecklistView } from "@/components/onboarding/checklist-view";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let checklist: any = null;
  try {
    checklist = await prisma.onboardingChecklist.findUnique({
      where: { userId: session.user.id },
    });
  } catch {}

  return (
    <div>
      <PageHeader
        title="Onboarding"
        description="Welcome! Complete these steps to get fully set up."
      />
      <OnboardingChecklistView userId={session.user.id} initial={JSON.parse(JSON.stringify(checklist))} />
    </div>
  );
}
