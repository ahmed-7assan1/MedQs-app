type ItemType = "MODULE" | "SUBJECT" | "LECTURE";

interface SavedItem {
  type: ItemType;
  id: string;
  title: string;
  subtitle: string;
  lecturesCount?: number;
}

const STORAGE_KEY = "medonex_saved";

function read(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
  const items = read();
  const idx = items.findIndex((i) => i.type === item.type && i.id === item.id);
  if (idx >= 0) {
    items.splice(idx, 1);
    write(items);
    return false; // removed
  } else {
    items.unshift(item);
    write(items);
    return true; // added
  }
}

export function removeSave(type: ItemType, id: string) {
  const items = read().filter((i) => !(i.type === type && i.id === id));
  write(items);
}
