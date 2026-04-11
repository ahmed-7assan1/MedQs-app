import { V2Kpi } from "@/ui/design-system/primitives/V2Kpi";
import { V2Shell } from "@/ui/design-system/primitives/V2Shell";
import { V2Card } from "@/ui/design-system/primitives/V2Card";

export default function TeacherV2DashboardPage() {
  return (
    <V2Shell title="Teacher Studio V2" subtitle="Manage catalog, students, engagement, and course performance.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <V2Kpi label="Active Courses" value="5" hint="3 paid, 2 free" />
        <V2Kpi label="Enrolled Students" value="1,208" hint="+41 this week" />
        <V2Kpi label="Completion Rate" value="62%" hint="Cohort weighted" />
        <V2Kpi label="Course Revenue" value="$12,480" hint="Current month" />
      </section>
      <section className="mt-6">
        <V2Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Announcements and Private Groups</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Broadcast updates, run private discussions, and follow student engagement trends.
          </p>
        </V2Card>
      </section>
    </V2Shell>
  );
}

