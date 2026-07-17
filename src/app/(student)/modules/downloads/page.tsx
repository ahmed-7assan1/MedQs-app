import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import TopBar from "@/components/modules/TopBar";
import DownloadsClient from "@/components/modules/DownloadsClient";

export const metadata: Metadata = {
  title: "My Downloads",
  description: "Files you have downloaded from the platform",
};

export default async function DownloadsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar userName={user?.name} userImage={user?.image} />
      <div className="pt-24">
        <DownloadsClient />
      </div>
    </div>
  );
}
