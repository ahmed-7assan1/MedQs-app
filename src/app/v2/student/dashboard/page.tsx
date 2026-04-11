import { V2Kpi } from "@/ui/design-system/primitives/V2Kpi";
import { V2Shell } from "@/ui/design-system/primitives/V2Shell";

export default function StudentV2DashboardPage() {
  return (
    <V2Shell
      title="Student Dashboard V2"
      subtitle="Unified progress, performance, streaks, and study-time intelligence."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <V2Kpi label="Study Streak" value="21 days" hint="Personal best: 34 days" />
        <V2Kpi label="Quiz Accuracy" value="78%" hint="Last 30 days rolling average" />
        <V2Kpi label="Hours This Week" value="14h 22m" hint="Target: 18h" />
        <V2Kpi label="Batch Rank" value="#12" hint="Medicine • Year 3" />
      </section>
    </V2Shell>
  );
}

