type ItemType = "MODULE" | "SUBJECT" | "LECTURE";

interface SavedItem {
  type: ItemType;
  id: string;
  title: string;
  subtitle: string;
  lecturesCount?: number;
}

const STORAGE_KEY = "medonex_saved";

let _cacheRaw: string | null = null;
let _cached: SavedItem[] = [];

function read(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === _cacheRaw) return _cached;
    _cacheRaw = raw;
    _cached = raw ? JSON.parse(raw) : [];
    return _cached;
  } catch {
    return [];
  }
}

function invalidateCache() {
  _cacheRaw = null;
  _cached = [];
}

function write(items: SavedItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getSaved(): SavedItem[] {
  return read();
}

export function getSavedByType(type: ItemType): SavedItem[] {
  return read().filter((i) => i.type === type);
}

export function isSaved(type: ItemType, id: string): boolean {
  return read().some((i) => i.type === type && i.id === id);
}

export function toggleSave(item: SavedItem): boolean {
  invalidateCache();
  const items = read();
  const idx = items.findIndex((i) => i.type === item.type && i.id === item.id);
  if (idx >= 0) {
    items.splice(idx, 1);
    write(items);
    return false;
  } else {
    items.unshift(item);
    write(items);
    return true;
  }
}

export function removeSave(type: ItemType, id: string) {
  invalidateCache();
  write(read().filter((i) => !(i.type === type && i.id === id)));
}
