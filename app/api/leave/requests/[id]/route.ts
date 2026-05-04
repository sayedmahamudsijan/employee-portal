import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, image: true, managerId: true } } },
  });

  if (!request) return apiError("Leave request not found", 404);

  const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  const isAdmin = roleOrder[session.user.role] >= roleOrder["ADMIN"];
  const isOwner = request.userId === session.user.id;
  const isManager = session.user.id === request.user.managerId;

  if (!isOwner && !isAdmin && !isManager) return apiError("Forbidden", 403);

  return apiResponse(request);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  try {
    const body = await req.json();
    const { status, reviewNote } = body;

    if (!status) return apiError("status is required");

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, managerId: true } } },
    });
    if (!request) return apiError("Leave request not found", 404);

    const roleOrder: Record<string, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
    const isAdmin = roleOrder[session.user.role] >= roleOrder["ADMIN"];
    const isOwner = request.userId === session.user.id;
    const isManager = session.user.id === request.user.managerId || roleOrder[session.user.role] >= roleOrder["MANAGER"];

    if (status === "CANCELLED") {
      if (!isOwner) return apiError("Only the owner can cancel a request", 403);
      if (request.status !== "PENDING") return apiError("Only pending requests can be cancelled");
    } else if (status === "APPROVED" || status === "REJECTED") {
      if (!isAdmin && !isManager) return apiError("Forbidden", 403);
      if (request.status !== "PENDING") return apiError("Request is no longer pending");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewedBy: session.user.id, reviewNote },
    });

    if (status === "APPROVED" && request.type !== "UNPAID") {
      const key = request.type.toLowerCase() as string;
      await prisma.leaveBalance.update({
        where: { userId: request.userId },
        data: { [key]: { decrement: request.days } },
      });
    }

    if (status === "APPROVED" || status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: "LEAVE_UPDATE",
          message: `Your leave request has been ${status.toLowerCase()}`,
          link: `/leave/requests/${id}`,
        },
      });
    }

    return apiResponse(updated);
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Leave request not found", 404);
    return apiError("Failed to update leave request", 500);
  }
}
