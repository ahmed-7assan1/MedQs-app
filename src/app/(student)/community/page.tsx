import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CommunityPageClient } from "./CommunityPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "MedOneX Community",
  description: "Real-time community discussion for all students in your university.",
};

export default async function CommunityPage() {
  const session = await auth();
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const userId = authUser?.id || session?.user?.id || "";
  const userName = authUser?.user_metadata?.name || session?.user?.name || "Student";
  const userImage = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.image || session?.user?.image || null;

  return (
    <CommunityPageClient
      currentUserId={userId}
      currentUserName={userName}
      currentUserImage={userImage}
    />
  );
}
