import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      department: true,
      jobTitle: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
      createdAt: true,
    },
  });

  if (!user) return apiError("User not found", 404);
  return apiResponse(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  const isSelf = session.user.id === id;
  const isManager = roleOrder[session.user.role] >= roleOrder["MANAGER"];

  if (!isSelf && !isManager) return apiError("Forbidden", 403);

  try {
    const body = await req.json();
    const { name, role, status, department, jobTitle, managerId, image } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (image !== undefined) data.image = image;
    if (isManager) {
      if (role !== undefined) data.role = role;
      if (status !== undefined) data.status = status;
      if (department !== undefined) data.department = department;
      if (jobTitle !== undefined) data.jobTitle = jobTitle;
      if (managerId !== undefined) data.managerId = managerId;
    }

    const user = await prisma.user.update({ where: { id }, data });
    return apiResponse(user);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("User not found", 404);
    return apiError("Failed to update user", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  try {
    const user = await prisma.user.update({ where: { id }, data: { status: "INACTIVE" } });
    return apiResponse(user);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("User not found", 404);
    return apiError("Failed to delete user", 500);
  }
}
