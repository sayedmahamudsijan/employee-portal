import { prisma } from "@/lib/prisma";

// Format: MBD-AA-1001, MBD-AA-1002, ...
export async function generateEmployeeId(): Promise<string> {
  const last = await prisma.user.findFirst({
    where: { employeeId: { not: null } },
    orderBy: { employeeId: "desc" },
    select: { employeeId: true },
  });

  let next = 1001;
  if (last?.employeeId) {
    const parts = last.employeeId.split("-");
    const num = parseInt(parts[2] ?? "1000", 10);
    if (!isNaN(num)) next = num + 1;
  }

  return `MBD-AA-${String(next).padStart(4, "0")}`;
}
