"use client";
import { useEffect } from "react";
import { useNotificationStore } from "@/lib/store";

export function NotificationsLoader({ userId }: { userId: string }) {
  const { setNotifications, addNotification } = useNotificationStore();

  useEffect(() => {
    // Load initial notifications
    fetch("/api/v1/notifications")
      .then((r) => r.json())
      .then(setNotifications)
      .catch(() => {});

    // Poll every 30s as lightweight alternative to full WebSocket
    // (WebSocket server would need a separate Node server or Pusher/Ably)
    const interval = setInterval(() => {
      fetch("/api/v1/notifications")
        .then((r) => r.json())
        .then(setNotifications)
        .catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, [userId, setNotifications, addNotification]);

  return null;
}
