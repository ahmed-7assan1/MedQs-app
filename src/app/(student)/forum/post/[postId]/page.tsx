import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { UnderConstruction } from "@/components/ui/UnderConstruction";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { postId: string };

export default async function ForumSinglePostPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  await Promise.resolve(params);

  return (
    <StudentPageShell
      maxWidthClass="max-w-2xl"
      eyebrow="Forum"
      title="Forum post"
      subtitle="Temporarily unavailable"
    >
      <UnderConstruction
        title="Forum is under construction"
        message="We’re upgrading discussions and group chat. Posts will be available again soon."
        backHref="/dashboard-app"
        backLabel="Back to dashboard"
      />
    </StudentPageShell>
  );
}
