"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

interface RoomData {
  id: string;
  name: string;
  image: string | null;
}

export function ActiveRoomsSidebar() {
  const [rooms, setRooms] = useState<RoomData[]>([]);

  useEffect(() => {
    fetch("/api/v1/rooms")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]));
  }, []);

  const visible = rooms.slice(0, 5);

  return (
    <div>
      <SectionHeader icon={DoorOpen} title="Rooms" />
      <div className="flex gap-3 overflow-x-auto mt-2 pb-1 snap-x snap-mandatory scroll-smooth [-webkit-scrollbar]:hidden">
        {visible.map((room) => (
          <Link
            key={room.id}
            href={`/teams/${room.id}`}
            className="flex flex-col items-center gap-1 shrink-0 snap-start"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted/30 border border-border/40 ring-1 ring-border/20 shrink-0">
              {room.image ? (
                <img src={room.image} alt={room.name} className="h-full w-full object-cover" />
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
    </div>
  );
}
