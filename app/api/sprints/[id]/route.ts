import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const sprint = await prisma.sprint.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!sprint) return apiError("Sprint not found", 404);
  return apiResponse(sprint);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, startDate, endDate, status, teamId } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (status !== undefined) data.status = status;
    if (teamId !== undefined) data.teamId = teamId;

    const sprint = await prisma.sprint.update({ where: { id }, data });
    return apiResponse(sprint);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Sprint not found", 404);
    return apiError("Failed to update sprint", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.sprint.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Sprint not found", 404);
    return apiError("Failed to delete sprint", 500);
  }
}
