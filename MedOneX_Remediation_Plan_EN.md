# MedOneX — Comprehensive Remediation Plan
### Based on the Production Capacity & Scalability Report

---

## Planning Philosophy

The ordering here is **not just based on "severity" from the original report** — it's built around **technical dependency sequencing**, because some fixes (like unifying on Redis) are infrastructure prerequisites for others (like the job queue and shared PDF caching). Implementing solutions in the wrong order means redoing work twice.

**A core constraint that applies throughout:** you're running on Vercel Hobby (free tier), which means:
- No long-running Background Functions (10–60s execution limit depending on runtime)
- No high-frequency Cron Jobs on the free tier (Vercel Cron is limited on Hobby)
- Supabase Free is capped on connection pool size and CPU
- Solutions should be preferred that don't require a paid upgrade unless absolutely necessary

Every fix below is tagged 🆓 (works within free-tier limits) or 💰 (requires a paid plan or trade-off).

---

## Cross-Cutting Concern: BYOK & Client-Side Architecture

Your platform has **two fundamentally different request paths** that the original report only partially separated, and that every phase below needs to treat differently:

- **Server-key path**: requests use your pooled Gemini/provider keys (server cost, server rate limits, server quota apply)
- **BYOK path**: each user supplies their own AI provider key, decrypted per-request and used directly (near-zero cost to you, but different security surface and different rate-limiting logic)

Plus a third layer: **client-side processing** (IndexedDB chat cache, localStorage rate limiting, and — per Phase 1.3 above — client-side PDF text extraction). These interact with BYOK in ways that need explicit handling, not just implicit assumption. Here's exactly where each phase needs adjustment:

### C.1 Scope the Gemini Key Pool (Phase 2.2) to Server-Key Requests Only 🆓

The round-robin key pool from Phase 2.2 must **never apply to BYOK requests** — a BYOK user's own key should never be pooled, rotated, or rate-limited by your server logic beyond basic abuse protection. Route selection needs to branch explicitly at the top of the AI call:

```typescript
// lib/ai-router.ts
async function routeAIRequest(request: ChatRequest, user: User) {
  if (user.byokEnabled && user.byokKey) {
    // BYOK path: decrypt, use directly, do NOT touch the server key pool or its cooldown state
    const decryptedKey = await decryptByokKey(user.byokKey);
    return callProviderDirectly(decryptedKey, request);
  }
  // Server-key path: goes through the round-robin pool from Phase 2.2
  const serverKey = geminiKeyPool.getNextAvailableKey();
  return callProviderWithFallback(serverKey, request);
}
```
Without this explicit branch, a bug in the pool's cooldown logic could accidentally throttle BYOK users who have nothing to do with your key quota — or worse, could log/cache a BYOK key alongside pooled server keys.

### C.2 BYOK Key Security — Verify, Don't Assume 🆓

The original report notes "BYOK keys encrypted in DB" as a positive — but encrypted-at-rest alone isn't the whole story. Confirm (don't assume) each of these:

1. **Decryption happens only in-memory, per-request, and is never logged.** Audit every `console.log`, error handler, and monitoring/APM integration (Sentry, Logtail) to make sure a decrypted key can never end up in a log line, error stack trace, or crash report. A single `console.error(err)` that accidentally serializes a request object containing the key is a real leak vector.
2. **The encryption key itself isn't stored next to the encrypted data.** If you're using something like AES-256-GCM, the encryption key must live in an environment variable — never in the database next to the ciphertext it protects.
3. **BYOK keys are excluded from any database backup export you might share, log, or debug with.** If you ever dump a table for debugging, mask this column first.
4. **No client-side storage of the raw BYOK key beyond the current session**, if your frontend currently caches it anywhere in localStorage or IndexedDB for convenience — check this explicitly, since it's a common shortcut that undermines the server-side encryption entirely.

### C.3 Migrate Client-Side Rate Limiting to Server-Enforced (originally item #13, upgrade its priority) 🆓

The original report flags this as Medium priority — but given BYOK, it deserves a second look and should move earlier, for a specific reason: **client-side localStorage rate limiting is trivially bypassed by clearing browser storage**, and for server-key (non-BYOK) users this directly threatens your free Gemini quota (30 RPM per key) — a single bad-faith user clearing localStorage repeatedly can exhaust the pool for everyone else.

