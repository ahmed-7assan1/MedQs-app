"use client";

import { useEffect, useMemo } from "react";
import { Bell, CheckCheck, Info, Megaphone, MessageSquare, Inbox } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { useNotificationStore } from "@/lib/store";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

interface ChannelStyle {
  icon: typeof Info;
  label: string;
  accent: string;
  bg: string;
  lightBg: string;
  border: string;
}

const CHANNEL_STYLE: Record<string, ChannelStyle> = {
  BROADCAST: {
    icon: Megaphone,
    label: "Broadcasts",
    accent: "text-amber-500",
    bg: "bg-amber-500/10",
    lightBg: "bg-amber-500/[0.03]",
    border: "border-l-amber-500/40",
  },
  FORUM: {
    icon: MessageSquare,
    label: "Forum",
    accent: "text-blue-500",
    bg: "bg-blue-500/10",
    lightBg: "bg-blue-500/[0.03]",
    border: "border-l-blue-500/40",
  },
  OTHER: {
    icon: Info,
    label: "Other",
    accent: "text-muted-foreground/40",
    bg: "bg-muted/20",
    lightBg: "bg-transparent",
    border: "border-l-muted-foreground/20",
  },
};

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, unread, setNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    if (open && notifications.length === 0) {
      fetch("/api/v1/notifications")
        .then((r) => r.json())
        .then((data) => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [open]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    notifications.forEach((n) => {
      const key = n.channel || "OTHER";
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  }, [notifications]);

  const isEmpty = Object.keys(grouped).length === 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="flex flex-col p-0 gap-0 border-l-0 sm:max-w-sm">
        {/* ── Header ── */}
        <SheetHeader className="shrink-0 px-5 pt-6 pb-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-foreground leading-tight">
                  Notifications
                </SheetTitle>
                <p className="text-[10px] font-medium text-muted-foreground/50 mt-0.5">
                  Stay updated with your activity
                </p>
              </div>
            </div>
            {unread > 0 && (
              <span className="text-[10px] font-bold text-white bg-primary min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full leading-none">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors self-start"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-muted-foreground px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20 mb-4">
                <Inbox className="h-7 w-7 opacity-30" />
              </div>
              <p className="text-sm font-semibold text-foreground/60">All caught up</p>
              <p className="text-xs mt-1 text-muted-foreground/40 text-center leading-relaxed">
                No notifications yet. Engage with the community to see updates here.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([channel, items]) => {
              const style = CHANNEL_STYLE[channel] || CHANNEL_STYLE.OTHER;
              const Icon = style.icon;
              const channelUnread = items.filter((n) => !n.read).length;
              return (
                <div key={channel} className={cn("px-4 py-4 border-b border-border/10 last:border-b-0", style.lightBg)}>
                  {/* Channel header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded-lg", style.bg)}>
                      <Icon className={cn("h-3 w-3", style.accent)} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
                      {style.label}
                    </span>
                    {channelUnread > 0 && (
                      <span className={cn("text-[10px] font-bold ml-auto", style.accent)}>
                        {channelUnread} new
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {items.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150",
                          "hover:bg-muted/20 active:scale-[0.99]",
                          !n.read
                            ? "bg-card border border-border/15 shadow-sm"
                            : "border border-transparent"
                        )}
                      >
                        {/* Colored left accent for unread */}
                        {!n.read && (
                          <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary" />
                        )}
                        <div className="min-w-0 flex-1 relative">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-xs leading-snug",
                              !n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground/70"
                            )}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            )}
                          </div>
                          {n.body && (
                            <p className={cn(
                              "mt-0.5 text-[11px] leading-relaxed line-clamp-2",
                              !n.read ? "text-muted-foreground/80" : "text-muted-foreground/50"
                            )}>
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1.5 text-[9px] font-medium text-muted-foreground/30">
                            {formatDistanceToNow(new Date(n.createdAt))}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
