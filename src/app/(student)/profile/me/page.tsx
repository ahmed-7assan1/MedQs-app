import { ProfileServerView } from "@/components/profile/ProfileServerView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Explicit /profile/me route (avoids dynamic segment edge cases). */
export default async function ProfileMePage() {
  return <ProfileServerView userIdSegment="me" />;
}
