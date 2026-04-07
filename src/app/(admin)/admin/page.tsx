import { redirect } from "next/navigation";

/** `/admin` alone has no UI — send admins to the dashboard. */
export default function AdminRootRedirect() {
  redirect("/admin/dashboard");
}
