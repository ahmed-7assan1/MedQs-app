import { db } from "./config";
import {
  collection, doc, setDoc, getDoc, onSnapshot,
  query, orderBy, limit, addDoc, serverTimestamp, Timestamp,
  where, updateDoc, deleteDoc,
} from "firebase/firestore";

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  text: string;
  createdAt: Date;
}

export interface RoomTimerState {
  sessionId: string;
  status: "WAITING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startedAt: number | null;
  pausedAt: number | null;
  totalPauseMs: number;
  targetDuration: number;
  serverNow: number;
}

function roomChatRef(roomId: string) {
  return collection(db, "rooms", roomId, "messages");
}

function roomTimerRef(roomId: string) {
  return doc(db, "rooms", roomId, "timer", "state");
}

export function subscribeToRoomChat(
  roomId: string,
  callback: (messages: RoomChatMessage[]) => void
) {
  const q = query(roomChatRef(roomId), orderBy("createdAt", "asc"), limit(200));
  return onSnapshot(q, (snapshot) => {
    const msgs: RoomChatMessage[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      msgs.push({
        id: d.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderImage: data.senderImage,
        text: data.text,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      });
    });
    callback(msgs);
  });
}

export async function sendChatMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  senderImage: string | undefined,
  text: string
) {
  await addDoc(roomChatRef(roomId), {
    senderId,
    senderName,
    senderImage: senderImage ?? null,
    text,
    createdAt: serverTimestamp(),
  });
}

export async function deleteChatMessage(roomId: string, messageId: string) {
  await deleteDoc(doc(db, "rooms", roomId, "messages", messageId));
}

export function subscribeToRoomTimer(
  roomId: string,
  callback: (timer: RoomTimerState | null) => void
) {
  return onSnapshot(roomTimerRef(roomId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.data();
    callback({
      sessionId: data.sessionId,
      status: data.status,
      startedAt: data.startedAt?.toMillis?.() ?? data.startedAt ?? null,
      pausedAt: data.pausedAt?.toMillis?.() ?? data.pausedAt ?? null,
      totalPauseMs: data.totalPauseMs ?? 0,
      targetDuration: data.targetDuration ?? 25,
      serverNow: Timestamp.now().toMillis(),
    });
  });
}

export async function setRoomTimer(
  roomId: string,
  timer: Omit<RoomTimerState, "serverNow">
) {
  await setDoc(roomTimerRef(roomId), {
    ...timer,
    startedAt: timer.startedAt ? Timestamp.fromMillis(timer.startedAt) : null,
    pausedAt: timer.pausedAt ? Timestamp.fromMillis(timer.pausedAt) : null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function clearRoomTimer(roomId: string) {
  await deleteDoc(roomTimerRef(roomId));
}
