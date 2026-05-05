import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const templates = await prisma.onboardingTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return apiResponse(templates);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { name, role, items } = await req.json();
  if (!name || !Array.isArray(items)) return apiError("Name and items array are required");

  const template = await prisma.onboardingTemplate.create({
    data: { name, role: role ?? null, items },
  });
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "onboarding-template",
    entityId: template.id,
    details: `Created onboarding template "${name}"`,
  });
  return apiResponse(template);
}
