import Dexie, { type Table } from "dexie";
import type { LectureCache, LectureItems, ChatThread, ChatMessage, LectureMeta } from "./medonix-cache.types";

export const LECTURE_CACHE_TTL = 7 * 24 * 60 * 60;

export class MedonixCacheDB extends Dexie {
  lectures!: Table<LectureCache, string>;
  lecture_items!: Table<LectureItems, [string, string]>;
  chat_threads!: Table<ChatThread, string>;
  chat_messages!: Table<ChatMessage, string>;
  lecture_meta!: Table<LectureMeta, string>;

  constructor() {
    super("medonix-cache");

    this.version(1).stores({
      lectures: "&lectureId",
      lecture_items: "&[lectureId+itemType]",
      chat_threads: "&threadId",
      chat_messages: "&id, threadId, lectureId, timestamp",
      lecture_meta: "&lectureId",
    });
  }
}

const db = new MedonixCacheDB();

export default db;

// ─── Lecture helpers ──────────────────────────────────────────────────────────

export async function getCachedLecture(lectureId: string): Promise<LectureCache | undefined> {
  return db.lectures.get(lectureId);
}

export async function setCachedLecture(lecture: LectureCache): Promise<void> {
  await db.lectures.put({ ...lecture, cachedAt: Date.now() });
}

export async function removeCachedLecture(lectureId: string): Promise<void> {
  await db.lectures.delete(lectureId);
}

export async function isLectureExpired(lecture: LectureCache): Promise<boolean> {
  return Date.now() - lecture.cachedAt > LECTURE_CACHE_TTL * 1000;
}

// ─── Lecture Items helpers ────────────────────────────────────────────────────

export async function getCachedItems(
  lectureId: string,
  itemType: LectureItems["itemType"]
): Promise<LectureItems | undefined> {
  return db.lecture_items.get([lectureId, itemType]);
}

export async function setCachedItems(items: LectureItems): Promise<void> {
  await db.lecture_items.put(items);
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────

export async function getThreadsByLecture(lectureId: string): Promise<ChatThread[]> {
  return db.chat_threads
    .where("lectureId")
    .equals(lectureId)
    .toArray();
}

export async function getAllThreads(): Promise<ChatThread[]> {
  return db.chat_threads
    .orderBy("lastMessageAt")
    .reverse()
    .toArray();
}

export async function upsertThread(thread: ChatThread): Promise<void> {
  await db.chat_threads.put(thread);
}

export async function getMessagesByThread(threadId: string): Promise<ChatMessage[]> {
  return db.chat_messages
    .where("threadId")
    .equals(threadId)
    .sortBy("timestamp");
}

export async function addMessage(message: ChatMessage): Promise<void> {
  await db.chat_messages.put(message);
}

export async function deleteThread(threadId: string): Promise<void> {
  await db.chat_messages.where("threadId").equals(threadId).delete();
  await db.chat_threads.delete(threadId);
}

// ─── Meta helpers ─────────────────────────────────────────────────────────────

export async function getCachedMeta(lectureId: string): Promise<LectureMeta | undefined> {
  return db.lecture_meta.get(lectureId);
}

export async function setCachedMeta(meta: LectureMeta): Promise<void> {
  await db.lecture_meta.put(meta);
}
