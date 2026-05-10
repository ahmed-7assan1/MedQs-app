importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBafWJBYdU2CIDtwXqkO85e1YTB4nJJTqE",
  authDomain: "medonex-2026.firebaseapp.com",
  projectId: "medonex-2026",
  storageBucket: "medonex-2026.firebasestorage.app",
  messagingSenderId: "111075734158",
  appId: "1:111075734158:web:94771da7637351c7264fdf",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192x192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
