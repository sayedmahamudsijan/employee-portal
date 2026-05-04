import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? 20));
  const status = searchParams.get("status") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const department = searchParams.get("department") ?? undefined;

  const where = {
    ...(status && { status: status as any }),
    ...(role && { role: role as any }),
    ...(department && { department }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        department: true,
        jobTitle: true,
        managerId: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.count({ where }),
  ]);

  return apiResponse(users, { total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { name, email, role, department, jobTitle, managerId } = body;

    if (!name || !email) return apiError("name and email are required");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role ?? "EMPLOYEE",
        status: "ACTIVE",
        department,
        jobTitle,
        managerId,
      },
    });

    await prisma.leaveBalance.create({
      data: { userId: user.id, casual: 12, sick: 10, annual: 15, year: new Date().getFullYear() },
    });

    return apiResponse(user);
  } catch (e: any) {
    if (e.code === "P2002") return apiError("Email already exists", 409);
    return apiError("Failed to create user", 500);
  }
}
