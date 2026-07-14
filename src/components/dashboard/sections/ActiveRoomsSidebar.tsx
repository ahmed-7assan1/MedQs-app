"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarLabel } from "@/components/dashboard/shared/SidebarLabel";

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
  WAITING: { label: "Waiting", dot: "bg-amber-400", pulse: false },
  ACTIVE: { label: "Studying", dot: "bg-primary", pulse: true },
  PAUSED: { label: "Paused", dot: "bg-muted-foreground/45", pulse: false },
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
  const visibleSessions = sessions.slice(0, 3);
  const visibleRooms = fallbackRooms.slice(0, 3);

  return (
    <div className="space-y-3">
      <SidebarLabel icon={DoorOpen} label={hasActive ? "Active Sessions" : "Study Rooms"} />

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : hasActive ? (
        <div className="space-y-2">
          {visibleSessions.map((s) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.WAITING;
            return (
              <Link
                key={s.id}
                href={`/rooms/${s.room.id}`}
                className="group flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm hover:border-primary/20 hover:bg-card/65 transition-[transform,opacity,border-color,background-color] duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex items-center shrink-0">
                    <span className={cn("h-2 w-2 rounded-full", cfg.dot, cfg.pulse && "animate-ping absolute inset-0 opacity-75")} />
                    <span className={cn("h-2 w-2 rounded-full relative", cfg.dot)} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 truncate group-hover:text-primary transition-colors leading-none">
                    {s.room.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-muted-foreground/50">
                  <Users className="h-3 w-3" />
                  <span className="tabular-nums">{s._count.participants}</span>
                </div>
              </Link>
            );
          })}
          
          <Link
            href="/community"
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground/45 hover:text-primary transition-all pt-1 pl-1"
          >
            Browse rooms <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : visibleRooms.length > 0 ? (
        <div className="space-y-2">
          {visibleRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="group flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm hover:border-primary/20 hover:bg-card/65 transition-[transform,opacity,border-color,background-color] duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {room.image ? (
                  <img src={room.image} alt={room.name} className="h-6 w-6 rounded-lg object-cover shrink-0" loading="lazy" />
                ) : (
                  <DoorOpen className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                )}
                <span className="text-xs font-bold text-foreground/80 truncate group-hover:text-primary transition-colors leading-none">
                  {room.name}
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
          
          <Link
            href="/community"
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground/45 hover:text-primary transition-all pt-1 pl-1"
          >
            Browse rooms <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-border/40 bg-card/20 text-center">
          <p className="text-[11px] font-bold text-muted-foreground/60">No active study sessions</p>
        </div>
      )}
    </div>
  );
}