```typescript
// lib/rate-limits.ts — server-enforced, per-path
async function checkRateLimit(userId: string, isByok: boolean) {
  if (isByok) {
    // Light-touch limit: abuse/DoS protection only, not quota protection
    // (it's their own key/cost, but you still don't want someone hammering your API)
    return enforceRedisLimit(`byok:${userId}`, { max: 100, window: "1h" });
  }
  // Strict limit: this protects your shared server quota
  return enforceRedisLimit(`server-key:${userId}`, { max: 20, window: "1d" });
}
```
This single change closes a real gap: **currently, your daily quota protection for server-key users lives entirely in the browser**, which means it isn't real protection at all against a motivated user.

### C.4 Streaming Parity Between Paths (extends Phase 1.4) 🆓

Phase 1.4 already notes that BYOK mode streams (`streamGemini`, `streamOpenAICompat`) while the server-key path currently doesn't. When you unify both onto the Edge Runtime streaming pattern, make sure the **provider-selection branch from C.1 happens before the stream opens**, not inside it — so a BYOK decryption failure (bad/revoked key) surfaces as a clean error response before any `ReadableStream` is opened, rather than as a broken mid-stream failure the client has to detect and recover from.

### C.5 Client-Side Systems Inventory — What to Keep vs. What to Fix

| System | Current State | Action |
|---|---|---|
| IndexedDB chat cache | Client-only, per-device | 🟢 Keep as-is — reasonable UX cache, not a security or capacity concern |
| localStorage daily rate limit | Client-only, bypassable | 🔴 Migrate to Redis server-side (C.3) — the one real gap here |
| Client-side PDF extraction (proposed in Phase 1.3) | New, to be built | 🆕 Build per Phase 1.3 — unrelated to BYOK; it's about removing PDF-parsing load from your server, independent of which AI key path is used |
| BYOK key storage | Server DB, encrypted | 🟡 Verify per C.2 — don't assume correctness without an explicit audit |
| Service Worker cache (Workbox) | Client-only, static assets/chunks | 🟢 Keep as-is — no sensitive data involved |

---

## Phase 0 — Security Emergency (Before Anything Else, Today)

This isn't part of "performance" — this is a potential breach waiting to happen.

### 0.1 Exposed Secrets in Git 🔴🔴🔴

**Why this is an absolute priority:** if `.env` or API keys were ever committed, they exist in Git history even if you've since removed them from the latest snapshot. Anyone with repo access (or if the repo is public) can pull them.

**Execution steps, in order:**

1. **Audit immediately** for any secrets actually leaked:
   ```bash
   git log --all --full-history -- "**/.env*"
   git log -p --all -S "GEMINI_API_KEY"
   git log -p --all -S "DATABASE_URL"
   ```
   Use a dedicated, more precise tool: `gitleaks detect --source . -v` or `trufflehog git file://.`

2. **Rotate every leaked key immediately** — don't rely on removing it from the code alone:
   - All five Gemini keys
   - Supabase service_role key + anon key if exposed
   - DATABASE_URL (i.e., change the Supabase database password)
   - NEXTAUTH_SECRET / JWT secrets
   - Telegram Bot token / MTProto session
   - Firebase service account key
   - UploadThing / R2 / S3 credentials

3. **Clean Git history** (after rotation, not instead of it):
   ```bash
   # use git-filter-repo (better than the legacy filter-branch)
   pip install git-filter-repo --break-system-packages
   git filter-repo --path .env --invert-paths
   git filter-repo --path .env.local --invert-paths
   ```
   Then `git push --force` on every branch, and notify any collaborators they need to re-clone.

4. **Prevent recurrence:**
   ```bash
   # .gitignore
   .env
   .env.local
   .env*.local
   *.pem
   *serviceAccount*.json
   ```
   Add a **pre-commit hook** using a tool like `gitleaks` or `git-secrets` that blocks any commit matching an API-key pattern.

5. **Move all secrets to Vercel Environment Variables** (they should only exist locally in an untracked `.env.local`).

**Estimated time:** 3–5 focused hours, but non-negotiable.

### 0.2 Tokens in URL Params (flagged in the security section of the report)

