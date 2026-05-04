import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/roles";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;

  const documents = await prisma.document.findMany({
    where: { ...(category && { category }) },
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse(documents);
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { title, category, fileUrl, fileType } = body;

    if (!title || !category || !fileUrl) return apiError("title, category and fileUrl are required");

    const document = await prisma.document.create({
      data: { title, category, fileUrl, fileType, uploadedBy: session.user.id },
    });

    return apiResponse(document);
  } catch {
    return apiError("Failed to create document", 500);
  }
}
