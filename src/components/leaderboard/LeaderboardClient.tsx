"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { Search, Crown, TrendingUp, Users, GraduationCap, School } from "lucide-react";
import { cn } from "@/lib/utils";

type PlayerData = {
  id: string;
  name: string;
  nickname: string | null;
  image: string | null;
  points: number;
  rankId: string | null;
  rank: { label: string; badge: string | null } | null;
};

type Scope = "all" | "semester" | "faculty";

type Props = {
  allPlayers: PlayerData[];
  semesterPlayers: PlayerData[] | null;
  facultyPlayers: PlayerData[] | null;
  currentUserId: string;
  currentUserData: PlayerData | null;
  currentUserRanks: { all: number | null; semester: number | null; faculty: number | null };
  totals: { all: number; semester: number | null; faculty: number | null };
  hasScope: { semester: boolean; faculty: boolean };
};

const GLASS = "bg-card/70 backdrop-blur-[40px] border border-border shadow-2xl transition-all duration-500";

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function getAvatarUrl(player: PlayerData): string {
  return (
    player.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`
  );
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="grid h-7 w-7 place-items-center rounded-full bg-amber-500 ring-2 ring-amber-300 shadow">
        <span className="text-sm drop-shadow">🥇</span>
      </div>
    );
  if (rank === 2)
    return (
      <div className="grid h-7 w-7 place-items-center rounded-full bg-gray-300 ring-2 ring-gray-200 shadow">
        <span className="text-sm drop-shadow">🥈</span>
      </div>
    );
  if (rank === 3)
    return (
      <div className="grid h-7 w-7 place-items-center rounded-full bg-orange-400 ring-2 ring-orange-300 shadow">
        <span className="text-sm drop-shadow">🥉</span>
      </div>
    );
  return (
    <span className="text-sm font-black text-muted-foreground">
      #{rank}
    </span>
  );
}

function PodiumCard({
  player,
  rank,
  highlighted,
}: {
  player: PlayerData;
  rank: number;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, type: "spring", stiffness: 120 }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl p-5 md:p-7",
        GLASS,
        highlighted && "ring-2 ring-amber-500/30"
      )}
    >
      <div className="relative">
        {highlighted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-8 left-1/2 z-10 -translate-x-1/2"
          >
            <div className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 shadow-lg">
              <Crown className="h-4 w-4 fill-white text-white" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                #1
              </span>
            </div>
          </motion.div>
        )}
        <div
          className={cn(
            "relative overflow-hidden rounded-full shadow-lg",
            highlighted
              ? "h-20 w-20 ring-4 ring-amber-500/40 md:h-24 md:w-24"
              : "h-16 w-16 ring-2 ring-border"
          )}
        >
          <img
            src={getAvatarUrl(player)}
            alt={player.name}
            className="h-full w-full object-cover"
          />
        </div>
        <span
          className={cn(
            "absolute -bottom-1 left-1/2 grid -translate-x-1/2 place-items-center rounded-full text-xs font-bold text-white shadow-lg",
            rank === 1
              ? "h-7 w-7 bg-amber-500 ring-2 ring-amber-300"
              : "h-6 w-6 bg-primary text-primary-foreground"
          )}
        >
          {rank}
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-foreground truncate max-w-[120px]">
          {player.nickname || player.name}
        </p>
        {player.rank && (
          <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
            {player.rank.label}
          </p>
        )}
      </div>
      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
        <TrendingUp className="h-3 w-3 text-primary" />
        <span className="text-xs font-bold text-primary tabular-nums">
          {player.points.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

function PlayerRow({
  player,
  rank,
  isCurrentUser,
}: {
  player: PlayerData;
  rank: number;
  isCurrentUser?: boolean;
}) {
  return (
    <motion.div
      variants={fadeIn}
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3 md:p-4 transition-all",
        GLASS,
        isCurrentUser && "ring-2 ring-primary/30 bg-primary/[0.03]"
      )}
    >
      <div className="flex w-10 shrink-0 items-center justify-center">
        <MedalIcon rank={rank} />
      </div>

      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
        <img
          src={getAvatarUrl(player)}
          alt={player.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">
            {player.nickname || player.name}
          </p>
          {isCurrentUser && (
            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary">
              You
            </span>
          )}
        </div>
        {player.rank && (
          <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
            {player.rank.label}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-base font-black text-primary tabular-nums tracking-tight">
          {player.points.toLocaleString()}
        </p>
        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
          XP
        </p>
      </div>
    </motion.div>
  );
}

const SCOPE_TABS: { key: Scope; label: string; icon: typeof Users }[] = [
  { key: "all", label: "All", icon: Users },
  { key: "semester", label: "My Semester", icon: GraduationCap },
  { key: "faculty", label: "My Faculty", icon: School },
];

export function LeaderboardClient({
  allPlayers,
  semesterPlayers,
  facultyPlayers,
  currentUserId,
  currentUserData,
  currentUserRanks,
  totals,
  hasScope,
}: Props) {
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");

  const availableTabs = SCOPE_TABS.filter(
    (t) => t.key === "all" || hasScope[t.key as keyof typeof hasScope]
  );

  const activePlayers =
    scope === "semester" && semesterPlayers
      ? semesterPlayers
      : scope === "faculty" && facultyPlayers
        ? facultyPlayers
        : allPlayers;

  const activeTotal = totals[scope] ?? totals.all;
  const activeRank = currentUserRanks[scope];

  const top3 = activePlayers.slice(0, 3);
  const rest = activePlayers.slice(3);

  const filteredRest = search
    ? rest.filter((p) =>
        (p.nickname || p.name).toLowerCase().includes(search.toLowerCase())
      )
    : rest;

  const showCurrentUser =
    currentUserData &&
    !activePlayers.some((p) => p.id === currentUserData.id);

  return (
    <div className="pb-8">
      {/* Scope tabs */}
      {availableTabs.length > 1 && (
        <div className="relative mt-6 mb-8 flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
          {availableTabs.map((t) => {
            const active = scope === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setScope(t.key)}
                className="relative flex-1 rounded-full py-2 text-sm font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="leaderboard-scope-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 inline-flex items-center gap-1.5",
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Podium (Top 3) — order: 2nd, 1st, 3rd */}
      {top3.length > 0 && (
        <div className="mb-10 grid grid-cols-3 items-end gap-3 md:gap-6">
          {top3[1] && <PodiumCard player={top3[1]} rank={2} />}
          {top3[0] && <PodiumCard player={top3[0]} rank={1} highlighted />}
          {top3[2] && <PodiumCard player={top3[2]} rank={3} />}
        </div>
      )}

      {/* Column headers */}
      {filteredRest.length > 0 && (
        <div className="mb-3 grid grid-cols-[40px_44px_1fr_auto] items-center gap-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Rank</span>
          <span />
          <span>Player</span>
          <span>Points</span>
        </div>
      )}

      {/* Ranked list */}
      {filteredRest.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          key={scope}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredRest.map((player, i) => (
            <PlayerRow
              key={player.id}
              player={player}
              rank={i + 4}
              isCurrentUser={player.id === currentUserId}
            />
          ))}
        </motion.div>
      ) : search ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm font-semibold">No players found</p>
          <p className="mt-1 text-xs">Try a different search term</p>
        </div>
      ) : null}

      {/* Current user entry (if not in top 100) */}
      {showCurrentUser && currentUserData && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span className="font-semibold uppercase tracking-wider">
              Your Position
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <PlayerRow
            player={currentUserData}
            rank={activeRank ?? activeTotal}
            isCurrentUser
          />
        </div>
      )}
    </div>
  );
}
