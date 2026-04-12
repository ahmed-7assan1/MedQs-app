import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentSpaceClient } from "@/components/study-space/StudentSpaceClient";

export default async function SpacePage() {
  const session = await auth();
  // if (!session?.user?.id) {
  //   redirect("/login?callbackUrl=/space");
  // }
  return <StudentSpaceClient />;
}
