import { redirect } from "next/navigation";

export default function OldDownloadsRedirect() {
  redirect("/modules/downloads");
}
