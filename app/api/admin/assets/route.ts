import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole, requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const assets = await prisma.asset.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(category && { category }),
    },
    include: {
      assignments: {
        where: { returnedAt: null },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse(assets);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const body = await req.json();
  const { assetTag, name, category, serialNumber, purchaseDate, purchaseCost, warrantyEnd, notes } = body;
  if (!assetTag || !name || !category) return apiError("Asset tag, name and category are required");

  try {
    const asset = await prisma.asset.create({
      data: {
        assetTag, name, category,
        serialNumber: serialNumber ?? null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost ? Number(purchaseCost) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        notes: notes ?? null,
      },
    });
    await logActivity({
      userId: session.user.id,
      action: "create",
      entity: "asset",
      entityId: asset.id,
      details: `Added asset ${assetTag} (${name})`,
    });
    return apiResponse(asset);
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Asset tag already exists", 409);
    return apiError("Failed to create asset", 500);
  }
}
