import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/teams/[id]/messages?cursor=<id>&limit=50
// Also marks any unread TEAM_MESSAGE notifications for this team as read.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const isMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });
  if (!isMember) return apiError("Forbidden", 403);

  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "60"), 100);

  const [messages] = await Promise.all([
    prisma.teamMessage.findMany({
      where:   { teamId: id, ...(cursor ? { id: { lt: cursor } } : {}) },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take:    limit,
    }),
    // Mark the user's unread team-message notifications for this team as read
    prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type:   "TEAM_MESSAGE",
        link:   `/teams/${id}`,
        read:   false,
      },
      data: { read: true },
    }),
  ]);

  return apiResponse(messages.reverse());
}

// POST /api/teams/[id]/messages  — send a message or status update
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;

  // Fetch team + all members in one query
  const team = await prisma.team.findUnique({
    where:   { id },
    include: { members: { select: { userId: true } } },
  });
  if (!team) return apiError("Team not found", 404);

  const isMember = team.members.some((m) => m.userId === session.user.id);
  if (!isMember) return apiError("Forbidden", 403);

  const { content, type = "TEXT" } = await req.json();
  if (!content?.trim()) return apiError("Content required");

  const message = await prisma.teamMessage.create({
    data:    { teamId: id, userId: session.user.id, content: content.trim(), type },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  // Bump team updatedAt for recency sorting
  await prisma.team.update({ where: { id }, data: { updatedAt: new Date() } });

  // ── Notify other team members ──────────────────────────────────────────────
  // Skip SYSTEM messages (join/leave etc.) — only TEXT and STATUS warrant a notif
  if (type === "TEXT" || type === "STATUS") {
    const senderName = session.user.name ?? "Someone";
    const notifLink  = `/teams/${id}`;
    const otherIds   = team.members
      .map((m) => m.userId)
      .filter((uid) => uid !== session.user.id);

    if (otherIds.length > 0) {
      // Find existing unread TEAM_MESSAGE notifications for this team for each member
      const existing = await prisma.notification.findMany({
        where: { userId: { in: otherIds }, type: "TEAM_MESSAGE", link: notifLink, read: false },
        select: { id: true, userId: true },
      });

      const existingByUser = new Map(existing.map((n) => [n.userId, n.id]));
      const toUpdate = existing.map((n) => n.id);
      const toCreate = otherIds.filter((uid) => !existingByUser.has(uid));

      // Batch: update existing (refresh timestamp + message) OR create new
      await Promise.all([
        toUpdate.length > 0
          ? prisma.notification.updateMany({
              where: { id: { in: toUpdate } },
              data: {
                message:   `New messages in ${team.name}`,
                createdAt: new Date(),
                read:      false,
              },
            })
          : Promise.resolve(),

        toCreate.length > 0
          ? prisma.notification.createMany({
              data: toCreate.map((userId) => ({
                userId,
                type:    "TEAM_MESSAGE",
                message: type === "STATUS"
                  ? `${senderName} posted a status in ${team.name}`
                  : `${senderName} sent a message in ${team.name}`,
                link:    notifLink,
              })),
            })
          : Promise.resolve(),
      ]);
    }
  }

  return Response.json({ data: message, error: null, meta: null }, { status: 201 });
}
