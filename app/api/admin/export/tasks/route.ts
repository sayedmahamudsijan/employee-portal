import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { toCSV, csvResponse } from "@/lib/export";
import { format } from "date-fns";

export async function GET() {
  const { error } = await withRole("MANAGER");
  if (error) return error;

  const tasks = await prisma.task.findMany({
    include: {
      assignee: { select: { name: true, email: true } },
      sprint: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCSV(tasks, [
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "assignee", label: "Assignee", map: (t: any) => t.assignee.name },
    { key: "sprint", label: "Sprint", map: (t: any) => t.sprint?.name ?? "" },
    { key: "estimatedHrs", label: "Estimated Hours" },
    { key: "loggedHrs", label: "Logged Hours" },
    { key: "dueDate", label: "Due Date", map: (t: any) => (t.dueDate ? format(new Date(t.dueDate), "yyyy-MM-dd") : "") },
    { key: "tags", label: "Tags", map: (t: any) => t.tags.join(", ") },
    { key: "createdAt", label: "Created", map: (t: any) => format(new Date(t.createdAt), "yyyy-MM-dd") },
  ]);

  return csvResponse(csv, `tasks-${format(new Date(), "yyyy-MM-dd")}.csv`);
}
