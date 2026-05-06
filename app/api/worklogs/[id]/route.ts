import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ROLE_LEVEL } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

const canApprove = (role: string) => ROLE_LEVEL[role] >= ROLE_LEVEL["MANAGER"];
const isAdminRole = (role: string) => ROLE_LEVEL[role] >= ROLE_LEVEL["ADMIN"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const existing = await prisma.workLog.findUnique({ where: { id } });
    if (!existing) return apiError("Worklog not found", 404);

    const isOwner   = existing.userId === session.user.id;
    const approver  = canApprove(session.user.role);
    const adminUser = isAdminRole(session.user.role);

    if (!isOwner && !approver) return apiError("Forbidden", 403);

    const body = await req.json();
    const { date, hours, description, status, rejectionReason } = body;

    // ── Status transition logic ──────────────────────────────────────────────
    if (status !== undefined) {
      const current = existing.status;

      // Employee: DRAFT → SUBMITTED  (submit for review)
      if (status === "SUBMITTED" && isOwner && current === "DRAFT") {
        const updated = await prisma.workLog.update({ where: { id }, data: { status: "SUBMITTED" } });
        return apiResponse(updated);
      }

      // Employee: REJECTED → DRAFT  (revise and resubmit)
      if (status === "DRAFT" && isOwner && current === "REJECTED") {
        const updated = await prisma.workLog.update({
          where: { id },
          data: { status: "DRAFT", rejectionReason: null, approvedById: null, approvedAt: null },
        });
        return apiResponse(updated);
      }

      // Manager/Admin: SUBMITTED → APPROVED
      if (status === "APPROVED" && approver && current === "SUBMITTED") {
        const updated = await prisma.workLog.update({
          where: { id },
          data: { status: "APPROVED", approvedById: session.user.id, approvedAt: new Date(), rejectionReason: null },
        });
        return apiResponse(updated);
      }

      // Manager/Admin: SUBMITTED → REJECTED  (with optional reason)
      if (status === "REJECTED" && approver && current === "SUBMITTED") {
        const updated = await prisma.workLog.update({
          where: { id },
          data: { status: "REJECTED", rejectionReason: rejectionReason ?? null, approvedById: session.user.id, approvedAt: new Date() },
        });
        return apiResponse(updated);
      }

      // Admin: APPROVED → DRAFT  (undo approval)
      if (status === "DRAFT" && adminUser && current === "APPROVED") {
        const updated = await prisma.workLog.update({
          where: { id },
          data: { status: "DRAFT", approvedById: null, approvedAt: null, rejectionReason: null },
        });
        return apiResponse(updated);
      }

      return apiError(`Invalid status transition: ${current} → ${status}`, 400);
    }

    // ── Field edits ──────────────────────────────────────────────────────────
    // Only allow edits when DRAFT or REJECTED (owner) or Admin (any status)
    if (!isOwner && !adminUser) return apiError("Forbidden", 403);
    if (isOwner && !adminUser && existing.status === "SUBMITTED") {
      return apiError("Cannot edit a submitted log. Retract it first.", 400);
    }
    if (isOwner && !adminUser && existing.status === "APPROVED") {
      return apiError("Cannot edit an approved log.", 400);
    }

    const data: Record<string, unknown> = {};
    if (date        !== undefined) data.date        = new Date(date);
    if (hours       !== undefined) data.hours       = hours;
    if (description !== undefined) data.description = description;

    if (hours !== undefined && existing.taskId) {
      const diff = (hours as number) - existing.hours;
      await prisma.task.update({ where: { id: existing.taskId }, data: { loggedHrs: { increment: diff } } });
    }

    const worklog = await prisma.workLog.update({ where: { id }, data });
    return apiResponse(worklog);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Worklog not found", 404);
    return apiError("Failed to update worklog", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const existing = await prisma.workLog.findUnique({ where: { id } });
    if (!existing) return apiError("Worklog not found", 404);

    const isOwner   = existing.userId === session.user.id;
    const approver  = canApprove(session.user.role);

    if (!isOwner && !approver) return apiError("Forbidden", 403);

    // Only DRAFT logs can be deleted by the owner
    if (isOwner && !approver && existing.status !== "DRAFT") {
      return apiError("Only DRAFT logs can be deleted. Retract the submission first.", 400);
    }

    if (existing.taskId) {
      await prisma.task.update({ where: { id: existing.taskId }, data: { loggedHrs: { decrement: existing.hours } } });
    }

    await prisma.workLog.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Worklog not found", 404);
    return apiError("Failed to delete worklog", 500);
  }
}
