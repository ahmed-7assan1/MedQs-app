export type DownloadType = "PDF" | "IMAGE" | "LECTURE" | "OTHER";

export interface DownloadRecord {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  moduleName?: string;
  lectureName?: string;
  type: DownloadType;
  downloadedAt: string;
}

const STORAGE_KEY = "medqs_downloads";
let _cache: DownloadRecord[] | null = null;
let _cacheRaw: string | null = null;

function getTypeFromMime(mime: string): DownloadType {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("image")) return "IMAGE";
  if (mime.includes("video") || mime.includes("audio")) return "LECTURE";
  return "OTHER";
}

function readCache(): DownloadRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === _cacheRaw && _cache) return _cache;
  _cacheRaw = raw;
  _cache = raw ? JSON.parse(raw) : [];
  return _cache as DownloadRecord[];
}

function writeCache(records: DownloadRecord[]): void {
  if (typeof window === "undefined") return;
  _cache = records;
  _cacheRaw = JSON.stringify(records);
  localStorage.setItem(STORAGE_KEY, _cacheRaw);
}

export function getDownloads(): DownloadRecord[] {
  return readCache();
}

export function addDownload(file: {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  moduleName?: string;
  lectureName?: string;
}): void {
  const records = readCache();
  const existing = records.findIndex(
    (r) => r.fileUrl === file.fileUrl || r.id === file.id
  );
  const record: DownloadRecord = {
    id: file.id,
    title: file.title,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    moduleName: file.moduleName,
    lectureName: file.lectureName,
    type: getTypeFromMime(file.mimeType),
    downloadedAt: new Date().toISOString(),
  };
  if (existing !== -1) {
    records[existing] = record;
  } else {
    records.unshift(record);
  }
  writeCache(records);
  window.dispatchEvent(new Event("storage"));
}

export function removeDownload(id: string): void {
  const records = readCache().filter((r) => r.id !== id);
  writeCache(records);
  window.dispatchEvent(new Event("storage"));
}

export function clearDownloads(): void {
  writeCache([]);
  window.dispatchEvent(new Event("storage"));
}
