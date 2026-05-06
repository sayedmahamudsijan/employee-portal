import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

// DELETE /api/teams/[id]/members/[userId]  — remove a member (or leave a team)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id, userId } = await params;
  const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
  if (!team) return apiError("Team not found", 404);

  const callerMember = team.members.find((m) => m.userId === session.user.id);
  const isSelf       = userId === session.user.id;

  // Allow: owner removing anyone, member removing self, admin doing anything
  if (!isSelf && callerMember?.role !== "OWNER" && !isAdmin(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  await prisma.teamMember.deleteMany({ where: { teamId: id, userId } });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const msg  = isSelf ? `👋 ${user?.name} left the team` : `➖ ${user?.name} was removed from the team`;
  await prisma.teamMessage.create({
    data: { teamId: id, userId: session.user.id, content: msg, type: "SYSTEM" },
  });

  return apiResponse({ removed: true });
}
