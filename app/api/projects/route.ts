import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const projects = await prisma.project.findMany({
    include: {
      lead: { select: { id: true, name: true, image: true } },
      sprints: { select: { id: true, name: true, status: true } },
      _count: { select: { sprints: true, okrs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return apiResponse(projects);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const body = await req.json();
  const { name, code, description, client, status, startDate, endDate, budget, currency, leadId, color } = body;
  if (!name) return apiError("Name required");

  try {
    const project = await prisma.project.create({
      data: {
        name,
        code: code ?? null,
        description: description ?? null,
        client: client ?? null,
        status: status ?? "PLANNING",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? Number(budget) : null,
        currency: currency ?? "BDT",
        leadId: leadId ?? null,
        color: color ?? "#6366f1",
      },
    });
    await logActivity({
      userId: session.user.id,
      action: "create",
      entity: "project",
      entityId: project.id,
      details: `Created project "${name}"`,
    });
    return apiResponse(project);
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Project code already exists", 409);
    return apiError("Failed", 500);
  }
}
