import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.document.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e: any) {
    if (e.code === "P2025") return apiError("Document not found", 404);
    return apiError("Failed to delete document", 500);
  }
}
