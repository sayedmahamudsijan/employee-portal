import { prisma } from "@/lib/prisma";
import { withRole, requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const reviewerId = searchParams.get("reviewerId");
  const cycleId = searchParams.get("cycleId");

  const reviews = await prisma.performanceReview.findMany({
    where: {
      ...(subjectId && { subjectId }),
      ...(reviewerId && { reviewerId }),
      ...(cycleId && { cycleId }),
    },
    include: {
      subject: { select: { id: true, name: true, image: true, jobTitle: true } },
      reviewer: { select: { id: true, name: true, image: true } },
      cycle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse(reviews);
}

export async function POST(request: Request) {
  const { session, error } = await withRole("MANAGER");
  if (error) return error;

  const body = await request.json();
  const { subjectId, period, cycleId } = body;

  if (!subjectId || !period) {
    return apiError("subjectId and period are required");
  }

  const review = await prisma.performanceReview.create({
    data: {
      subjectId,
      reviewerId: session!.user.id,
      period,
      cycleId: cycleId ?? null,
      ratings: {},
    },
  });

  return apiResponse(review);
}
