# Step 3: Proposed Architecture — Platform-Wide BYOK

## Design Principles
1. **Skip Vercel** = fewer/lighter function invocations by moving AI calls to client when possible
2. **Reuse existing key storage** — no new models, no new columns
3. **Admin tools stay unchanged** — already use `resolveBestKey()` server-side
4. **User BYOK becomes default** — every student-facing feature tries user's key first

---

## 1. Unified Settings Design

### Storage (no change)
The existing 14 `personal*Key` columns on `User` model remain the single source of truth. Keys are encrypted at rest via `encryptKey()`. Already works. The `useCustomKey` toggle becomes the master "enable BYOK" switch.

### New settings UI page: `/settings/ai`
A single page (not split across profile edit + Dr. Q settings + localStorage) that:
- Lists every supported provider with:
  - Provider name + icon
  - Input field (shows masked preview if key exists)
  - "Test" button (calls existing `/api/v1/user/test-key`)
  - "Save" button (calls `PUT /api/v1/user/ai-keys`)
- Master toggle: "Use my own API keys" → sets `useCustomKey`

### New/Extended API endpoints
| Endpoint | What it does |
|----------|-------------|
| `GET /api/v1/user/ai-keys` | Returns `{ hasKeys: boolean, providers: { gemini: { hasKey: true }, openai: { hasKey: false }, ... }` — **never returns actual key values to client**. |
| `PUT /api/v1/user/ai-keys` | Body: `{ personalGeminiKey: "sk-...", personalOpenAIKey: null, ... }` — encrypts and saves. Same `maybeEncrypt` pattern as profile route. |
| `POST /api/v1/user/ai-keys/fetch` | Returns decrypted keys as a one-time payload **only if `useCustomKey=true`**. This is the endpoint the client-side hook calls. Encrypted over HTTPS, single response, not cached. |

### Dr. Q Chat localStorage migration
Dr. Q Chat's `byokKeys` in localStorage becomes a **read-through cache**:
- On mount, fetch from `POST /api/v1/user/ai-keys/fetch`
- Cache in memory + localStorage
- On save in settings UI, server push invalidates the cache
- Fallback to localStorage if server unreachable

---

## 2. Shared Key-Retrieval

### Client: `useAIKey()` hook

```ts
const { getKey, hasAnyKey, ready } = useAIKey();
// getKey("gemini") → string | null, getKey("openai") → string | null, etc.
```

Behavior:
1. On mount, fetches `POST /api/v1/user/ai-keys/fetch` → gets all decrypted keys
2. Caches in React context + localStorage
3. `getKey(provider)` returns the key or null
4. If `useCustomKey=false` or no keys found, returns null → caller falls back to server
5. Refreshes on explicit `refresh()` call (e.g. after settings save)

### Server: `unifiedResolveKey(user, provider, options?)`

Replaces `resolveBestKey()` + `getGeminiApiKeys()` + all inline key chains.

```ts
function unifiedResolveKey(user, provider, { preferAdmin = false, strictPersonal = false } = {})
  → { key: string | null, source: "user" | "admin" | "env" | null }
```

Resolution order:
1. If `preferAdmin`: admin AI keys → site config → env vars → user personal keys
2. If `strictPersonal`: user personal key only → throw if missing
3. Default (BYOK mode): user personal key → admin AI keys → site config → env vars

---

## 3. Per-Feature Migration

### A. Fully Client-Direct (no server call at all)
These features need no DB data — user's input alone is enough.

| # | Feature | Why | New flow |
|---|---------|-----|----------|
| 4 | Video Summary | Needs only a YouTube URL | Client: `getKey("gemini")` → call Gemini directly. LocalStorage cache instead of Redis. |
| 5 | YouTube Transcript | Needs only a YouTube URL | (a) Tiny `/api/transcript?url=` endpoint (fetches transcript, no AI, milliseconds). (b) Client calls Gemini directly to summarize. |
| 13 | Flashcard gen | Needs only user's pasted text | Client: paste text → `getKey()` → call AI directly. |
| 3 | Post Enhancement | Needs only post content | Client: click enhance → `getKey("siliconflow")` → direct AI call. (Post content already client-composed.) |
| 8 | Notebook AI | Note content already typed on client | Client: `getKey("gemini")` → call AI directly with note content. |

### B. Split: Server Fast-Fetch + Client AI Call
These need server-side data — the data fetch is cheap (no AI, fast).

