import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? session!.user.id;
  const quarter = searchParams.get("quarter");
  const year = searchParams.get("year");

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      ...(quarter && { quarter }),
      ...(year && { year: parseInt(year) }),
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse(goals);
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { title, description, quarter, year, dueDate } = body;

  if (!title || !quarter || !year) {
    return apiError("title, quarter and year are required");
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session!.user.id,
      title,
      description,
      quarter,
      year: parseInt(year),
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
  });

  return apiResponse(goal);
}
