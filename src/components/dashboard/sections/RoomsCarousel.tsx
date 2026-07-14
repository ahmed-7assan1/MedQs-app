"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DoorOpen, ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

interface RoomMember {
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface RoomItem {
  id: string;
  name: string;
  image: string | null;
  members: RoomMember[];
  _count: {
    members: number;
  };
}

const FALLBACK_GRADIENTS = [
  "from-blue-500/20 to-blue-600/20",
  "from-violet-500/20 to-violet-600/20",
  "from-emerald-500/20 to-emerald-600/20",
  "from-rose-500/20 to-rose-600/20",
  "from-amber-500/20 to-amber-600/20",
  "from-cyan-500/20 to-cyan-600/20",
];

function RoomCard({ room, index }: { room: RoomItem; index: number }) {
  const firstLetter = room.name.charAt(0).toUpperCase();
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const memberAvatars = room.members.slice(0, 3);
  const remainingCount = Math.max(0, room._count.members - 3);

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
    >
      <div className="h-20 w-20 rounded-3xl border-2 dark:border-white/[0.05] border-slate-200 p-1 group-hover:border-primary/40 group-hover:rotate-3 transition-all duration-500 overflow-hidden shadow-sm">
        <div className="h-full w-full rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 dark:bg-[#1a1a1a] bg-slate-100">
          {room.image ? (
            <img
              src={room.image}
              alt={room.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br", gradient)}>
              <span className="text-lg font-black text-foreground/40">{firstLetter}</span>
            </div>
          )}
        </div>
      </div>

      <span className="text-[10px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400 group-hover:text-primary transition-colors text-center px-1 truncate max-w-[90px]">
        {room.name}
      </span>

      <div className="flex items-center gap-1 -mt-0.5">
        <div className="flex -space-x-1.5">
          {memberAvatars.map((member) => (
            <Avatar key={member.user.id} className="h-5 w-5 rounded-full border-2 border-background shrink-0">
              {member.user.image ? (
                <AvatarImage src={member.user.image} alt={member.user.name} />
              ) : null}
              <AvatarFallback className="text-[6px] font-black bg-primary/10 text-primary">
                {member.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {remainingCount > 0 && (
          <span className="text-[9px] font-bold text-muted-foreground/50">+{remainingCount}</span>
        )}
        {room._count.members === 0 && (
          <Users className="h-3 w-3 text-muted-foreground/30" />
        )}
      </div>
    </Link>
  );
}

function RoomsCarouselSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-4 w-4 rounded bg-muted/40" />
        <div className="h-3 w-20 rounded bg-muted/40" />
      </div>
      <div className="flex items-center gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="h-20 w-20 rounded-3xl bg-muted/20" />
            <div className="h-2.5 w-16 rounded bg-muted/30" />
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-5 w-5 rounded-full bg-muted/30" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const RoomsCarousel = memo(function RoomsCarousel() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/rooms")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <RoomsCarouselSkeleton />;

  if (!rooms.length) {
    return (
      <div>
        <SectionHeader icon={DoorOpen} title="Study Rooms" />
        <Button variant="outline" asChild className="w-full p-0 h-auto rounded-xl border-dashed bg-card/30 hover:bg-card/50">
          <Link href="/community" className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <DoorOpen className="h-7 w-7 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-bold text-foreground">No rooms available</p>
                <p className="text-xs text-muted-foreground">Join or create a study room to collaborate with peers</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader icon={DoorOpen} title="Study Rooms" />

      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
        {rooms.map((room, idx) => (
          <RoomCard key={room.id} room={room} index={idx} />
        ))}
      </div>
    </div>
  );
});
