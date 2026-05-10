import { db } from "./config";
import { collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, getDocs, writeBatch } from "firebase/firestore";
import { Thread } from "@/hooks/useDrQChat";

export const saveThreadToFirestore = async (userId: string, thread: Thread) => {
  if (!userId || !thread) return;
  try {
    const threadRef = doc(db, `users/${userId}/drq_threads/${thread.id}`);
    await setDoc(threadRef, thread, { merge: true });
  } catch (error) {
    console.error("Error saving thread to Firestore:", error);
  }
};

export const subscribeToThreads = (userId: string, callback: (threads: Thread[]) => void) => {
  if (!userId) return () => {};
  
  const q = query(
    collection(db, `users/${userId}/drq_threads`),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const threads: Thread[] = [];
    snapshot.forEach((doc) => {
      threads.push(doc.data() as Thread);
    });
    callback(threads);
  });
};

export const syncAllThreadsToFirestore = async (userId: string, threads: Thread[]) => {
  if (!userId || !threads.length) return;
  try {
    const batch = writeBatch(db);
    threads.forEach(thread => {
      const threadRef = doc(db, `users/${userId}/drq_threads/${thread.id}`);
      batch.set(threadRef, thread, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error batch syncing threads to Firestore:", error);
  }
};

// ─── Forum Sync Utilities ──────────────────────────────────────────────────

export const subscribeToForumPosts = (forumId: string, callback: (posts: any[]) => void) => {
  if (!forumId) return () => {};
  
  const q = query(
    collection(db, `forums/${forumId}/posts`),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const posts: any[] = [];
    snapshot.forEach((doc) => {
      posts.push(doc.data());
    });
    callback(posts);
  });
};
