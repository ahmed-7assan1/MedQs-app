import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PersonalStudyCoach } from "@/components/study-assistant/PersonalStudyCoach";

export default async function SpacePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/space");
  }
  return <PersonalStudyCoach />;
}
