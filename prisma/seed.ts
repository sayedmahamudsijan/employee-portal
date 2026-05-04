import { PrismaClient } from "@prisma/client";
import { addDays, subDays, startOfMonth, endOfMonth } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MBD Portal...");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.document.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const now = new Date();
  const year = now.getFullYear();

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: "Sarah Ahmed",
      email: "sarah.ahmed@mbd.com",
      role: "ADMIN",
      status: "ACTIVE",
      department: "HR",
      jobTitle: "HR Director",
    },
  });

  // Managers
  const manager1 = await prisma.user.create({
    data: {
      name: "Omar Khan",
      email: "omar.khan@mbd.com",
      role: "MANAGER",
      status: "ACTIVE",
      department: "Engineering",
      jobTitle: "Engineering Manager",
      managerId: admin.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "priya.nair@mbd.com",
      role: "MANAGER",
      status: "ACTIVE",
      department: "Product",
      jobTitle: "Product Manager",
      managerId: admin.id,
    },
  });

  // Employees
  const employees = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ali Hassan",
        email: "ali.hassan@mbd.com",
        role: "EMPLOYEE",
        status: "ACTIVE",
        department: "Engineering",
        jobTitle: "Frontend Engineer",
        managerId: manager1.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Fatima Malik",
        email: "fatima.malik@mbd.com",
        role: "EMPLOYEE",
        status: "ACTIVE",
        department: "Engineering",
        jobTitle: "Backend Engineer",
        managerId: manager1.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Rohan Sharma",
        email: "rohan.sharma@mbd.com",
        role: "EMPLOYEE",
        status: "ACTIVE",
        department: "Engineering",
        jobTitle: "Full Stack Engineer",
        managerId: manager1.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Zara Ahmed",
        email: "zara.ahmed@mbd.com",
        role: "EMPLOYEE",
        status: "ACTIVE",
        department: "Product",
        jobTitle: "Product Designer",
        managerId: manager2.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Tariq Hussain",
        email: "tariq.hussain@mbd.com",
        role: "EMPLOYEE",
        status: "ACTIVE",
        department: "Product",
        jobTitle: "Product Analyst",
        managerId: manager2.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Aisha Siddiqui",
        email: "aisha.siddiqui@mbd.com",
        role: "EMPLOYEE",
        status: "PENDING",
        department: "Engineering",
        jobTitle: "QA Engineer",
        managerId: manager1.id,
      },
    }),
  ]);

  const allUsers = [admin, manager1, manager2, ...employees];

  // Leave balances
  await Promise.all(
    allUsers.map((u) =>
      prisma.leaveBalance.create({
        data: {
          userId: u.id,
          casual: Math.floor(Math.random() * 8) + 4,
          sick: Math.floor(Math.random() * 6) + 5,
          annual: Math.floor(Math.random() * 10) + 6,
          year,
        },
      })
    )
  );

  // Sprints
  const sprint1 = await prisma.sprint.create({
    data: {
      name: "Sprint 12",
      startDate: subDays(now, 7),
      endDate: addDays(now, 7),
      status: "ACTIVE",
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      name: "Sprint 13",
      startDate: addDays(now, 8),
      endDate: addDays(now, 22),
      status: "PLANNED",
    },
  });

  // Tasks
  const taskData = [
    { title: "Redesign login page", status: "DONE", priority: "HIGH", assigneeId: employees[3].id, estimatedHrs: 6, loggedHrs: 5.5 },
    { title: "Implement JWT refresh logic", status: "IN_PROGRESS", priority: "URGENT", assigneeId: employees[1].id, estimatedHrs: 8 },
    { title: "Fix pagination bug on tasks list", status: "TODO", priority: "MEDIUM", assigneeId: employees[0].id, estimatedHrs: 3 },
    { title: "Write unit tests for auth module", status: "IN_REVIEW", priority: "HIGH", assigneeId: employees[2].id, estimatedHrs: 5 },
    { title: "Set up CI/CD pipeline", status: "DONE", priority: "HIGH", assigneeId: manager1.id, estimatedHrs: 10, loggedHrs: 9 },
    { title: "Database migration for v2", status: "BLOCKED", priority: "URGENT", assigneeId: employees[1].id, estimatedHrs: 4 },
    { title: "Design onboarding flow mockups", status: "IN_PROGRESS", priority: "MEDIUM", assigneeId: employees[3].id, estimatedHrs: 8 },
    { title: "User research interviews", status: "TODO", priority: "MEDIUM", assigneeId: employees[4].id, estimatedHrs: 6 },
    { title: "API documentation", status: "TODO", priority: "LOW", assigneeId: employees[2].id, estimatedHrs: 4 },
    { title: "Performance optimization — dashboard", status: "IN_PROGRESS", priority: "HIGH", assigneeId: employees[0].id, estimatedHrs: 12 },
    { title: "Mobile responsive fixes", status: "TODO", priority: "MEDIUM", assigneeId: employees[0].id, estimatedHrs: 5, dueDate: addDays(now, 2) },
    { title: "Error handling improvements", status: "IN_REVIEW", priority: "MEDIUM", assigneeId: employees[2].id, estimatedHrs: 3 },
    { title: "Analytics dashboard charts", status: "TODO", priority: "HIGH", assigneeId: employees[0].id, estimatedHrs: 8 },
    { title: "Notification system backend", status: "DONE", priority: "HIGH", assigneeId: employees[1].id, estimatedHrs: 6, loggedHrs: 7 },
    { title: "Leave management approval flow", status: "DONE", priority: "MEDIUM", assigneeId: employees[2].id, estimatedHrs: 5, loggedHrs: 4.5 },
    { title: "Competitor analysis report", status: "IN_PROGRESS", priority: "MEDIUM", assigneeId: employees[4].id, estimatedHrs: 10 },
    { title: "Accessibility audit", status: "TODO", priority: "LOW", assigneeId: employees[3].id, estimatedHrs: 4 },
    { title: "Redis caching layer", status: "TODO", priority: "MEDIUM", assigneeId: employees[1].id, estimatedHrs: 6 },
    { title: "Sprint planning session prep", status: "DONE", priority: "LOW", assigneeId: manager1.id, estimatedHrs: 2, loggedHrs: 2 },
    { title: "Stakeholder demo preparation", status: "IN_PROGRESS", priority: "HIGH", assigneeId: manager2.id, estimatedHrs: 4 },
  ];

  const tasks = await Promise.all(
    taskData.map((t, i) =>
      prisma.task.create({
        data: {
          ...t,
          status: t.status as any,
          priority: t.priority as any,
          loggedHrs: t.loggedHrs ?? 0,
          dueDate: t.dueDate ?? addDays(now, (i % 10) + 1),
          sprintId: i < 15 ? sprint1.id : sprint2.id,
          tags: i % 3 === 0 ? ["feature"] : i % 3 === 1 ? ["bug"] : ["chore"],
        },
      })
    )
  );

  // Work logs
  const workLogUsers = [employees[0], employees[1], employees[2], manager1];
  for (const user of workLogUsers) {
    for (let d = 0; d < 10; d++) {
      const date = subDays(now, d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      await prisma.workLog.create({
        data: {
          userId: user.id,
          taskId: tasks[Math.floor(Math.random() * tasks.length)].id,
          date,
          hours: Math.round((Math.random() * 4 + 4) * 2) / 2,
          description: `Work done on ${date.toDateString()}`,
        },
      });
    }
  }

  // Leave requests
  await prisma.leaveRequest.createMany({
    data: [
      {
        userId: employees[0].id,
        type: "CASUAL",
        startDate: addDays(now, 3),
        endDate: addDays(now, 4),
        days: 2,
        reason: "Personal errand",
        status: "PENDING",
      },
      {
        userId: employees[1].id,
        type: "SICK",
        startDate: subDays(now, 5),
        endDate: subDays(now, 5),
        days: 1,
        status: "APPROVED",
        reviewedBy: manager1.id,
      },
      {
        userId: employees[2].id,
        type: "ANNUAL",
        startDate: addDays(now, 14),
        endDate: addDays(now, 21),
        days: 6,
        reason: "Family vacation",
        status: "PENDING",
      },
    ],
  });

  // Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Q2 All-Hands Meeting — May 15th",
        body: "Join us for our quarterly all-hands meeting on Thursday, May 15th at 10am. We'll be covering company performance, team updates, and upcoming roadmap. Please confirm your attendance on the shared calendar.",
        authorId: admin.id,
        pinned: true,
      },
      {
        title: "New Leave Policy Effective June 1",
        body: "Please review the updated leave policy document in the Document Center. Key changes include an increase in annual leave from 15 to 18 days and a new mental health day allowance of 2 days per year.",
        authorId: admin.id,
        pinned: true,
      },
      {
        title: "Sprint 12 Kickoff",
        body: "Sprint 12 has officially kicked off! Please make sure all your tasks are updated and any blockers are flagged to your manager before end of day today.",
        authorId: manager1.id,
        pinned: false,
      },
      {
        title: "Office Wi-Fi Maintenance — Saturday",
        body: "The office Wi-Fi will be down for maintenance this Saturday from 9am to 12pm. Please plan your remote work accordingly.",
        authorId: admin.id,
        pinned: false,
      },
    ],
  });

  // Goals
  const quarter = "Q2";
  await prisma.goal.createMany({
    data: [
      { userId: employees[0].id, title: "Launch redesigned dashboard", description: "Complete and ship the new dashboard design", progress: 65, status: "IN_PROGRESS", quarter, year, dueDate: new Date(`${year}-06-30`) },
      { userId: employees[0].id, title: "Achieve 90% test coverage", description: "Increase frontend test coverage", progress: 42, status: "IN_PROGRESS", quarter, year, dueDate: new Date(`${year}-06-30`) },
      { userId: employees[1].id, title: "Migrate to microservices", description: "Break monolith into 3 services", progress: 30, status: "IN_PROGRESS", quarter, year, dueDate: new Date(`${year}-06-30`) },
      { userId: employees[2].id, title: "Complete API documentation", description: "Document all public API endpoints", progress: 80, status: "IN_PROGRESS", quarter, year, dueDate: new Date(`${year}-05-31`) },
      { userId: manager1.id, title: "Hire 2 senior engineers", description: "Complete hiring process for open roles", progress: 50, status: "IN_PROGRESS", quarter, year, dueDate: new Date(`${year}-06-30`) },
    ],
  });

  // Documents
  await prisma.document.createMany({
    data: [
      { title: "Employee Handbook 2025", category: "Policies", fileUrl: "#", fileType: "PDF", uploadedBy: admin.id },
      { title: "Remote Work Policy", category: "Policies", fileUrl: "#", fileType: "PDF", uploadedBy: admin.id },
      { title: "Code Review SOP", category: "SOPs", fileUrl: "#", fileType: "PDF", uploadedBy: manager1.id },
      { title: "Onboarding Checklist", category: "Onboarding", fileUrl: "#", fileType: "PDF", uploadedBy: admin.id },
      { title: "PR Template", category: "Templates", fileUrl: "#", fileType: "MD", uploadedBy: manager1.id },
      { title: "Meeting Notes Template", category: "Templates", fileUrl: "#", fileType: "DOCX", uploadedBy: admin.id },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: employees[0].id, type: "TASK_ASSIGNED", message: "You have been assigned 'Mobile responsive fixes'", link: "/tasks", read: false },
      { userId: employees[1].id, type: "LEAVE_APPROVED", message: "Your sick leave request has been approved", link: "/leave", read: false },
      { userId: manager1.id, type: "LEAVE_REQUEST", message: "Ali Hassan has submitted a leave request", link: "/leave", read: false },
      { userId: employees[0].id, type: "ANNOUNCEMENT", message: "New announcement: Q2 All-Hands Meeting — May 15th", link: "/announcements", read: true },
    ],
  });

  console.log("✅ Seed complete!");
  console.log(`   Users: ${allUsers.length} (1 admin, 2 managers, 6 employees)`);
  console.log(`   Sprints: 2`);
  console.log(`   Tasks: ${tasks.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
