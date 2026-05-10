import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const { id } = await params;
  const body = await req.json();
  const { status, rejectionReason } = body;
  if (!["APPROVED", "REJECTED", "PAID"].includes(status)) return apiError("Invalid status");

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return apiError("Not found", 404);

  const data: any = { status, approverId: session.user.id, approvedAt: new Date() };
  if (status === "REJECTED") data.rejectionReason = rejectionReason ?? null;
  if (status === "PAID") data.paidAt = new Date();

  const updated = await prisma.expense.update({ where: { id }, data });

  await prisma.notification.create({
    data: {
      userId: expense.userId,
      type: "expense",
      message: `Your expense "${expense.description.slice(0, 60)}" was ${status.toLowerCase()}`,
      link: "/expenses",
    },
  });

  logActivity({
    userId: session.user.id,
    action: status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Updated",
    entity: "Expense",
    entityId: id,
    section: "Manage",
    details: `${status} expense by ${expense.userId}: ${expense.amount} ${expense.currency} — ${expense.description.slice(0, 60)}`,
    oldValue: { status: expense.status },
    newValue: { status, ...(rejectionReason ? { rejectionReason } : {}) },
  });
  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;
  const { id } = await params;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return apiError("Not found", 404);
  if (expense.userId !== session.user.id) return apiError("Forbidden", 403);
  if (expense.status !== "PENDING") return apiError("Cannot delete after review", 400);

  await prisma.expense.delete({ where: { id } });
  return apiResponse({ ok: true });
}
