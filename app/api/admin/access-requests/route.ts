import { withRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/admin/access-requests
 * Returns all access requests, newest first.
 * Admin-only.
 */
export async function GET() {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const requests = await prisma.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return apiResponse(requests, { pendingCount });
}
