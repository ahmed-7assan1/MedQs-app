import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "./config";

// The VAPID key provided by the user
const VAPID_KEY = "BMy7YbWfTcR8aOcNwaNOugg7ZJDFfjGgF7DdMzggPo1_W-ez8YNOVu4s4FvgVI2y8Z89RSUAewrZESnOONn24kE";

export const requestNotificationPermission = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Firebase Messaging is not supported in this browser.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log("FCM Token:", token);
        // Here you would typically send the token to your database
        // await fetch('/api/user/fcm-token', { method: 'POST', body: JSON.stringify({ token }) })
        return token;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.log("Unable to get permission to notify.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });
