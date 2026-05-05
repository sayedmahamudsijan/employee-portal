import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole, isAdmin } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { userId } = await params;
  // Users can view their own; admins can view anyone's
  if (userId !== session.user.id && !isAdmin(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  const checklist = await prisma.onboardingChecklist.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  });
  return apiResponse(checklist);
}

/** Assign / regenerate a checklist for a user */
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { userId } = await params;
  const { templateId } = await req.json();

  let items: any[] = [];
  if (templateId) {
    const template = await prisma.onboardingTemplate.findUnique({ where: { id: templateId } });
    if (!template) return apiError("Template not found", 404);
    items = (template.items as any[]).map((i: any) => ({ ...i, done: false }));
  }

  const checklist = await prisma.onboardingChecklist.upsert({
    where: { userId },
    create: { userId, templateId: templateId ?? null, items },
    update: { templateId: templateId ?? null, items, completedAt: null },
  });

  await logActivity({
    userId: session.user.id,
    action: "assign",
    entity: "onboarding",
    entityId: checklist.id,
    details: `Assigned onboarding checklist to user ${userId}`,
  });

  return apiResponse(checklist);
}

/** Update progress on a checklist item (item id + done flag) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { userId } = await params;
  if (userId !== session.user.id && !isAdmin(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  const { itemId, done } = await req.json();
  const checklist = await prisma.onboardingChecklist.findUnique({ where: { userId } });
  if (!checklist) return apiError("Checklist not found", 404);

  const items = (checklist.items as any[]).map((i: any) =>
    i.id === itemId ? { ...i, done: !!done, doneAt: done ? new Date().toISOString() : null } : i
  );

  const allDone = items.every((i: any) => i.done);
  const updated = await prisma.onboardingChecklist.update({
    where: { userId },
    data: { items, completedAt: allDone ? new Date() : null },
  });

  return apiResponse(updated);
}
