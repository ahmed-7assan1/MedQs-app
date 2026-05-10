import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { CommunityChatClient } from "@/components/forum/CommunityChatClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Discussion Group • MedOneX",
  description: "Real-time community discussion for all students in your university.",
};

export default async function CommunityPage() {
  redirect("/social");
}
