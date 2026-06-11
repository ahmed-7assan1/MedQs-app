"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/lib/store";
import { formatDistanceToNow, cn } from "@/lib/utils";
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

function NotifChannelIcon({ channel }: { channel: string }) {
  if (channel === "FORUM") return <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />;
  if (channel === "BROADCAST") return <SpeakerWaveIcon className="h-3.5 w-3.5" />;
  return <InformationCircleIcon className="h-3.5 w-3.5" />;
}

function NotifChannelBg({ channel }: { channel: string }) {
  if (channel === "BROADCAST") return "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
  if (channel === "FORUM") return "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
  return "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40";
}

export function NotificationsSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, unread, markRead, markAllRead, setNotifications } = useNotificationStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (notifications.length === 0) {
        setLoading(true);
        fetch("/api/v1/notifications")
          .then((r) => r.json())
          .then((data) => setNotifications(Array.isArray(data) ? data : []))
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm md:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[201] flex flex-col rounded-t-[28px] bg-card border-t border-border shadow-2xl overflow-hidden h-[88vh] md:hidden"
          >
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0" onClick={onClose}>
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/30">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 text-[10px] font-bold transition-all"
                  >
                    <CheckIcon className="h-3 w-3" /> All read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white transition-all"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {loading ? (
                <div className="space-y-2 pt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] animate-pulse">
                      <div className="h-8 w-8 rounded-xl bg-gray-200 dark:bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-white/5" />
                        <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-white/[0.02]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-white/30">
                  <BellIcon className="mb-3 h-10 w-10 opacity-30" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1 opacity-60">Stay tuned for updates</p>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.99]",
                        !n.read
                          ? "bg-indigo-50 dark:bg-indigo-500/[0.06] border border-indigo-100 dark:border-indigo-500/15"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        NotifChannelBg({ channel: n.channel })
                      )}>
                        <NotifChannelIcon channel={n.channel} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-semibold", !n.read ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/50")}>
                            {n.title}
                          </p>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                        </div>
                        <p className={cn("mt-0.5 text-xs leading-relaxed line-clamp-2", !n.read ? "text-gray-600 dark:text-white/70" : "text-gray-400 dark:text-white/40")}>
                          {n.body}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-gray-400 dark:text-white/20">
                          {formatDistanceToNow(new Date(n.createdAt))}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
