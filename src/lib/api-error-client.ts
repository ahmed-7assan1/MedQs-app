/** Message for toast when a fetch returns !ok — prefers API `{ error: string }`. */
export async function apiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw.trim()) return `${fallback} (HTTP ${res.status})`;
    try {
      const d = JSON.parse(raw) as {
        error?: unknown;
        errors?: unknown;
      };
      if (Array.isArray(d.errors) && d.errors.length > 0) {
        const first = d.errors.find((x) => typeof x === "string");
        if (typeof first === "string" && first.trim()) return first;
      }
      if (typeof d.error === "string" && d.error.trim()) return d.error;
      if (d.error && typeof d.error === "object") {
        const err = d.error as { formErrors?: unknown; fieldErrors?: unknown };
        if (Array.isArray(err.formErrors) && err.formErrors.length > 0) {
          const first = err.formErrors.find((x) => typeof x === "string");
          if (typeof first === "string" && first.trim()) return first;
        }
        if (err.fieldErrors && typeof err.fieldErrors === "object") {
          for (const v of Object.values(err.fieldErrors as Record<string, unknown>)) {
            if (Array.isArray(v) && v.length > 0) {
              const first = v.find((x) => typeof x === "string");
              if (typeof first === "string" && first.trim()) return first;
            }
          }
        }
      }
    } catch {
      /* non-JSON body */
    }
    return `${fallback} (HTTP ${res.status})`;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}
