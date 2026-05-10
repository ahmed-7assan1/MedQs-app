"use client";

import { useEffect } from "react";
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase/messaging";
import toast from "react-hot-toast";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Request notification permission and get token
    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        // You can save the token to your database here if needed
        console.log("FCM Setup Complete");
      }
    };

    setupNotifications();

    // Listen for foreground messages
    const listenForMessages = async () => {
      try {
        const payload: any = await onMessageListener();
        if (payload?.notification) {
          toast(
            (t) => (
              <div className="flex flex-col gap-1">
                <span className="font-bold">{payload.notification.title}</span>
                <span className="text-sm">{payload.notification.body}</span>
              </div>
            ),
            { duration: 4000, position: "top-right", icon: "🔔" }
          );
        }
      } catch (err) {
        console.log("FCM Listener error:", err);
      }
    };

    listenForMessages();
  }, []);

  return <>{children}</>;
}
