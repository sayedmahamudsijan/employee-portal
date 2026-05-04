import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await withRole("MANAGER");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const review = await prisma.performanceReview.findUnique({ where: { id } });
  if (!review) return apiError("Review not found", 404);
  if (review.reviewerId !== session!.user.id && session!.user.role === "MANAGER") {
    return apiError("Forbidden", 403);
  }

  const updated = await prisma.performanceReview.update({
    where: { id },
    data: {
      ...(body.ratings !== undefined && { ratings: body.ratings }),
      ...(body.comments !== undefined && { comments: body.comments }),
      ...(body.submitted !== undefined && { submitted: body.submitted }),
    },
  });

  if (body.submitted) {
    await createNotification({
      userId: review.subjectId,
      type: "REVIEW_SUBMITTED",
      message: "Your performance review has been submitted",
      link: "/performance",
    });
  }

  return apiResponse(updated);
}
