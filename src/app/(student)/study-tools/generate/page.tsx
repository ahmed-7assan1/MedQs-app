import { auth } from "@/lib/auth";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { FlashcardFromTextClient } from "@/components/study-tools/FlashcardFromTextClient";

export default async function StudyToolsGeneratePage() {
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);

  return (
    <StudentPageShell
      maxWidthClass="max-w-3xl"
      eyebrow="AI helper"
      title="Flashcards from your notes"
      subtitle="Paste study text and get a draft deck to flip through. Export with one click, or cross-check against your official lecture flashcards in Modules."
    >
      <FlashcardFromTextClient signedIn={signedIn} />
    </StudentPageShell>
  );
}
