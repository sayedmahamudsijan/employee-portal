import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const announcements = await prisma.announcement.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return apiResponse(announcements);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { title, body: content, pinned } = body;

    if (!title || !content) return apiError("title and body are required");

    const announcement = await prisma.announcement.create({
      data: { title, body: content, authorId: session.user.id, pinned: pinned ?? false },
    });

    const activeUsers = await prisma.user.findMany({
      where: { status: "ACTIVE", id: { not: session.user.id } },
      select: { id: true },
    });

    if (activeUsers.length > 0) {
      await prisma.notification.createMany({
        data: activeUsers.map((u) => ({
          userId: u.id,
          type: "ANNOUNCEMENT",
          message: `New announcement: "${title}"`,
          link: `/announcements/${announcement.id}`,
        })),
      });
    }

    return apiResponse(announcement);
  } catch {
    return apiError("Failed to create announcement", 500);
  }
}
