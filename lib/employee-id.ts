import { prisma } from "@/lib/prisma";

// Format: MBD-AA-0001, MBD-AA-0002, ...
// Uses numeric max to avoid string-sort collision (e.g. "0009" > "0010" alphabetically).
export async function generateEmployeeId(): Promise<string> {
  const all = await prisma.user.findMany({
    where: { employeeId: { not: null } },
    select: { employeeId: true },
  });

  let maxNum = 0;
  for (const u of all) {
    if (u.employeeId) {
      const parts = u.employeeId.split("-");
      const num = parseInt(parts[2] ?? "0", 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  return `MBD-AA-${String(maxNum + 1).padStart(4, "0")}`;
}
