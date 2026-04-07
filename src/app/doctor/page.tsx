import { redirect } from "next/navigation";

/** Friendly entry URL for faculty; same app area as `/admin`. */
export default function DoctorEntryPage() {
  redirect("/admin/dashboard");
}
