import { createClient } from "@/lib/supabase/server";
import { prisma, withRetry } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

const PLAYER_SELECT = {
  id: true,
  name: true,
  nickname: true,
  image: true,
  points: true,
  rankId: true,
  rank: { select: { label: true, badge: true } },
} as const;

async function fetchLeaderboard(where: Record<string, unknown>) {
  return prisma.user.findMany({
    where: { points: { gt: 0 }, hideRank: false, ...where } as any,
    orderBy: { points: "desc" },
    take: 100,
    select: PLAYER_SELECT,
  });
}

export default async function LeaderboardPage() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth?mode=login");

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, semesterId: true, facultyId: true },
  });

  const semesterId = dbUser?.semesterId || authUser.user_metadata?.semesterId as string | undefined;
  const facultyId = dbUser?.facultyId || authUser.user_metadata?.facultyId as string | undefined;

  const [allPlayers, semesterPlayers, facultyPlayers, totalPlayers, semesterTotal, facultyTotal] = await withRetry(() =>
    Promise.all([
      fetchLeaderboard({}),
      semesterId ? fetchLeaderboard({ semesterId }) : Promise.resolve(null),
      facultyId ? fetchLeaderboard({ facultyId }) : Promise.resolve(null),
      prisma.user.count({ where: { points: { gt: 0 }, hideRank: false } }),
      semesterId
        ? prisma.user.count({ where: { points: { gt: 0 }, hideRank: false, semesterId } })
        : Promise.resolve(null),
      facultyId
        ? prisma.user.count({ where: { points: { gt: 0 }, hideRank: false, facultyId } })
        : Promise.resolve(null),
    ])
  );

  function findCurrentUser(players: typeof allPlayers) {
    return players.find((p) => p.id === authUser!.id) || null;
  }

  const currentUserInAll = findCurrentUser(allPlayers);
  const currentUserInSemester = semesterPlayers ? findCurrentUser(semesterPlayers) : null;
  const currentUserInFaculty = facultyPlayers ? findCurrentUser(facultyPlayers) : null;

  const currentUserData = currentUserInAll ||
    (await withRetry(() =>
      prisma.user.findUnique({
        where: { id: authUser.id },
        select: PLAYER_SELECT,
      })
    ));

  return (
    <StudentPageShell maxWidthClass="max-w-7xl">
      <LeaderboardClient
        allPlayers={allPlayers}
        semesterPlayers={semesterPlayers}
        facultyPlayers={facultyPlayers}
        currentUserId={authUser.id}
        currentUserData={currentUserData}
        currentUserRanks={{
          all: currentUserInAll ? allPlayers.findIndex((p) => p.id === authUser.id) + 1 : null,
          semester: currentUserInSemester && semesterPlayers
            ? semesterPlayers.findIndex((p) => p.id === authUser.id) + 1 : null,
          faculty: currentUserInFaculty && facultyPlayers
            ? facultyPlayers.findIndex((p) => p.id === authUser.id) + 1 : null,
        }}
        totals={{ all: totalPlayers, semester: semesterTotal, faculty: facultyTotal }}
        hasScope={{ semester: !!semesterId, faculty: !!facultyId }}
      />
    </StudentPageShell>
  );
}
