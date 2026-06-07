import { auth } from "@/lib/auth";
import { MedOneXChat } from "@/components/ai/MedOneXChat";
import { redirect } from "next/navigation";

export default async function AIChatPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="w-full h-screen flex flex-col md:pb-0">
      <MedOneXChat />
    </div>
  );
}