**The problem:** `mobile tokens pass in URL params` — tokens in the URL get logged in server logs, browser history, Referrer headers, and third-party analytics tools.

**The fix:** move them to:
- An `Authorization: Bearer <token>` header for normal requests
- If passing from a deep link (e.g., opening a mobile app) is unavoidable, use a short-lived, single-use exchange token that gets swapped for a real session via POST immediately, and is never stored or reused afterward.

**Estimated time:** 4–6 hours (depending on how many places it's used).

### 0.3 Missing Request Validation Across Many Routes

**Quick fix:** introduce **Zod** (if not already in use) as mandatory on every new API route, starting this week with the top 20 most-used routes (chat, auth, upload, quiz-save), then extending coverage incrementally with each PR that touches an existing route.

```typescript
// example standardized pattern
import { z } from "zod";

const ChatRequestSchema = z.object({
  lectureId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  threadId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const body = ChatRequestSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });
  }
  // ... rest of the logic
}
```

---

## Phase 1 — Critical Infrastructure (Week 1–2)

Goal: **raise the safe concurrent load from ~2 concurrent chat users to 20+ concurrent users**, without a paid upgrade if possible.

### 1.1 Fixing Bottleneck #1: Connection Pool (15 connections) 🆓

**The real root cause isn't "too few connections" — it's that every chat request consumes 8–12 queries.** The correct fix is **reducing query count per request**, not just raising the pool size (especially since you're on the free tier).

**Step A — Merge user lookups into a single query:**

Current problem (per the report): `tenant.ts` runs a `findUnique` on `users`, then `chat/route.ts` runs a second `findUnique` with includes. **This is a fully redundant duplicate query that can be eliminated entirely.**

```typescript
// ❌ Current state: two separate queries
// tenant.ts
const scope = await prisma.user.findUnique({ where: { id: userId } });
// chat/route.ts (later in the same request)
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { rank: true, university: true, semester: true },
});

// ✅ Fix: one query, shared across the whole request context
// lib/get-request-user.ts
export async function getRequestUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      rank: true,
      university: true,
      semester: true,
      faculty: true, // everything tenant.ts + chat route need combined
    },
  });
}
```
Then use React/Next's `cache()` (or simply pass the object as a parameter between functions) so it's called **only once per HTTP request**:
```typescript
import { cache } from "react";
export const getCachedRequestUser = cache(getRequestUser); // per-request memoization within the same request
```

**Step B — Cache the user in Redis (you already have Upstash):**

```typescript
// lib/user-cache.ts
export async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached as string);

  const user = await getRequestUser(userId);
  await redis.set(cacheKey, JSON.stringify(user), { ex: 300 }); // 5-minute TTL
  return user;
}

// on any update to user data (points, rank, university...) — invalidate immediately
export async function invalidateUserCache(userId: string) {
  await redis.del(`user:${userId}`);
}
```

**Expected result:** from 8–12 queries down to 3–5 queries per chat request (after removing duplication + caching user data). This alone raises concurrent capacity from ~1.25 to ~3–4 concurrent chat requests — **at zero additional cost**.

**Step C — Merge the `buildStudentStudyContext` queries:**

The three parallel queries (raw SQL + findFirst + findMany) can be reduced:
- The `UserLectureActivity` JOIN query: confirm the index mentioned in the report exists (`userId, lastViewedAt` — reportedly present, good)
- Add the missing index flagged in the report:
```prisma
model QuizAttemptItem {
  // ...
  @@index([attemptId, isCorrect]) // missing index — add it now
}
```
```bash
npx prisma migrate dev --name add_quiz_attempt_item_index
```
This one index alone can reduce the "wrong answers" query from a potential full table scan to an index scan — a 10–50x improvement on large tables.

**Step D — Only if pressure persists after all of the above:** then, and only then, consider upgrading Supabase (don't start there).

### 1.2 Move the PDF Cache to Redis (instead of `globalThis`) 🆓

**This is the single most impactful "free" fix on this entire list** — because you already have Upstash Redis running, and the current problem is that the cache is local to each Vercel serverless instance and gets wiped on every cold start.

```typescript
// lib/pdf-cache.ts (Redis-backed replacement for the PDF portion of session-cache.ts)
const PDF_CACHE_TTL = 1800; // 30 minutes, matching current behavior

export async function getCachedPdfText(lectureFileId: string): Promise<PdfCacheEntry | null> {
  const raw = await redis.get(`pdf:${lectureFileId}`);
  return raw ? JSON.parse(raw as string) : null;
}

export async function setCachedPdfText(lectureFileId: string, entry: PdfCacheEntry) {
  // important: watch the value size — Upstash Free has a per-key size limit
  // (should be plenty for extracted PDF text, but verify)
  await redis.set(`pdf:${lectureFileId}`, JSON.stringify(entry), { ex: PDF_CACHE_TTL });
}
```

**Important warning:** the Upstash Free tier has a monthly command-count limit (not just a size limit) — monitor your usage after the migration, since every chat request will now add an extra read/write. If you approach the limit, compress the text (`gzip` before storing) to reduce size, or shorten the TTL to reduce unnecessary retention.

**Result:** cache hit rate rises from 60% (per isolated instance) to 90%+ effectively shared across all instances.

### 1.3 Move PDF Processing Off the Main Event Loop 🆓 (partial)

Since you're on Vercel (not a dedicated server), the traditional `worker_threads` option isn't ideal on serverless. The better fit for your setup:

**Best option for your case: extract text client-side using `pdfjs-dist` in a Web Worker**, then send the extracted text (not the PDF file) to the server. This:
- Removes the load from the server entirely (CPU + bandwidth)
- Works within Vercel Hobby free-tier limits with no added complexity
- Downside: requires adjusting the workflow so extraction happens once at upload time (admin-side) rather than on every student read — which is actually the optimal behavior anyway (extract once, store the text, don't re-extract for every student)

```typescript
// on file upload (once, by the admin) — extract text and store it directly in the DB
// prisma/schema.prisma
model LectureFile {
  // ...
  extractedText String? @db.Text // store the extracted text once at upload time
}
```
With this design: **you no longer need to parse the PDF on every chat request at all** — you just read `extractedText` from the database (fast, no extra CPU, doesn't even need Redis). This fixes bottlenecks #3 and #4 at the root instead of treating them as symptoms.

**Migration plan:**
1. Add the new field to the schema + migration
2. Write a one-time script that walks through all existing PDF files and extracts/stores their text (run this locally, not on Vercel)
3. Adjust the new-file-upload path to extract text immediately on upload
4. Adjust `chat/route.ts` to read `extractedText` from the DB instead of downloading/parsing the PDF

### 1.4 Stream the Response on the Regular (non-BYOK) Path 🆓

Since you've already decided on Edge Runtime as the fix for the timeout issue — use it here too to enable streaming:

```typescript
// app/api/v1/ai/chat/route.ts
export const runtime = "edge";

export async function POST(req: Request) {
  // ... build context and prompt as usual

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of streamFromProvider(prompt)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```
Your client already supports streaming in BYOK mode (`streamGemini`, `streamOpenAICompat`) — just unify the regular path to use the same approach instead of waiting for the full response.

**Result:** first token appears within 2–3 seconds instead of a 5–15 second blank wait — a major UX improvement with zero additional server cost.

---

## Phase 2 — Reliability & Load Distribution (Week 3–4)

### 2.1 A Lightweight Queue That Fits Vercel Hobby 🆓

The traditional solution (Inngest / BullMQ with a persistent worker) doesn't fit Vercel Hobby directly since it requires a continuously running background process. The right alternatives for your free-tier constraint:

**Option A (simplest): Vercel's `waitUntil()`** — for relatively short tasks (like Firebase sync or sending a notification) that run after the response has already been sent to the user:
```typescript
import { waitUntil } from "@vercel/functions";

export async function POST(req: Request) {
  const reply = await generateAIReply(prompt);

  // send the reply immediately, defer secondary tasks
  waitUntil(syncSingleThreadToFirestore(threadId)); // instead of syncing every thread
  waitUntil(sendNotificationIfNeeded(userId));

  return Response.json({ reply });
}
```

**Option B (for longer tasks like large flashcard generation): Inngest's free tier** — it actually works with Vercel Hobby (it doesn't require you to run a persistent worker; it calls your webhook itself):
```typescript
// inngest/functions.ts
export const generateFlashcards = inngest.createFunction(
  { id: "generate-flashcards" },
  { event: "flashcards/generate.requested" },
  async ({ event, step }) => {
    const text = await step.run("fetch-lecture-text", () => getLectureText(event.data.lectureId));
    const flashcards = await step.run("call-ai", () => generateAIReplyWithFallback(text));
    await step.run("save-to-db", () => prisma.flashcard.createMany({ data: flashcards }));
    return { taskId: event.data.taskId, status: "done" };
  }
);
```
The frontend immediately returns `{ taskId }` and either polls or listens via a Firebase realtime listener for task status.

**Estimated time:** 2–3 days for initial integration + one day per additional task type moved to the queue.

### 2.2 Distribute Gemini Keys (Round-Robin instead of Sequential Fallback) 🆓

> **Scope note:** this pool applies to **server-key requests only**. See section C.1 above — BYOK requests must branch away from this logic entirely and call the provider directly with the user's own decrypted key.

```typescript
// lib/ai-router.ts
class GeminiKeyPool {
  private keys: string[];
  private index = 0;
  private cooldowns = new Map<string, number>(); // key -> unix timestamp when it becomes available again

  getNextAvailableKey(): string | null {
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[(this.index + i) % this.keys.length];
      if (!this.cooldowns.has(key) || this.cooldowns.get(key)! < now) {
        this.index = (this.index + i + 1) % this.keys.length;
        return key;
      }
    }
    return null; // all keys are in cooldown
  }

  markRateLimited(key: string) {
    this.cooldowns.set(key, Date.now() + 60_000); // 1-minute cooldown
  }
}
```
This raises effective capacity from 30 RPM (one key acting as the primary) to the full combined use of all five keys = 150 RPM real throughput, instead of relying on fallback only after failure.

### 2.3 Extend the Redis Auth Cache to Include Full Scope 🆓

Apply the same logic as 1.1, but specifically to `getSessionScope()` — merge it into the same user object stored in Redis instead of a separate Prisma query. This is a direct extension of what you already built in 1.1, not new heavy lifting.

### 2.4 Fix Firebase Sync (item #8 in the report) 🆓

```typescript
// ❌ current: re-serializes every thread
async function syncAllThreadsToFirestore(userId: string, allThreads: Thread[]) {
  await setDoc(doc(db, "users", userId), { threads: allThreads });
}

// ✅ alternative: merge only the changed thread
async function syncSingleThreadToFirestore(userId: string, threadId: string, thread: Thread) {
  await setDoc(
    doc(db, "users", userId, "threads", threadId),
    thread,
    { merge: true }
  );
}
```
Change the structure from "one document containing an array of all threads" to **a subcollection per thread** — a simple but structural change that cuts writes by 90%+ as noted in the report.

---

## Phase 3 — Frontend Performance (Week 4–5)

### 3.1 Virtualize the Message List 🆓 (fast win, library already installed)

```tsx
// MedOneXChat.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // approximate average message height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: "100%", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: "100%",
            }}
          >
            <MessageBubble message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.2 `React.memo` on Message Components 🆓

```tsx
const MessageBubble = React.memo(function MessageBubble({ message }: { message: Message }) {
  // ...
}, (prev, next) => prev.message.id === next.message.id && prev.message.content === next.message.content);
```

### 3.3 Split the Oversized Files (`MedOneXChat.tsx` at 2612 lines, `useDrQChat.ts` at 1696 lines)

This isn't just "code hygiene" — files this large slow down Hot Reload and increase the chance of errors when editing. Suggested split:

```
useDrQChat.ts (1696 lines) →
├── useChatMessages.ts       // message management and streaming
├── useChatThreads.ts        // thread management and switching
├── useChatSettings.ts       // user settings (BYOK, provider, etc.)
├── useSuperExpertMode.ts    // logic specific to the advanced mode
└── useDrQChat.ts            // composition hook that ties the rest together

MedOneXChat.tsx (2612 lines) →
├── MessageList.tsx
├── MessageInput.tsx
├── AttachmentPreview.tsx
├── ChatHeader.tsx
├── ThreadSidebar.tsx
└── MedOneXChat.tsx          // parent component, composition only
```
**Practical advice:** don't treat this as a separate "cleanup project" — split each file whenever you're already touching it for another reason (a bug fix or a feature). Over 4–6 weeks of normal development, both files will naturally end up split.

---

## Phase 4 — Search & AI (Week 5–6)

### 4.1 Arabic-Aware BM25 🆓

Current problem: `split(/[\s\p{P}]+/u)` doesn't handle Arabic function words (في، من، على، etc.) or roots.

```typescript
// lib/lecture-search.ts
const ARABIC_STOP_WORDS = new Set([
  "في", "من", "على", "إلى", "عن", "أن", "إن", "هذا", "هذه", "ذلك",
  "التي", "الذي", "كان", "يكون", "أو", "لا", "ما", "لم", "لن",
  // ... extended list
]);

function tokenizeArabicAware(text: string): string[] {
  const tokens = text.split(/[\s\p{P}]+/u).filter(Boolean);
  return tokens
    .map((t) => t.toLowerCase())
    .filter((t) => !ARABIC_STOP_WORDS.has(t))
    .map(normalizeArabic); // strip diacritics, normalize alef/hamza
}

function normalizeArabic(word: string): string {
  return word
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F]/g, ""); // strip diacritics
}
```
You don't need a full ISRI stemmer right now — the simple normalization above solves a large part of the "same word, different forms" problem at very low development cost.

### 4.2 Full-Text Search Across Lectures (PostgreSQL Full-Text Search) 🆓

```prisma
model Lecture {
  // ...
  searchVector Unsupported("tsvector")?
  @@index([searchVector], type: Gin)
}
```
```sql
-- manual migration after prisma migrate
ALTER TABLE "Lecture" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (to_tsvector('arabic', coalesce("extractedText", '') || ' ' || coalesce("title", ''))) STORED;

CREATE INDEX lecture_search_idx ON "Lecture" USING GIN ("searchVector");
```
> Note: PostgreSQL doesn't ship with a fully high-quality built-in Arabic dictionary by default — you may need to use the "simple" configuration instead of "arabic" if results are inaccurate, or layer the improved BM25 above on top of the results.

---

## Consolidated Timeline (6 Weeks)

| Week | Focus | Expected Outcome |
|---|---|---|
| Immediately (Day 0) | Rotate secrets + clean Git history + prevent recurrence | Close the breach vector |
| 1 | Merge user queries + Redis user cache + QuizAttemptItem index | From 8–12 to 3–5 queries/request |
| 1–2 | Move PDF cache to Redis + move text extraction to upload time | Remove the CPU bottleneck from the hot path |
| 2 | Streaming via Edge Runtime for the regular path | First response within 2–3s instead of 5–15s |
| 3 | Round-robin Gemini keys + waitUntil for secondary tasks | Raise effective AI RPM cap from ~30 to ~150 |
| 3–4 | Fix Firebase sync + extend Auth cache | 90%+ reduction in Firestore writes |
| 4–5 | Virtualization + React.memo + gradual file splitting | Smooth UI with 100+ messages |
| 5–6 | Arabic BM25 support + full-text search | More accurate search across the whole curriculum |

---

## Success Metrics (How You'll Know the Plan Worked)

After completing Phases 1 and 2, measure:
1. **Number of concurrent chat users before DB errors appear** — target: from ~2 to 15–20+
2. **Time to First Byte in chat responses** — target: under 3 seconds
3. **PDF cache hit rate across different instances** — target: 85%+ (verify with a simple counter in Redis)
4. **Number of Prisma queries per chat request** (use `prisma.$on('query', ...)` temporarily in dev to measure) — target: 3–5 instead of 8–12

---

## A Final Note on Priorities

If time is limited and you can only pick **3 fixes this week**, rank them exactly like this:

1. **Rotate secrets + clean Git history** (non-negotiable, a real security risk right now)
2. **Merge the duplicate user queries + Redis cache for it** (cheapest fix, biggest impact on the biggest bottleneck)
3. **Move the PDF cache to Redis** (uses infrastructure you already have, zero added cost)

Everything else matters, but these three specifically are the difference between "works for 2 concurrent users" and "works for 15–20 concurrent users" without spending an extra dollar.
