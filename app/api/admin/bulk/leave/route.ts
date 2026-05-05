import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

/**
 * Bulk approve / reject leave requests.
 * Body: { ids: string[], action: "approve" | "reject", note?: string }
 */
export async function POST(req: NextRequest) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const { ids, action, note } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return apiError("ids array is required");
  if (!["approve", "reject"].includes(action)) return apiError("Invalid action");

  const status = action === "approve" ? "APPROVED" : "REJECTED";
  const requests = await prisma.leaveRequest.findMany({
    where: { id: { in: ids }, status: "PENDING" },
    include: { user: { select: { id: true, name: true } } },
  });

  if (requests.length === 0) return apiError("No pending requests found", 404);

  await prisma.leaveRequest.updateMany({
    where: { id: { in: requests.map((r) => r.id) } },
    data: { status, reviewedBy: session.user.id, reviewNote: note ?? null },
  });

  // Notify each user
  await Promise.all(
    requests.map((r) =>
      createNotification({
        userId: r.userId,
        type: "leave",
        message: `Your ${r.type.toLowerCase()} leave was ${status.toLowerCase()}`,
        link: "/leave",
      })
    )
  );

  await logActivity({
    userId: session.user.id,
    action: `bulk-${action}`,
    entity: "leave-request",
    details: `${action === "approve" ? "Approved" : "Rejected"} ${requests.length} leave request(s)`,
  });

  return apiResponse({ count: requests.length });
}
