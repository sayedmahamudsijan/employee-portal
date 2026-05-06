import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/teams/[id]/messages?cursor=<id>&limit=50
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const isMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });
  if (!isMember) return apiError("Forbidden", 403);

  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "60"), 100);

  const messages = await prisma.teamMessage.findMany({
    where:   { teamId: id, ...(cursor ? { id: { lt: cursor } } : {}) },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });

  return apiResponse(messages.reverse());
}

// POST /api/teams/[id]/messages  — send a message or status update
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const isMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });
  if (!isMember) return apiError("Forbidden", 403);

  const { content, type = "TEXT" } = await req.json();
  if (!content?.trim()) return apiError("Content required");

  const message = await prisma.teamMessage.create({
    data:    { teamId: id, userId: session.user.id, content: content.trim(), type },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  // Bump team updatedAt for recency sorting
  await prisma.team.update({ where: { id }, data: { updatedAt: new Date() } });

  return Response.json({ data: message, error: null, meta: null }, { status: 201 });
}
