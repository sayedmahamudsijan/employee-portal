import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: "sayedgra@gmail.com" },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("sayedgra user:", JSON.stringify(users, null, 2));

  const execs = await prisma.user.findMany({
    where: { role: { in: ["CEO", "CMO", "CTO"] } },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("Executives:", JSON.stringify(execs, null, 2));
}

main().finally(() => prisma.$disconnect());
