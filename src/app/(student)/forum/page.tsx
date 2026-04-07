import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { UnderConstruction } from "@/components/ui/UnderConstruction";

export default async function ForumPage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-4xl"
      eyebrow="Community"
      title="Forum"
      subtitle="This area is being rebuilt and will reopen soon."
    >
      <UnderConstruction
        title="Forum is under construction"
        message="We’re upgrading discussions and group chat. This page will be available again soon."
        backHref="/dashboard-app"
        backLabel="Back to dashboard"
      />
    </StudentPageShell>
  );
}
