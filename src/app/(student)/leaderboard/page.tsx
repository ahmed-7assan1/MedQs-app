"use client";

import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { UnderConstruction } from "@/components/ui/UnderConstruction";

export default function LeaderboardPage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-4xl"
      eyebrow="Progress"
      title="Leaderboard"
      subtitle="This area is being rebuilt and will reopen soon."
    >
      <UnderConstruction
        title="Leaderboard is under construction"
        message="We’re rebuilding ranks and points to match the new course experience. This page will be available again soon."
        backHref="/dashboard-app"
        backLabel="Back to dashboard"
      />
    </StudentPageShell>
  );
}
