import { V2Kpi } from "@/ui/design-system/primitives/V2Kpi";
import { V2Shell } from "@/ui/design-system/primitives/V2Shell";
import { V2Card } from "@/ui/design-system/primitives/V2Card";

export default function AdminV2DashboardPage() {
  return (
    <V2Shell title="Faculty Admin V2" subtitle="Operational control center for content, AI, and assessment quality.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <V2Kpi label="Published Lectures" value="246" hint="+12 this week" />
        <V2Kpi label="Quiz Attempts" value="4,892" hint="Across active cohorts" />
        <V2Kpi label="AI Draft Jobs" value="37" hint="8 awaiting approval" />
        <V2Kpi label="At-Risk Students" value="29" hint="Needs intervention" />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <V2Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Content Studio Queue</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Review AI-generated flashcards, MCQ sets, and summaries before publication.
          </p>
        </V2Card>
        <V2Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assessment Quality Monitor</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Track difficulty drift, discrimination index, and low-performing questions.
          </p>
        </V2Card>
      </section>
    </V2Shell>
  );
}

