import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserForProfile } from "@/lib/fetch-user-for-profile";
import { notFound, redirect } from "next/navigation";
import { getUserRankInfo } from "@/lib/engagement";
import { Trophy, BookOpen, MessageSquare, Calendar, Pencil, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserPosts } from "@/components/profile/UserPosts";
import { SavedPostsSection } from "@/components/profile/SavedPostsSection";
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

  const avatarUrl = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name ?? "User")}&backgroundColor=c0aede,d1d4f9,b6e3f4`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Cover Photo — shorter on mobile */}
      <div className="h-32 md:h-64 lg:h-80 w-full relative border-b border-border/60 overflow-hidden">
         {user.coverImage ? (
           <img src={user.coverImage} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />
         ) : (
           <div className="absolute inset-0 bg-gradient-to-br dark:from-[#131220] dark:to-[#1a182b] from-blue-100 to-indigo-50">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
           </div>
         )}
         {/* Seamless fade into background to ensure name readability */}
         <div className="absolute bottom-0 left-0 right-0 h-24 md:h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 relative -mt-14 md:-mt-20 mb-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        
        {/* Profile Header (Avatar + Info) — smaller on mobile */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-6 md:items-end relative z-10 min-w-0">
          {/* Avatar */}
          <div className="h-24 w-24 md:h-40 md:w-40 rounded-[22px] md:rounded-3xl bg-card border-[3px] md:border-4 border-background shadow-lg md:shadow-2xl overflow-hidden shrink-0">
             <img
               src={avatarUrl}
               alt={user.name}
               className="h-full w-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>

          {/* Info & Actions */}
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mt-1 md:mt-0 md:pb-4">
             <div>
                 <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-2 min-w-0 break-words">
                  {user.name ?? "Member"}
                </h1>
                 <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                  <span className="text-muted-foreground font-semibold tracking-wide text-[11px] md:text-[13px] uppercase break-all">
                    @{user.handle || user.nickname || user.studentId || "user"}
                  </span>
                  {user.rank && (
                    <span className="rounded-full bg-orange-500/10 px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-[11px] font-bold text-orange-500 border border-orange-500/20 uppercase tracking-widest flex items-center gap-1">
                      <span className="text-sm leading-none">{user.rank.badge}</span>
                      {user.rank.label}
                    </span>
                  )}
                </div>
             </div>
             
             {/* Actions */}
             <div className="flex items-center gap-2.5">
               {!isOwn && !isPrivateForViewer && (
                 <Link
                   href={`/messages/${targetId}`}
                   className="h-10 w-10 flex items-center justify-center rounded-full dark:bg-white/5 bg-slate-100 dark:text-white/70 text-slate-600 dark:border-white/10 border-slate-200 hover:bg-slate-200 transition-all shadow-sm"
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
                    className="px-4 md:px-6 py-2 md:py-2.5 flex items-center justify-center gap-1.5 md:gap-2 rounded-full dark:bg-white/5 bg-slate-100 text-[11px] md:text-sm font-bold dark:text-white text-slate-800 dark:border-white/10 border-slate-200 hover:bg-slate-200 transition-all shadow-sm"
                  >
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-50" />
                    <span className="hidden md:inline">Edit Profile</span>
                    <span className="md:hidden">Edit</span>
                  </Link>
                )}
             </div>
          </div>
        </div>

        {/* Layout Grid (Main Content + Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-8 mt-6 md:mt-8">
           
           {/* Left Column (Main Content) */}
           <div className="space-y-4 md:space-y-8 min-w-0">
             
             {/* Bio Section */}
             {(!isPrivateForViewer && (user.bio || user.university || user.semester)) && (
               <div className="rounded-[22px] border border-border/70 bg-card p-4 md:p-6 shadow-sm md:shadow-xl">
                 <h3 className="text-lg font-black dark:text-white text-slate-800 mb-3">About</h3>
                 {user.bio && (
                   <p className="dark:text-white/60 text-slate-600 font-medium leading-relaxed mb-6">
                     {user.bio}
                   </p>
                 )}
                 <div className="flex flex-wrap gap-5 text-[13px] font-bold dark:text-white/40 text-slate-500">
                   {user.university && (
                     <span className="flex items-center gap-2">
                       <BookOpen className="h-4 w-4 dark:text-white/30 text-slate-400" />
                       {user.university.name}
                     </span>
                   )}
                   {user.semester && (
                     <span className="flex items-center gap-2">
                       <MapPin className="h-4 w-4 dark:text-white/30 text-slate-400" />
                       {user.semester.name}
                     </span>
                   )}
                   <span className="flex items-center gap-2">
                     <Calendar className="h-4 w-4 dark:text-white/30 text-slate-400" />
                     Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                   </span>
                 </div>
               </div>
             )}

             {isPrivateForViewer && (
               <div className="rounded-[24px] border border-orange-500/20 bg-orange-500/5 p-8 text-center text-orange-500 font-bold">
                 This profile is private
               </div>
             )}

             {/* Recent Activity */}
             {!isPrivateForViewer && (
               <div className="rounded-[22px] border border-border/70 bg-card p-4 md:p-6 lg:p-8 shadow-sm md:shadow-xl">
                 <h2 className="mb-6 font-display text-lg font-black dark:text-white text-slate-800">Recent Activity</h2>
                 <UserPosts posts={posts} isOwn={isOwn} />
               </div>
             )}

             {/* Saved Posts (Only visible to owner) */}
             {isOwn && (
               <div className="rounded-[24px] border border-border bg-card p-6 lg:p-8 shadow-xl">
                 <h2 className="mb-6 font-display text-lg font-black dark:text-white text-slate-800">Saved Posts</h2>
                 <SavedPostsSection />
               </div>
             )}
           </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-4 md:space-y-6">
               
               {/* Stats Card — compact 3-col on mobile (Img 7), vertical list on desktop */}
               {!isPrivateForViewer && (
                  <div className="rounded-[22px] border border-border/70 bg-card p-4 md:p-6 shadow-sm md:shadow-xl">
                     <h3 className="text-[10px] md:text-base font-black uppercase tracking-widest dark:text-white/40 text-slate-400 mb-3 md:mb-4">User Stats</h3>
                     
                     <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-4">
                     {[
                       { label: "Points", value: user.points, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
                       { label: "Quizzes", value: user._count.quizAttempts, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
                       { label: "Posts", value: user._count.posts, icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                     ].map(({ label, value, icon: Icon, color, bg }) => (
                       <div key={label} className="flex flex-col md:flex-row md:items-center md:justify-between items-center gap-1 text-center md:text-left">
                          <div className="flex flex-col md:flex-row md:items-center md:gap-3 items-center gap-1">
                             <div className={cn("h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center", bg)}>
                                <Icon className={cn("h-4 w-4 md:h-5 md:w-5", color)} />
                             </div>
                             <span className="text-[9px] md:text-sm font-bold dark:text-white/80 text-slate-700">{label}</span>
                          </div>
                          <span className="text-sm md:text-base font-black dark:text-white text-slate-800">{value}</span>
                       </div>
                     ))}
                     </div>
                  </div>
               )}

              {/* Rank Progress */}
              {!isPrivateForViewer && rankInfo && (
                 <div className="rounded-[22px] border border-border/70 bg-card p-4 md:p-6 shadow-sm md:shadow-xl">
                    <h3 className="text-base font-black uppercase tracking-widest dark:text-white/40 text-slate-400 mb-4">Rank</h3>
                    <div className="flex items-center gap-4 mb-5">
                       <div className="flex h-12 w-12 items-center justify-center rounded-[16px] dark:bg-white/5 bg-slate-100 text-2xl border dark:border-white/10 border-slate-200 shadow-inner">
                          {rankInfo.rank?.badge ?? "🎓"}
                       </div>
                       <div>
                          <p className="font-black text-lg dark:text-white text-slate-800">{rankInfo.rank?.label ?? "Newbie"}</p>
                          <p className="text-[12px] font-medium dark:text-white/50 text-slate-500">{rankInfo.points} points</p>
                       </div>
                    </div>

                    {rankInfo.nextRank ? (
                       <div>
                          <div className="mb-2 flex justify-between text-[11px] font-bold dark:text-white/40 text-slate-500 uppercase tracking-widest">
                             <span>Next: {rankInfo.nextRank.label}</span>
                             <span className="text-primary">{rankInfo.progress}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full dark:bg-white/5 bg-slate-100 border border-border">
                             <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                style={{ width: `${rankInfo.progress}%` }}
                             />
                          </div>
                          <p className="mt-2 text-[10px] dark:text-white/30 text-slate-400 font-bold uppercase tracking-wider text-center">
                             {rankInfo.nextRank.minPoints - rankInfo.points} pts left
                          </p>
                       </div>
                    ) : (
                       <div className="rounded-xl bg-amber-500/10 px-4 py-2.5 text-[11px] text-amber-500 font-bold border border-amber-500/20 text-center uppercase tracking-widest">
                          Elite Achieved
                       </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}


