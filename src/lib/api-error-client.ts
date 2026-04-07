/** Message for toast when a fetch returns !ok — prefers API `{ error: string }`. */
export async function apiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw.trim()) return `${fallback} (HTTP ${res.status})`;
    try {
      const d = JSON.parse(raw) as { error?: unknown };
      if (typeof d.error === "string" && d.error.trim()) return d.error;
    } catch {
      /* non-JSON body */
    }
    return `${fallback} (HTTP ${res.status})`;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}
