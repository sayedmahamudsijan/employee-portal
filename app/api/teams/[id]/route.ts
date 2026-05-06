import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

async function getTeamAndMembership(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, image: true, jobTitle: true, department: true, lastSeenAt: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { messages: true } },
    },
  });
  if (!team) return { team: null, member: null };
  const member = team.members.find((m) => m.userId === userId) ?? null;
  return { team, member };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const { team, member } = await getTeamAndMembership(id, session.user.id);
  if (!team) return apiError("Team not found", 404);
  if (!member && !isAdmin(session.user.role)) return apiError("Forbidden", 403);

  return apiResponse(team);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const { team, member } = await getTeamAndMembership(id, session.user.id);
  if (!team) return apiError("Team not found", 404);
  if (member?.role !== "OWNER" && !isAdmin(session.user.role)) return apiError("Forbidden", 403);

  const { name, description, link, emoji } = await req.json();
  const updated = await prisma.team.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name:        name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(link        !== undefined && { link:        link?.trim() || null }),
      ...(emoji       !== undefined && { emoji }),
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true, jobTitle: true, lastSeenAt: true } } } },
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });

  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const { team, member } = await getTeamAndMembership(id, session.user.id);
  if (!team) return apiError("Team not found", 404);
  if (member?.role !== "OWNER" && !isAdmin(session.user.role)) return apiError("Forbidden", 403);

  await prisma.team.delete({ where: { id } });
  return apiResponse({ deleted: true });
}
