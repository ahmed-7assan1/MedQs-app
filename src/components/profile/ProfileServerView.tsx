import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserForProfile } from "@/lib/fetch-user-for-profile";
import { notFound, redirect } from "next/navigation";
import { getUserRankInfo } from "@/lib/engagement";
import { Trophy, BookOpen, MessageSquare, Calendar, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { UserPosts } from "@/components/profile/UserPosts";
import { StudentPageShell } from "@/components/layout/StudentPageShell";

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
    <StudentPageShell
      maxWidthClass="max-w-2xl"
      eyebrow="Student profile"
      title={user.name ?? "Member"}
      subtitle={subtitleParts.length ? subtitleParts.join(" · ") : undefined}
    >
      <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-md shadow-black/[0.04] ring-1 ring-black/[0.04] dark:shadow-black/20 dark:ring-white/[0.06]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover ring-2 ring-primary/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary ring-2 ring-primary/15">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {user.nickname && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    @{user.nickname}
                  </span>
                )}
                {user.rank && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {user.rank.badge} {user.rank.label}
                  </span>
                )}
              </div>
              {!isPrivateForViewer && user.bio && (
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{user.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {!isPrivateForViewer && user.university && <span>{user.university.name}</span>}
                {!isPrivateForViewer && user.semester && <span>{user.semester.name}</span>}
                {!isPrivateForViewer && user.phoneVisible && user.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 opacity-70" />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              {!isPrivateForViewer && (user.instagramUrl || user.facebookUrl) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {user.instagramUrl && (
                    <a
                      href={user.instagramUrl}
                      className="rounded-full bg-muted px-2 py-1 hover:bg-muted/70"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  )}
                  {user.facebookUrl && (
                    <a
                      href={user.facebookUrl}
                      className="rounded-full bg-muted px-2 py-1 hover:bg-muted/70"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              )}
              {isPrivateForViewer && (
                <p className="mt-2 text-xs text-muted-foreground">
                  This profile is private. Only basic information is visible.
                </p>
              )}
            </div>
          </div>

          {isOwn && (
            <Link
              href="/profile/edit"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/60"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {!isPrivateForViewer && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Points", value: user.points, icon: Trophy, color: "text-amber-500" },
            { label: "Quizzes", value: user._count.quizAttempts, icon: BookOpen, color: "text-blue-500" },
            { label: "Posts", value: user._count.posts, icon: MessageSquare, color: "text-violet-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl border border-border/70 bg-card p-4 text-center shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.05]"
            >
              <Icon className={`mx-auto mb-2 h-5 w-5 ${color}`} />
              <p className="font-display text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {!isPrivateForViewer && rankInfo && (
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.05]">
          <h2 className="mb-4 font-display text-lg font-semibold">Rank Progress</h2>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-900/30">
              {rankInfo.rank?.badge ?? "🎓"}
            </div>
            <div>
              <p className="font-semibold">{rankInfo.rank?.label ?? "Newbie"}</p>
              <p className="text-sm text-muted-foreground">{rankInfo.points} points earned</p>
            </div>
          </div>

          {rankInfo.nextRank ? (
            <>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Progress to {rankInfo.nextRank.label}</span>
                <span>{rankInfo.progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${rankInfo.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {rankInfo.nextRank.minPoints - rankInfo.points} points until {rankInfo.nextRank.label}
              </p>
            </>
          ) : (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Maximum rank achieved — you&apos;re Elite!
            </div>
          )}
        </div>
      )}

      {!isPrivateForViewer && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-xl font-semibold">Forum Posts</h2>
          <UserPosts posts={posts} isOwn={isOwn} />
        </div>
      )}
    </StudentPageShell>
  );
}
