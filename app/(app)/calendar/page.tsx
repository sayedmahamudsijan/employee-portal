import { PageHeader } from "@/components/shared/page-header";
import { TeamCalendarView } from "@/components/calendar/team-calendar-view";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader
        title="Team Calendar"
        description="See who's on leave, upcoming holidays, birthdays and anniversaries"
      />
      <TeamCalendarView />
    </div>
  );
}
