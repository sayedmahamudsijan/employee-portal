import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? 20));
  const assigneeId = searchParams.get("assigneeId") ?? undefined;
  const sprintId = searchParams.get("sprintId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;

  const where = {
    ...(assigneeId && { assigneeId }),
    ...(sprintId && { sprintId }),
    ...(status && { status: status as any }),
    ...(priority && { priority: priority as any }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        sprint: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.count({ where }),
  ]);

  return apiResponse(tasks, { total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { title, description, status, priority, estimatedHrs, dueDate, assigneeId, sprintId, blockedById, tags } = body;

    if (!title || !assigneeId) return apiError("title and assigneeId are required");

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status ?? "TODO",
        priority: priority ?? "MEDIUM",
        estimatedHrs,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId,
        sprintId,
        blockedById,
        tags: tags ?? [],
      },
    });

    logActivity({
      userId: session.user.id,
      action: "Created",
      entity: "Task",
      entityId: task.id,
      section: "Workspace",
      details: `Created task "${title}" (${priority ?? "MEDIUM"} priority)`,
      newValue: { title, priority: priority ?? "MEDIUM", status: status ?? "TODO", assigneeId },
      taskId: task.id,
    });

    if (assigneeId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          message: `You have been assigned a new task: "${title}"`,
          link: `/tasks/${task.id}`,
        },
      });
    }

    return apiResponse(task);
  } catch {
    return apiError("Failed to create task", 500);
  }
}
