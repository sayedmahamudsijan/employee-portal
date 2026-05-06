import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, ROLE_LEVEL } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { AttendanceClock } from "@/components/attendance/attendance-clock";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { TeamAttendance } from "@/components/attendance/team-attendance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const isMgrPlus = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL.MANAGER;

  const [todayRecord, monthRecords] = await Promise.all([
    prisma.attendance.findFirst({
      where: { userId: session.user.id, date: { gte: today, lt: tomorrow } },
    }),
    prisma.attendance.findMany({
      where: { userId: session.user.id, date: { gte: monthStart, lt: monthEnd } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Attendance" description="Clock in, log your work mode, and track your monthly attendance" />

      <Tabs defaultValue="me">
        <TabsList className="mb-6">
          <TabsTrigger value="me">My Attendance</TabsTrigger>
          {isMgrPlus && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="me" className="space-y-6">
          <AttendanceClock initialToday={JSON.parse(JSON.stringify(todayRecord))} />
          <AttendanceCalendar records={JSON.parse(JSON.stringify(monthRecords))} />
        </TabsContent>

        {isMgrPlus && (
          <TabsContent value="team">
            <TeamAttendance />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
