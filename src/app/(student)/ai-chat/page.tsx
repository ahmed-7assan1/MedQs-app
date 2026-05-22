import { auth } from "@/lib/auth";
import { DrQFuturisticChat } from "@/components/ai/DrQFuturisticChat";
import { redirect } from "next/navigation";

export default async function AIChatPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-0"> 
      <DrQFuturisticChat />
    </div>
  );
}
