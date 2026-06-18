import { auth } from "@/lib/auth";
import { MedOneXChat } from "@/components/ai/MedOneXChat";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat Tutor",
  description: "Chat with MedOneX AI tutor. Get instant answers to medical questions, clarify concepts, and enhance your learning with AI-powered medical assistance.",
  manifest: "/ai-chat/manifest",
};

export default async function AIChatPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <MedOneXChat />
    </div>
  );
}
