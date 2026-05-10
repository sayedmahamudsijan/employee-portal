import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  // Update sayedgra to ADMIN for testing
  const user = await prisma.user.update({
    where: { email: "sayedgra@gmail.com" },
    data: { role: "ADMIN" },
    select: { name: true, email: true, role: true }
  });
  console.log("Updated:", JSON.stringify(user));
}
main().catch(console.error).finally(() => prisma.$disconnect());
