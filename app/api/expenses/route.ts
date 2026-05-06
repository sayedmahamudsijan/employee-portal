import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { ROLE_LEVEL } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const scope = searchParams.get("scope") ?? "me";
  const status = searchParams.get("status") ?? undefined;

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;
  const where: any = {};
  if (scope === "me") where.userId = session.user.id;
  else if (scope === "team" && isMgrPlus) {
    // managers see their reports + own
  } else if (scope === "all" && isAdmin(session.user.role)) {
    // admins see all
  } else {
    where.userId = session.user.id;
  }
  if (status) where.status = status;

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return apiResponse(expenses);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { category, amount, currency, expenseDate, description, receiptUrl } = await req.json();
  if (!category || !amount || !expenseDate || !description)
    return apiError("Category, amount, date, description required");

  const expense = await prisma.expense.create({
    data: {
      userId: session.user.id,
      category, amount: Number(amount),
      currency: currency ?? "BDT",
      expenseDate: new Date(expenseDate),
      description,
      receiptUrl: receiptUrl ?? null,
    },
  });
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "expense",
    entityId: expense.id,
    details: `Submitted expense: ${category} · ${amount} ${currency ?? "BDT"}`,
  });
  return apiResponse(expense);
}
