import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  for (const key of ["assetTag", "name", "category", "serialNumber", "status", "notes"]) {
    if (key in body) data[key] = body[key];
  }
  if ("purchaseDate" in body) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
  if ("purchaseCost" in body) data.purchaseCost = body.purchaseCost ? Number(body.purchaseCost) : null;
  if ("warrantyEnd" in body) data.warrantyEnd = body.warrantyEnd ? new Date(body.warrantyEnd) : null;

  const asset = await prisma.asset.update({ where: { id }, data });
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "asset",
    entityId: id,
    details: `Updated asset ${asset.assetTag}`,
  });
  return apiResponse(asset);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { id } = await params;
  try {
    const asset = await prisma.asset.delete({ where: { id } });
    await logActivity({
      userId: session.user.id,
      action: "delete",
      entity: "asset",
      entityId: id,
      details: `Deleted asset ${asset.assetTag}`,
    });
    return apiResponse({ ok: true });
  } catch {
    return apiError("Failed to delete asset", 500);
  }
}
