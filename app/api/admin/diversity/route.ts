import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";

/**
 * Aggregate D&I metrics — admin-only.
 * Returns counts only (never individual records) to preserve privacy.
 */
export async function GET() {
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { gender: true, ethnicity: true, department: true, role: true, location: true, joinedAt: true },
  });

  const total = users.length;

  function bucket(field: keyof typeof users[number]): Record<string, number> {
    const m: Record<string, number> = {};
    users.forEach((u) => {
      const v = (u[field] as string) || "Not specified";
      m[v] = (m[v] ?? 0) + 1;
    });
    return m;
  }

  const tenure = users
    .filter((u) => u.joinedAt)
    .reduce<Record<string, number>>((acc, u) => {
      const months = Math.floor((Date.now() - new Date(u.joinedAt!).getTime()) / (1000 * 60 * 60 * 24 * 30));
      const bucket =
        months < 6 ? "< 6 months" :
        months < 12 ? "6-12 months" :
        months < 24 ? "1-2 years" :
        months < 60 ? "2-5 years" : "5+ years";
      acc[bucket] = (acc[bucket] ?? 0) + 1;
      return acc;
    }, {});

  return apiResponse({
    total,
    gender: bucket("gender"),
    ethnicity: bucket("ethnicity"),
    department: bucket("department"),
    role: bucket("role"),
    location: bucket("location"),
    tenure,
  });
}
