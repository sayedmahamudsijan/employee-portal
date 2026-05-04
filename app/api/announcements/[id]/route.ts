import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const { id } = await params;
  try {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return apiError("Announcement not found", 404);

    const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
    const isAdmin = roleOrder[session.user.role] >= roleOrder["ADMIN"];
    const isOwner = existing.authorId === session.user.id;

    if (!isAdmin && !isOwner) return apiError("Forbidden", 403);

    const body = await req.json();
    const { title, body: content, pinned } = body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.body = content;
    if (pinned !== undefined) data.pinned = pinned;

    const announcement = await prisma.announcement.update({ where: { id }, data });
    return apiResponse(announcement);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Announcement not found", 404);
    return apiError("Failed to update announcement", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const { id } = await params;
  try {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return apiError("Announcement not found", 404);

    const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
    const isAdmin = roleOrder[session.user.role] >= roleOrder["ADMIN"];
    const isOwner = existing.authorId === session.user.id;

    if (!isAdmin && !isOwner) return apiError("Forbidden", 403);

    await prisma.announcement.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Announcement not found", 404);
    return apiError("Failed to delete announcement", 500);
  }
}
