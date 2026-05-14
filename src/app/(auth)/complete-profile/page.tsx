import { redirect } from "next/navigation";
export default function LegacyCompleteProfilePage() {
  redirect("/auth?mode=onboarding");
}
