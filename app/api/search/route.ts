import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

/**
 * Global search: case-insensitive search across users, tasks, documents, announcements.
 * Returns at most ~5 hits per category to keep payloads small.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return apiResponse({ users: [], tasks: [], documents: [], announcements: [] });
  }

  const [users, tasks, documents, announcements] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { jobTitle: { contains: q, mode: "insensitive" } },
          { employeeId: { contains: q, mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true, image: true, jobTitle: true, role: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, status: true, priority: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, category: true, fileUrl: true },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, createdAt: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiResponse({ users, tasks, documents, announcements });
}