| # | Feature | Server step (fast, no AI) | Client step (AI call) |
|---|---------|--------------------------|----------------------|
| 6 | Atlas Bot Chat | `GET /api/v1/atlas/context?structureId=xxx` returns **description, function, blood supply, innervation, clinical correlations** (DB query only, already loaded on page mount). | Client sends user message + context to Gemini via `getKey("gemini")`. |
| 7 | Atlas Quiz | Same — `GET /api/v1/atlas/context` returns full structure/system data. | Client sends context to Gemini to generate 5 MCQs. |
| 15 | Study Plan | `GET /api/study-assistant/profile` returns schedule/hobbies (already on server, no AI). | Client calls AI with profile data → saves plan via fast PUT endpoint. |
| 16 | Week Review | `GET /api/study-assistant/review-data` returns plan+progress JSON. | Client calls AI → saves review via fast PUT. |
| 10 | Question Explanation | `GET /api/v1/questions/[id]/context` returns body + choices (no answer). | Client calls AI to explain. Explanation will be speculative (AI doesn't know which is correct) → see security decision below. |

### C. Security Exceptions — Stay Server-Side

| # | Feature | Rationale | Key source |
|---|---------|-----------|------------|
| 9 | Essay Grading | Needs `question.essayReference` (model answer). Exposing to client = students see answer key. | `unifiedResolveKey()` server-side. |
| 10 | Question Explanation | **Decision: keep server-side (cached).** If client generates without the answer, explanation is speculative/low-quality. Server-side generation already cached per-question (Redis + `aiExplanation` column) — Vercel cost near-zero after first generation. | `unifiedResolveKey()` server-side. |

### D. Admin Tools — All Stay Server-Side

| # | Feature | Migration |
|---|---------|-----------|
| 11 | Question Extraction | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 12 | AI Suggestions | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 14 | Note Gen (file) | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 17 | Lecture Enhance | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 18 | Lecture from File | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 19 | Manus Agent | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 20 | Architect | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |
| 21 | Colab Analyzer | **FIX:** Currently no key resolution — add `unifiedResolveKey()` call. |
| 22 | Book Analyzer | **FIX:** Currently no key resolution — add `unifiedResolveKey()` call. |
| 23 | Scrape Links | Use `unifiedResolveKey()`. Already uses `resolveBestKey()`. |

### E. No Change

| # | Feature | Reason |
|---|---------|--------|
| 1 | Dr. Q Chat | Already has split model (BYOK=client, free=server). Only change: localStorage BYOK → `useAIKey()` hook. |
| 2 | Puter Chat | Separate UI, Puter.js SDK, out of scope. |
| 24 | Key Test | User provides key in request body — no change needed. |
| 25 | TTS | Not an LLM call. |
| 26-27 | Puter features | Puter.js SDK, out of scope. |

---

## 4. Security Exceptions — Detailed

| # | Feature | Decision | Tradeoff Documented |
|---|---------|----------|-------------------|
| 9 | Essay Grading | **Server-side.** Confirmed. | `question.essayReference` is the model answer. Sending client-side would let any student see the answer key. Must stay server-side. |
| 10 | Question Explanation | **Server-side (cached).** Confirmed — Option A. | Client would need the correct answer to generate a definitive explanation, which leaks the answer. Generating without the answer produces speculative/low-quality explanations. Server-side already cached (Redis + `aiExplanation` column) — near-zero Vercel cost after first generation. |
| 3 | Post Enhancement | **Client-direct.** Confirmed. | Forum post content is already client-composed before submission. No new exposure. |

---

## 5. Migration Order

### Phase 1: Foundation
1. `unifiedResolveKey()` server utility — replace `resolveBestKey()` + `getGeminiApiKeys()` + all inline key chains
2. `POST /api/v1/user/ai-keys/fetch` endpoint (returns decrypted keys, gated behind `useCustomKey=true`)
3. `useAIKey()` client hook (fetch on mount, cache, `getKey()` method)

### Phase 2: Settings + Dr. Q Chat
4. Unified settings UI at `/settings/ai` (uses existing encrypt-on-save pattern)
5. Dr. Q Chat migration: localStorage BYOK → `useAIKey()` hook

### Phase 3: Client-Direct Features (one at a time)
6. #13 Flashcard gen (simplest — paste text + call AI)
7. #4 Video Summary (URL + Gemini)
8. #5 YouTube Transcript (transcript endpoint + Gemini)
9. #3 Post Enhancement (SiliconFlow client-direct)
10. #8 Notebook AI (Gemini with note content)

### Phase 4: Split Features
11. #6 Atlas Bot Chat — add `GET /api/v1/atlas/context` endpoint, move AI to client
12. #7 Atlas Quiz — same context endpoint, move AI to client
13. #15 Study Plan — add profile fetch endpoint, move AI to client
14. #16 Week Review — add review data endpoint, move AI to client

### Phase 5: Admin Route Cleanup
15. #21 Colab Analyzer — add `unifiedResolveKey()`
16. #22 Book Analyzer — add `unifiedResolveKey()`
17. Remaining admin routes — swap to `unifiedResolveKey()` signature
