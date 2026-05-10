import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole, EXECUTIVE_ROLES, ROLE_LEVEL, canAssignRole, isExecutive } from "@/lib/server-auth";
import { generateEmployeeId } from "@/lib/employee-id";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";
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

        // ── Role-assignment access control ──────────────────────────────────
        // CEO / CMO / CTO: can assign any role (including other executives)
        // ADMIN:           can only assign roles strictly below ADMIN level
        if (!canAssignRole(session.user.role, newRole)) {
          return apiError(
            EXECUTIVE_ROLES.includes(newRole)
              ? `Only CEO, CMO, or CTO can assign the ${newRole} role.`
              : `You do not have permission to assign the ${newRole} role.`,
            403
          );
        }

        // ── Prevent ADMIN from changing role of another executive / admin ───
        // (Only executives can manage executives)
        if (!isExecutive(session.user.role)) {
          const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
          if (target && (EXECUTIVE_ROLES.includes(target.role) || target.role === "ADMIN")) {
            return apiError("Only CEO, CMO, or CTO can modify executive or admin accounts.", 403);
          }
        }

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
        // ADMIN cannot change status of executive or other admin accounts
        if (!isExecutive(session.user.role)) {
          const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
          if (target && (EXECUTIVE_ROLES.includes(target.role) || target.role === "ADMIN")) {
            return apiError("Only CEO, CMO, or CTO can modify executive or admin accounts.", 403);
          }
        }
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

    // Snapshot before update for logging
    let preUpdateSnapshot: { name: string; role: string; status: string } | null = null;
    if (isAdminLevel && (data.role !== undefined || data.status !== undefined)) {
      preUpdateSnapshot = await prisma.user.findUnique({
        where: { id },
        select: { name: true, role: true, status: true },
      }) as typeof preUpdateSnapshot;
    }

    const user = await prisma.user.update({ where: { id }, data });

    // Activity logging (fire-and-forget)
    if (isAdminLevel && data.role !== undefined && preUpdateSnapshot) {
      logActivity({
        userId: session.user.id,
        action: "Updated",
        entity: "User",
        entityId: id,
        section: "Admin",
        details: `Changed role of ${preUpdateSnapshot.name} from ${preUpdateSnapshot.role} to ${data.role}`,
        oldValue: { role: preUpdateSnapshot.role },
        newValue: { role: data.role },
      });
    } else if (isAdminLevel && data.status !== undefined && preUpdateSnapshot) {
      logActivity({
        userId: session.user.id,
        action: data.status === "ACTIVE" ? "Activated" : "Deactivated",
        entity: "User",
        entityId: id,
        section: "Admin",
        details: `${data.status === "ACTIVE" ? "Activated" : "Deactivated"} account of ${preUpdateSnapshot.name}`,
        oldValue: { status: preUpdateSnapshot.status },
        newValue: { status: data.status },
      });
    } else if (isSelf && (data.name !== undefined || data.image !== undefined)) {
      logActivity({
        userId: session.user.id,
        action: "Updated",
        entity: "User",
        entityId: id,
        section: "Account",
        details: `Updated profile${data.name ? ` — name: ${data.name}` : ""}`,
        newValue: { ...(data.name ? { name: data.name } : {}), ...(data.image ? { image: "updated" } : {}) },
      });
    }

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
    const target = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true, role: true } });
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
    logActivity({
      userId: session.user.id,
      action: "Deleted",
      entity: "User",
      entityId: id,
      section: "Admin",
      details: `Removed user account: ${target?.name ?? id} (${target?.email ?? ""}) [${target?.role ?? ""}]`,
      oldValue: { name: target?.name, email: target?.email, role: target?.role },
    });
    return apiResponse({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("User not found", 404);
    return apiError("Failed to remove user", 500);
  }
}
