import { auth } from "@/lib/auth";
import { DrQFuturisticChat } from "@/components/ai/DrQFuturisticChat";
import { redirect } from "next/navigation";

export default async function AIChatPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="bg-[#09080F] dark:bg-[#09080F] w-full flex-1 flex flex-col min-h-0">
      {/* Mobile cinematic background */}
      <div className="md:hidden fixed inset-0 cinematic-bg -z-10" />
      <DrQFuturisticChat />
    </div>
  );
}
