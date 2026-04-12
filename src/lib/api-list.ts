/**
 * Some GET routes return a raw JSON array; others wrap lists in `{ result: T[] }`.
 * Use this when parsing so admin structure and dropdowns stay in sync with the DB.
 */
export function unwrapApiList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "result" in data) {
    const r = (data as { result: unknown }).result;
    if (Array.isArray(r)) return r as T[];
  }
  return [];
}

export async function parseJsonList<T>(res: Response): Promise<T[]> {
  if (!res.ok) return [];
  try {
    const data = await res.json();
    return unwrapApiList<T>(data);
  } catch {
    return [];
  }
}
