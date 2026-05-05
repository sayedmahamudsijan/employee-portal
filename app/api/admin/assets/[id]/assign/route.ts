import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

/** Assign an asset to a user, or return it (when userId is null) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id: assetId } = await params;
  const { userId, notes } = await req.json();

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return apiError("Asset not found", 404);

  // close any open assignments first
  await prisma.assetAssignment.updateMany({
    where: { assetId, returnedAt: null },
    data: { returnedAt: new Date() },
  });

  if (!userId) {
    // returning the asset
    await prisma.asset.update({ where: { id: assetId }, data: { status: "AVAILABLE" } });
    await logActivity({
      userId: session.user.id,
      action: "return",
      entity: "asset",
      entityId: assetId,
      details: `Asset ${asset.assetTag} returned`,
    });
    return apiResponse({ ok: true, returned: true });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return apiError("User not found", 404);

  const assignment = await prisma.assetAssignment.create({
    data: { assetId, userId, notes: notes ?? null },
    include: { asset: true, user: { select: { name: true, email: true } } },
  });

  await prisma.asset.update({ where: { id: assetId }, data: { status: "ASSIGNED" } });

  await createNotification({
    userId,
    type: "asset",
    message: `${asset.name} (${asset.assetTag}) has been assigned to you`,
    link: "/settings",
  });

  await logActivity({
    userId: session.user.id,
    action: "assign",
    entity: "asset",
    entityId: assetId,
    details: `Assigned ${asset.assetTag} to ${user.name}`,
  });

  return apiResponse(assignment);
}
