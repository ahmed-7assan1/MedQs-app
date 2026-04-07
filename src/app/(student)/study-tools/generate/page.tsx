import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { UnderConstruction } from "@/components/ui/UnderConstruction";

export default async function StudyToolsGeneratePage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-3xl"
      eyebrow="Study tools"
      title="Under construction"
      subtitle="This area will reopen soon."
    >
      <UnderConstruction
        title="Study tools are under construction"
        message="This feature is temporarily closed while we rebuild the study tools experience."
        backHref="/dashboard-app"
        backLabel="Back to dashboard"
      />
    </StudentPageShell>
  );
}
