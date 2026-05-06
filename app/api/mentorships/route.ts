import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const scope = req.nextUrl.searchParams.get("scope") ?? "me";
  const where: any = scope === "all"
    ? {}
    : { OR: [{ mentorId: session.user.id }, { menteeId: session.user.id }] };

  const items = await prisma.mentorship.findMany({
    where,
    include: {
      mentor: { select: { id: true, name: true, image: true, jobTitle: true } },
      mentee: { select: { id: true, name: true, image: true, jobTitle: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return apiResponse(items);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const { mentorId, menteeId, focusArea, goals } = await req.json();
  if (!mentorId || !menteeId) return apiError("Mentor and mentee required");
  if (mentorId === menteeId) return apiError("Mentor and mentee must be different");

  try {
    const m = await prisma.mentorship.create({
      data: { mentorId, menteeId, focusArea: focusArea ?? null, goals: goals ?? null },
      include: {
        mentor: { select: { id: true, name: true, image: true, jobTitle: true } },
        mentee: { select: { id: true, name: true, image: true, jobTitle: true } },
      },
    });
    await Promise.all([
      createNotification({ userId: mentorId, type: "mentorship", message: `You've been paired as a mentor for ${m.mentee.name}`, link: "/mentorship" }),
      createNotification({ userId: menteeId, type: "mentorship", message: `${m.mentor.name} is now your mentor`, link: "/mentorship" }),
    ]);
    await logActivity({
      userId: session.user.id,
      action: "create",
      entity: "mentorship",
      entityId: m.id,
      details: `Paired ${m.mentor.name} ↔ ${m.mentee.name}`,
    });
    return apiResponse(m);
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Pairing already exists", 409);
    return apiError("Failed", 500);
  }
}
