import { subscribeToForumPosts } from "./firestore";

/**
 * Real-time Failover Service
 * This service ensures that if Firebase Firestore reaches its free tier limits
 * or fails for any reason, the system can fallback to a secondary signaling
 * mechanism (Puter.js Broker) which is also free and supports high concurrency.
 */

export const subscribeToForumsRealtime = (forumId: string, onUpdate: (posts: any[]) => void) => {
  let firebaseUnsubscribe: (() => void) | null = null;
  let puterUnsubscribe: (() => void) | null = null;

  // 1. Try Firebase first (Primary)
  try {
    firebaseUnsubscribe = subscribeToForumPosts(forumId, (posts) => {
      console.log("[Realtime] Update from Firebase");
      onUpdate(posts);
    });
  } catch (err) {
    console.error("[Realtime] Firebase initialization failed, failing over...", err);
    initPuterFallback();
  }

  // 2. Setup Puter.js Fallback (Secondary)
  // Puter is a cloud OS that provides a free message broker for real-time apps.
  async function initPuterFallback() {
    if (typeof window !== "undefined" && (window as any).puter) {
      const puter = (window as any).puter;
      try {
        puterUnsubscribe = await puter.broker.subscribe(`forum-${forumId}`, (data: any) => {
          console.log("[Realtime] Update from Puter Failover");
          // Puter sends single messages, we wrap it in an array to match the UI expectation
          if (data && data.id) {
            onUpdate([data]);
          }
        });
      } catch (e) {
        console.error("[Realtime] Puter fallback failed:", e);
      }
    }
  }

  // Auto-init Puter as a backup listener regardless
  initPuterFallback();

  return () => {
    if (firebaseUnsubscribe) firebaseUnsubscribe();
    if (puterUnsubscribe) puterUnsubscribe();
  };
};

/**
 * Broadcasts a new post to all real-time channels.
 */
export const broadcastPost = async (forumId: string, post: any) => {
  // Puter Broadcast
  if (typeof window !== "undefined" && (window as any).puter) {
    try {
      await (window as any).puter.broker.publish(`forum-${forumId}`, post);
    } catch (e) {
      // Ignore broadcast errors
    }
  }
  // Note: Firebase broadcast is handled server-side in the API route we modified earlier.
};
