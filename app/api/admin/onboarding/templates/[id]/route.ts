import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("ADMIN");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const template = await prisma.onboardingTemplate.update({ where: { id }, data: body });
  return apiResponse(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("ADMIN");
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.onboardingTemplate.delete({ where: { id } });
    return apiResponse({ ok: true });
  } catch {
    return apiError("Failed to delete template", 500);
  }
}
