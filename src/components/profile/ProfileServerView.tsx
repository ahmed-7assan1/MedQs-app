import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserForProfile } from "@/lib/fetch-user-for-profile";
import { notFound, redirect } from "next/navigation";
import { getUserRankInfo } from "@/lib/engagement";
import { Trophy, BookOpen, MessageSquare, Calendar, Pencil, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserPosts } from "@/components/profile/UserPosts";
import { SavedPostsSection } from "@/components/profile/SavedPostsSection";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { FollowButton } from "@/components/profile/FollowButton";

export async function ProfileServerView({ userIdSegment }: { userIdSegment: string }) {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) redirect("/login");

  const raw = String(userIdSegment ?? "").trim();
  if (!raw || raw === "undefined" || raw === "null") redirect("/profile/me");

  const targetId = raw === "me" ? sessionUserId : raw;
  const isOwn = targetId === sessionUserId;

  const user = await fetchUserForProfile(targetId);

  if (!user) {
    if (targetId === sessionUserId) {
      redirect("/login");
    }
    notFound();
  }

  const isPrivateForViewer = user.isPrivate && !isOwn;

  let rankInfo = null;
  try {
    rankInfo = await getUserRankInfo(targetId);
  } catch {
    rankInfo = null;
  }

  type PostRow = {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    forum: { name: string } | null;
  };
  let postsRaw: PostRow[] = [];
  if (!isPrivateForViewer) {
    try {
      postsRaw = await prisma.post.findMany({
        where: { authorId: targetId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          forum: { select: { name: true } },
        },
      });
    } catch {
      postsRaw = [];
    }
  }

  const posts = postsRaw.map((p) => ({
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    forum: p.forum,
  }));

  const subtitleParts: string[] = [];
  if (!isPrivateForViewer && user.university) subtitleParts.push(user.university.name);
  if (!isPrivateForViewer && user.semester) subtitleParts.push(user.semester.name);

  return (
    <div className="min-h-screen bg-[#0F0E16] text-white selection:bg-[#534AB7]/30 pb-20">
      <div className="mx-auto max-w-[680px] p-4 md:py-8 space-y-6">
        
        {/* Profile Card */}
        <div className="rounded-3xl border border-white/[0.02] bg-white/[0.02] p-6 lg:p-8 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle gradient glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#534AB7]/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-[28px] overflow-hidden border border-white/[0.1] bg-[#534AB7]/10 p-1 shadow-2xl shadow-[#534AB7]/20">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-full w-full rounded-[24px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-full w-full rounded-[24px] bg-[#534AB7]/20 flex items-center justify-center text-4xl font-bold text-[#AFA9EC]">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
                    {user.name ?? "Member"}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                    {user.handle && (
                      <span className="text-[#AFA9EC] text-sm font-medium bg-[#534AB7]/10 px-2.5 py-0.5 rounded-lg border border-[#534AB7]/20">
                        @{user.handle}
                      </span>
                    )}
                    {!user.handle && user.nickname && (
                      <span className="text-[#AFA9EC] text-sm font-medium bg-[#534AB7]/10 px-2.5 py-0.5 rounded-lg border border-[#534AB7]/20">
                        @{user.nickname}
                      </span>
                    )}
                    {user.rank && (
                      <span className="rounded-lg bg-orange-500/10 px-2.5 py-0.5 text-[13px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="text-base leading-none">{user.rank.badge}</span>
                        {user.rank.label}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isOwn && !isPrivateForViewer && (
                    <Link
                      href={`/messages/${targetId}`}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/70 border border-white/[0.1] hover:bg-white/[0.08] hover:text-white transition-all"
                    >
                      <Mail className="h-4 w-4" />
                    </Link>
                  )}
                  {!isOwn && (
                    <FollowButton userId={targetId} />
                  )}
                  {isOwn && (
                    <Link
                      href="/profile/edit"
                      className="px-5 h-10 flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-sm font-medium text-white border border-white/[0.1] hover:bg-white/[0.08] transition-all"
                    >
                      <Pencil className="h-4 w-4 text-white/50" />
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>

              {!isPrivateForViewer && user.bio && (
                <p className="mt-4 text-[15px] leading-relaxed text-white/70 max-w-lg mx-auto md:mx-0">
                  {user.bio}
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-4 text-[13px] text-white/40">
                {!isPrivateForViewer && user.university && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 opacity-50" />
                    {user.university.name}
                  </span>
                )}
                {!isPrivateForViewer && user.semester && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 opacity-50" />
                    {user.semester.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 opacity-50" />
                  Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                {isPrivateForViewer && (
                  <span className="flex items-center gap-1.5 text-orange-400/80 bg-orange-400/10 px-2 py-0.5 rounded-md border border-orange-400/20">
                    Private profile
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {!isPrivateForViewer && (
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { label: "Points", value: user.points, icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
              { label: "Quizzes", value: user._count.quizAttempts, icon: BookOpen, color: "text-[#AFA9EC]", bg: "bg-[#534AB7]/10", border: "border-[#534AB7]/20" },
              { label: "Posts", value: user._count.posts, icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-2xl border border-white/[0.02] bg-white/[0.02] p-4 md:p-5 flex flex-col items-center justify-center transition-all hover:bg-white/[0.04]"
              >
                <div className={cn("h-8 w-8 rounded-full mb-3 flex items-center justify-center border", bg, border)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <p className="font-display text-2xl md:text-3xl font-bold text-white mb-0.5">{value}</p>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-white/30">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Rank Progress */}
        {!isPrivateForViewer && rankInfo && (
          <div className="rounded-3xl border border-white/[0.02] bg-white/[0.02] p-6 lg:p-8 relative overflow-hidden">
            <h2 className="mb-5 font-display text-[17px] font-bold text-white tracking-tight">Rank Progress</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/[0.04] text-3xl border border-white/[0.1] shadow-inner">
                {rankInfo.rank?.badge ?? "🎓"}
              </div>
              <div>
                <p className="font-bold text-lg text-white">{rankInfo.rank?.label ?? "Newbie"}</p>
                <p className="text-[13px] text-white/40">{rankInfo.points} points earned</p>
              </div>
            </div>

            {rankInfo.nextRank ? (
              <div>
                <div className="mb-2.5 flex justify-between text-[13px] font-medium text-white/50">
                  <span>Next: {rankInfo.nextRank.label}</span>
                  <span className="text-[#AFA9EC]">{rankInfo.progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.04] border border-white/[0.02]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#534AB7]/50 to-[#534AB7] transition-all duration-1000 shadow-[0_0_10px_rgba(83,74,183,0.5)]"
                    style={{ width: `${rankInfo.progress}%` }}
                  />
                </div>
                <p className="mt-3 text-[12px] text-white/30 font-medium">
                  {rankInfo.nextRank.minPoints - rankInfo.points} points until next rank
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400 font-medium border border-amber-500/20 inline-block">
                Maximum rank achieved — you're Elite!
              </div>
            )}
          </div>
        )}

        {/* Saved Posts */}
        {isOwn && (
          <div className="rounded-3xl border border-white/[0.02] bg-white/[0.02] p-6 lg:p-8">
            <h2 className="mb-5 font-display text-[17px] font-bold text-white tracking-tight">Saved Posts</h2>
            <SavedPostsSection />
          </div>
        )}

        {/* User Posts */}
        {!isPrivateForViewer && (
          <div className="rounded-3xl border border-white/[0.02] bg-white/[0.02] p-6 lg:p-8">
            <h2 className="mb-5 font-display text-[17px] font-bold text-white tracking-tight">Recent Activity</h2>
            <UserPosts posts={posts} isOwn={isOwn} />
          </div>
        )}
      </div>
    </div>
  );
}

