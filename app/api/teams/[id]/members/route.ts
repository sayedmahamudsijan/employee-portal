import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

// POST /api/teams/[id]/members  — add one or more members
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!team) return apiError("Team not found", 404);

  const member = team.members.find((m) => m.userId === session.user.id);
  if (member?.role !== "OWNER" && !isAdmin(session.user.role)) return apiError("Forbidden", 403);

  const { userIds } = await req.json();
  if (!Array.isArray(userIds) || userIds.length === 0) return apiError("userIds required");

  // Filter out already-members
  const existing = new Set(team.members.map((m) => m.userId));
  const toAdd = (userIds as string[]).filter((uid) => !existing.has(uid));

  if (toAdd.length === 0) return apiResponse({ added: 0 });

  await prisma.teamMember.createMany({
    data: toAdd.map((uid) => ({ teamId: id, userId: uid, role: "MEMBER" })),
  });

  // System message
  const users = await prisma.user.findMany({ where: { id: { in: toAdd } }, select: { name: true } });
  const names = users.map((u) => u.name).join(", ");
  await prisma.teamMessage.create({
    data: { teamId: id, userId: session.user.id, content: `➕ ${names} joined the team`, type: "SYSTEM" },
  });

  return apiResponse({ added: toAdd.length });
}
