import { redirect } from "next/navigation";

/** /profile → consistent entry so bookmarks and links never 404 */
export default function ProfileIndexPage() {
  redirect("/profile/me");
}
