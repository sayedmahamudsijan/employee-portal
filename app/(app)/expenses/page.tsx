import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVEL } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesList } from "@/components/expenses/expenses-list";
import { ExpenseApprovals } from "@/components/expenses/expense-approvals";

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;

  const myExpenses = await prisma.expense.findMany({
    where: { userId: session.user.id },
    include: { approver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Submit reimbursements and track approval status"
      />

      <Tabs defaultValue="me">
        <TabsList className="mb-6">
          <TabsTrigger value="me">My Expenses</TabsTrigger>
          {isMgrPlus && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
        </TabsList>
        <TabsContent value="me">
          <ExpensesList initial={JSON.parse(JSON.stringify(myExpenses))} />
        </TabsContent>
        {isMgrPlus && (
          <TabsContent value="approvals">
            <ExpenseApprovals />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
