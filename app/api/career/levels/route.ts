import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  const track = req.nextUrl.searchParams.get("track");
  const where = track ? { track } : {};
  const levels = await prisma.careerLevel.findMany({ where, orderBy: [{ track: "asc" }, { level: "asc" }] });
  return apiResponse(levels);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;
  const { track, level, title, description, expectations, minSalary, maxSalary, currency } = await req.json();
  if (!track || !level || !title) return apiError("Track, level, title required");
  try {
    const cl = await prisma.careerLevel.create({
      data: {
        track, level: Number(level), title,
        description: description ?? null,
        expectations: expectations ?? [],
        minSalary: minSalary ? Number(minSalary) : null,
        maxSalary: maxSalary ? Number(maxSalary) : null,
        currency: currency ?? "BDT",
      },
    });
    await logActivity({
      userId: session.user.id,
      action: "create",
      entity: "career-level",
      entityId: cl.id,
      details: `Added ${track} L${level}: ${title}`,
    });
    return apiResponse(cl);
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Level already exists for this track", 409);
    return apiError("Failed", 500);
  }
}
