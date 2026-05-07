/**
 * Seed test accounts — one per role.
 * Run: npx ts-node --project tsconfig.json prisma/seed-test-users.ts
 *
 * These accounts use @mbd.com emails (the portal's allowed domain).
 * To actually log in, a Google account with each email must exist.
 * For quick role testing, you can also change your own account's role
 * temporarily via the User Management tab.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) throw new Error("DATABASE_URL not set");

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma  = new PrismaClient({ adapter } as any);

const TEST_USERS = [
  {
    name: "Alex Turner",
    email: "alex.turner@mbd.com",
    role: "INTERN" as const,
    jobTitle: "Engineering Intern",
    department: "Engineering",
    employeeId: "MBD-IN-0001",
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@mbd.com",
    role: "EMPLOYEE" as const,
    jobTitle: "Software Engineer",
    department: "DEV",
    employeeId: "MBD-EM-0002",
  },
  {
    name: "David Kim",
    email: "david.kim@mbd.com",
    role: "MANAGER" as const,
    jobTitle: "Engineering Manager",
    department: "DEV",
    employeeId: "MBD-MG-0003",
  },
  {
    name: "Rachel Morris",
    email: "rachel.morris@mbd.com",
    role: "ADMIN" as const,
    jobTitle: "HR Administrator",
    department: "HR",
    employeeId: "MBD-AD-0004",
  },
  {
    name: "James Harrison",
    email: "james.harrison@mbd.com",
    role: "CEO" as const,
    jobTitle: "Chief Executive Officer",
    department: "Operations",
    employeeId: "MBD-CE-0005",
  },
  {
    name: "Linda Park",
    email: "linda.park@mbd.com",
    role: "CMO" as const,
    jobTitle: "Chief Marketing Officer",
    department: "Marketing",
    employeeId: "MBD-CM-0006",
  },
  {
    name: "Michael Torres",
    email: "michael.torres@mbd.com",
    role: "CTO" as const,
    jobTitle: "Chief Technology Officer",
    department: "Engineering",
    employeeId: "MBD-CT-0007",
  },
];

async function main() {
  console.log("🌱 Seeding test users...\n");

  for (const u of TEST_USERS) {
    // Upsert: create if not exists, update role/title if already present
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role:       u.role,
        jobTitle:   u.jobTitle,
        department: u.department,
        employeeId: u.employeeId,
        status:     "ACTIVE",
      },
      create: {
        name:       u.name,
        email:      u.email,
        role:       u.role,
        jobTitle:   u.jobTitle,
        department: u.department,
        employeeId: u.employeeId,
        status:     "ACTIVE",
      },
    });

    // Ensure leave balance exists
    await prisma.leaveBalance.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId:  user.id,
        casual:  12,
        sick:    10,
        annual:  15,
        year:    new Date().getFullYear(),
      },
    });

    // Whitelist the email so Google Sign-In is auto-approved
    await prisma.allowedEmail.upsert({
      where:  { email: u.email },
      update: {},
      create: {
        email:   u.email,
        note:    `Test account — ${u.role}`,
        addedBy: "seed",
      },
    });

    console.log(`  ✅  ${u.role.padEnd(8)}  ${u.name.padEnd(18)}  ${u.email}`);
  }

  console.log("\n✨ Done! Test accounts created/updated.\n");
  console.log("Note: To log in, each email needs a matching Google account.");
  console.log("For quick testing, change your own role in the User Management tab.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
