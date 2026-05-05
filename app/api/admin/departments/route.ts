import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole, requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return apiResponse(departments);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const body = await req.json();
  const { name, code, description, headId } = body;
  if (!name) return apiError("Name is required");

  try {
    const dept = await prisma.department.create({
      data: { name, code: code ?? null, description: description ?? null, headId: headId ?? null },
    });
    await logActivity({
      userId: session.user.id,
      action: "create",
      entity: "department",
      entityId: dept.id,
      details: `Created department "${name}"`,
    });
    return apiResponse(dept);
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Department name or code already exists", 409);
    return apiError("Failed to create department", 500);
  }
}
