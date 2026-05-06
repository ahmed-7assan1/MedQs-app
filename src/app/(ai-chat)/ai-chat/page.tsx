import { auth } from "@/lib/auth";
import { AIChatClient } from "@/components/ai/redesign/AIChatClient";
import { redirect } from "next/navigation";

export default async function AIChatPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "Student",
    rank: "Elite",
    role: session.user.role || "STUDENT"
  };

  return <AIChatClient user={user} />;
}
