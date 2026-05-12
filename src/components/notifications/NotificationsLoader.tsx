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

    // Notifications are loaded once on mount.
    // Real-time updates are handled via Firebase Cloud Messaging (FCM) in FirebaseProvider.tsx
    // to prevent hammering the database with 30-second polling intervals across 5000+ users.
  }, [userId, setNotifications, addNotification]);

  return null;
}
