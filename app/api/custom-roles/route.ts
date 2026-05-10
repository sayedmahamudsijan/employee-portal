import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const EXEC_ROLES = ["CEO", "CMO", "CTO", "ADMIN"];

export async function GET() {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const customRoles = await prisma.customRole.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return apiResponse(customRoles);
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  if (!EXEC_ROLES.includes(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  const body = await req.json();
  const { name, color, description } = body as {
    name: string;
    color?: string;
    description?: string;
  };

  if (!name?.trim()) return apiError("Name is required");

  const customRole = await prisma.customRole.create({
    data: {
      name: name.trim(),
      color: color ?? "#6366f1",
      description: description ?? null,
      createdBy: session.user.id,
    },
  });

  return apiResponse(customRole, { status: 201 });
}
