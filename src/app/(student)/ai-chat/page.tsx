import { auth } from "@/lib/auth";
import { MedOneXChat } from "@/components/ai/MedOneXChat";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat Tutor",
  description: "Chat with MedOneX AI tutor. Get instant answers to medical questions, clarify concepts, and enhance your learning with AI-powered medical assistance.",
};

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
