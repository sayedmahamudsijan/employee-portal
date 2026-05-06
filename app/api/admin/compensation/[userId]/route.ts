import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error } = await withRole("ADMIN");
  if (error) return error;
  const { userId } = await params;
  const records = await prisma.compensation.findMany({
    where: { userId },
    orderBy: { effectiveDate: "desc" },
  });
  return apiResponse(records);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;
  const { userId } = await params;
  const { effectiveDate, baseSalary, currency, bonusAnnual, equityShares, reason, notes } = await req.json();
  if (!effectiveDate || !baseSalary) return apiError("Effective date and salary required");

  const c = await prisma.compensation.create({
    data: {
      userId,
      effectiveDate: new Date(effectiveDate),
      baseSalary: Number(baseSalary),
      currency: currency ?? "BDT",
      bonusAnnual: bonusAnnual ? Number(bonusAnnual) : null,
      equityShares: equityShares ? Number(equityShares) : null,
      reason: reason ?? null,
      notes: notes ?? null,
      createdBy: session.user.id,
    },
  });
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "compensation",
    entityId: c.id,
    details: `Recorded compensation change for user ${userId}`,
  });
  return apiResponse(c);
}
