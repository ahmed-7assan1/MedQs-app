"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/markdown-helpers";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

interface ActiveSession {
  id: string;
  status: "WAITING" | "ACTIVE" | "PAUSED";
  startedAt: string;
  room: {
    id: string;
    name: string;
    image: string | null;
  };
  startedBy: {
    id: string;
    name: string;
    image: string | null;
  };
  _count: {
    participants: number;
  };
}

interface RoomData {
  id: string;
  name: string;
  image: string | null;
}

const STATUS_CONFIG = {
  WAITING: { label: "Waiting", dot: "bg-yellow-400", pulse: false },
  ACTIVE: { label: "Studying", dot: "bg-green-400", pulse: true },
  PAUSED: { label: "Paused", dot: "bg-amber-400", pulse: false },
} as const;

export function ActiveRoomsSidebar() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [fallbackRooms, setFallbackRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/sessions/active")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setSessions(arr);
        if (arr.length === 0) {
          return fetch("/api/v1/rooms")
            .then((r) => r.ok ? r.json() : [])
            .then((rooms) => setFallbackRooms(Array.isArray(rooms) ? rooms : []));
        }
      })
      .catch(() => fetch("/api/v1/rooms").then((r) => r.ok ? r.json() : []).then((rooms) => setFallbackRooms(Array.isArray(rooms) ? rooms : [])).catch(() => {}))
      .finally(() => setLoading(false));
  }, []);

  const hasActive = sessions.length > 0;
  const visibleSessions = sessions.slice(0, 5);
  const visibleRooms = fallbackRooms.slice(0, 5);

  return (
    <div className="min-h-[90px]">
      <SectionHeader icon={DoorOpen} title={hasActive ? "Active Sessions" : "Rooms"} />

      {hasActive ? (
        <div className="flex flex-col gap-1 mt-2">
          {visibleSessions.map((s) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.WAITING;
            return (
              <Link
                key={s.id}
                href={`/teams/${s.room.id}`}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/40 transition-all group"
              >
                <div className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot, cfg.pulse && "animate-pulse")} />
                <div className="h-7 w-7 rounded-full overflow-hidden bg-muted/30 border border-border/40 shrink-0">
                  {s.room.image ? (
                    <img src={normalizeImageUrl(s.room.image)} alt={s.room.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {s.room.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground truncate min-w-0 flex-1 group-hover:text-primary transition-colors">
                  {s.room.name}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-medium shrink-0 whitespace-nowrap">
                  {s._count.participants} {cfg.label}
                </span>
              </Link>
            );
          })}
          <Link
            href="/community"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/30 transition-all text-[10px] font-bold text-muted-foreground/50 hover:text-muted-foreground/80"
          >
            <Users className="h-3 w-3" />
            <span>Browse all rooms</span>
          </Link>
        </div>
      ) : loading ? null : visibleRooms.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto mt-2 pb-1 snap-x snap-mandatory scroll-smooth [-webkit-scrollbar]:hidden">
          {visibleRooms.map((room) => (
            <Link
              key={room.id}
              href={`/teams/${room.id}`}
              className="flex flex-col items-center gap-1 shrink-0 snap-start"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted/30 border border-border/40 ring-1 ring-border/20 shrink-0">
                {room.image ? (
                  <img src={normalizeImageUrl(room.image)} alt={room.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {room.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-medium text-muted-foreground/70 truncate max-w-14 text-center leading-tight">
                {room.name}
              </span>
            </Link>
          ))}
          <Link
            href="/community"
            className="flex flex-col items-center justify-center gap-1 shrink-0 snap-start"
          >
            <div className="h-10 w-10 rounded-full bg-muted/20 border border-dashed border-border/40 flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-bold">+</span>
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/50">More</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
