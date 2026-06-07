"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceUser {
  userId: string;
  name: string;
  image?: string;
  onlineAt: string;
}

let channelCounter = 0;

export function useRoomPresence(roomId: string, userId: string | undefined, userName: string | undefined, userImage?: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const setupKeyRef = useRef<string>("");

  useEffect(() => {
    if (!roomId || !userId || !userName) return;

    const key = `${roomId}-${userId}-${++channelCounter}`;
    if (setupKeyRef.current === key) return;
    setupKeyRef.current = key;

    const supabase = createClient();
    const topic = `room:${roomId}:${channelCounter}`;
    const channel = supabase.channel(topic, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        const presences = state[key] as any[];
        for (const p of presences) {
          users.push({
            userId: key,
            name: p.name ?? "Unknown",
            image: p.image,
            onlineAt: p.online_at ?? new Date().toISOString(),
          });
        }
      }
      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId,
          name: userName,
          image: userImage,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, userName, userImage]);

  return { onlineUsers };
}
