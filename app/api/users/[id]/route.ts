import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole, EXECUTIVE_ROLES, ROLE_LEVEL } from "@/lib/server-auth";
import { generateEmployeeId } from "@/lib/employee-id";
import { apiResponse, apiError } from "@/lib/utils";
import type { Role } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true, role: true,
      status: true, department: true, jobTitle: true, managerId: true,
      employeeId: true,
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
  const isSelf = session.user.id === id;
  const isManager = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL["MANAGER"];
  const isAdminLevel = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL["ADMIN"];

  if (!isSelf && !isManager) return apiError("Forbidden", 403);

  try {
    const body = await req.json();
    const { name, role, status, department, jobTitle, managerId, image, employeeId } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (image !== undefined) data.image = image;

    if (isManager) {
      if (department !== undefined) data.department = department;
      if (jobTitle !== undefined) data.jobTitle = jobTitle;
      if (managerId !== undefined) data.managerId = managerId;
    }

    if (isAdminLevel) {
      if (employeeId !== undefined) data.employeeId = employeeId || null;

      if (role !== undefined) {
        const newRole = role as Role;
        // Enforce max-1 for executive roles
        if (EXECUTIVE_ROLES.includes(newRole)) {
          const existing = await prisma.user.findFirst({
            where: { role: newRole, id: { not: id } },
          });
          if (existing) {
            return apiError(`There can only be one ${newRole}. Remove the current ${newRole} first.`, 409);
          }
        }
        data.role = newRole;
      }

      if (status !== undefined) {
        data.status = status;
        // Auto-assign employeeId when activating for the first time
        if (status === "ACTIVE") {
          const target = await prisma.user.findUnique({ where: { id }, select: { employeeId: true } });
          if (!target?.employeeId && employeeId === undefined) {
            data.employeeId = await generateEmployeeId();
          }
        }
      }
    }

    const user = await prisma.user.update({ where: { id }, data });
    return apiResponse(user);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("User not found", 404);
    if (e.code === "P2002") return apiError("Employee ID already in use", 409);
    return apiError("Failed to update user", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  if (id === session.user.id) return apiError("Cannot remove your own account", 400);

  try {
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.activityLog.deleteMany({ where: { userId: id } }),
      prisma.workLog.deleteMany({ where: { userId: id } }),
      prisma.leaveRequest.deleteMany({ where: { userId: id } }),
      prisma.leaveBalance.deleteMany({ where: { userId: id } }),
      prisma.goal.deleteMany({ where: { userId: id } }),
      prisma.performanceReview.deleteMany({ where: { OR: [{ subjectId: id }, { reviewerId: id }] } }),
      prisma.announcement.deleteMany({ where: { authorId: id } }),
      prisma.document.deleteMany({ where: { uploadedBy: id } }),
      prisma.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: session.user.id } }),
      prisma.user.update({ where: { id }, data: { managerId: null } }),
      prisma.user.updateMany({ where: { managerId: id }, data: { managerId: null } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return apiResponse({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("User not found", 404);
    return apiError("Failed to remove user", 500);
  }
}
