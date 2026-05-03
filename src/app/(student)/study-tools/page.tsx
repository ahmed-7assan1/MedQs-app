import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { UnderConstruction } from "@/components/ui/UnderConstruction";

export default function StudyToolsPage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-7xl"
      eyebrow="Study tools"
      title="Study tools"
      subtitle="This area is being rebuilt and will reopen soon."
    >
      <UnderConstruction
        title="Study tools are under construction"
        message="We’re rebuilding this page with a cleaner workflow. You’ll be able to access study tools again soon."
        backHref="/dashboard-app"
        backLabel="Back to dashboard"
      />
    </StudentPageShell>
  );
}
