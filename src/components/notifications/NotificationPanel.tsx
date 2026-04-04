"use client";
import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/lib/store";
import { Bell, CheckCheck, Info, Megaphone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils";

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const channelIcon = (channel: string) => {
    if (channel === "FORUM") return <MessageSquare className="h-3.5 w-3.5" />;
    if (channel === "BROADCAST") return <Megaphone className="h-3.5 w-3.5" />;
    return <Info className="h-3.5 w-3.5" />;
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-50 w-80 animate-fade-in rounded-xl border border-border bg-card shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-semibold">Notifications</span>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          All read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                !n.read && "bg-primary/5"
              )}
            >
              <div className={cn(
                "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                n.channel === "BROADCAST" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                n.channel === "FORUM" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                "bg-muted text-muted-foreground"
              )}>
                {channelIcon(n.channel)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-xs font-medium", !n.read && "text-foreground")}>{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt))}
                </p>
              </div>
              {!n.read && (
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
