import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  // Check current users and their roles
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true },
    orderBy: { createdAt: "asc" }
  });
  console.log("All users:");
  users.forEach(u => console.log(`  ${u.role.padEnd(8)} ${u.name.padEnd(20)} ${u.email} [${u.status}]`));
  
  // Find Sayed and update to CEO for testing
  const sayed = users.find(u => u.email.includes("sayed") || u.name.toLowerCase().includes("sayed"));
  if (sayed) {
    await prisma.user.update({ where: { id: sayed.id }, data: { role: "CEO", status: "ACTIVE" } });
    console.log("\n✅ Updated " + sayed.name + " to CEO");
  } else {
    console.log("\n⚠️  Could not find Sayed - updating all non-test users to CEO");
    const real = users.filter(u => !u.email.includes("@mbd.com"));
    for (const u of real) {
      await prisma.user.update({ where: { id: u.id }, data: { role: "CEO", status: "ACTIVE" } });
      console.log("  Updated " + u.name + " -> CEO");
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
