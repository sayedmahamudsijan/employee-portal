import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";

// GET /api/teams  — list teams the current user is a member of (or created)
export async function GET(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const teams = await prisma.team.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true, jobTitle: true, lastSeenAt: true } } },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return apiResponse(teams);
}

// POST /api/teams  — create a new team
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  try {
    const { name, description, link, emoji, memberIds = [] } = await req.json();
    if (!name?.trim()) return apiError("Name is required");

    // Collect unique user IDs (always include the creator)
    const allIds = Array.from(new Set([session.user.id, ...memberIds]));

    const team = await prisma.team.create({
      data: {
        name:        name.trim(),
        description: description?.trim() || null,
        link:        link?.trim() || null,
        emoji:       emoji || "👥",
        createdById: session.user.id,
        members: {
          create: allIds.map((uid: string) => ({
            userId: uid,
            role:   uid === session.user.id ? "OWNER" : "MEMBER",
          })),
        },
        // Post a system welcome message
        messages: {
          create: {
            userId:  session.user.id,
            content: `🎉 Team **${name.trim()}** was created!`,
            type:    "SYSTEM",
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true, jobTitle: true, lastSeenAt: true } } },
        },
        createdBy: { select: { id: true, name: true, image: true } },
        _count: { select: { messages: true } },
      },
    });

    logActivity({
      userId: session.user.id,
      action: "Created",
      entity: "Team",
      entityId: team.id,
      section: "Company",
      details: `Created team "${name.trim()}" with ${allIds.length} member(s)`,
      newValue: { name: name.trim(), memberCount: allIds.length },
    });

    return Response.json({ data: team, error: null, meta: null }, { status: 201 });
  } catch (e: any) {
    return apiError(e.message ?? "Failed to create team", 500);
  }
}
