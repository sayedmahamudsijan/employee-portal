import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, image: true } },
      sprints: { include: { _count: { select: { tasks: true } } } },
      okrs: { include: { user: { select: { name: true, image: true } } } },
    },
  });
  if (!project) return apiError("Not found", 404);
  return apiResponse(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("MANAGER");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  for (const key of ["name", "code", "description", "client", "status", "color", "leadId"]) {
    if (key in body) data[key] = body[key];
  }
  if ("startDate" in body) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if ("endDate" in body) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if ("budget" in body) data.budget = body.budget ? Number(body.budget) : null;

  const project = await prisma.project.update({ where: { id }, data });
  return apiResponse(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("ADMIN");
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    return apiResponse({ ok: true });
  } catch {
    return apiError("Cannot delete project (has sprints?)", 500);
  }
}
