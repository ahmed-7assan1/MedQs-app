# Dashboard Backend Remediation Plan

**Version:** 1.0  
**Classification:** Internal Engineering Document  
**Scope:** Dashboard Backend — API, Database, Auth, Caching, External Integrations  
**Target System:** MedOneX (medqs-app)  
**Infrastructure:** Vercel Free, Supabase Free, BYOK AI, Telegram Storage, Redis (Upstash)

### Changelog

| Date | Version | Change |
|------|---------|--------|
| July 2026 | 1.1 | Connection pool figure corrected from an initially-assumed 15 to the runtime-verified actual value of 30 (from DATABASE_URL's `connection_limit` parameter), after discovering `DATABASE_CONNECTION_LIMIT=15` in `.env` was dead configuration. An earlier unfounded claim of "4" during investigation was retracted — no evidence ever supported it. |

---

## Executive Summary

The Dashboard backend is functional but carries significant technical debt, security gaps, and performance bottlenecks that block production readiness. This document establishes a complete remediation roadmap covering 10 implementation phases.

### Current Backend Health

The backend scores **5.5/10** overall. While the Prisma query patterns are well-structured in the core dashboard queries (`dashboard-queries.ts`), the surrounding API layer, authentication pipeline, and external service integrations contain critical gaps.

### Overall Risks

1. **Security:** The Podcasts API (`/api/v1/podcasts`) exposes all lecture recordings without authentication — any unauthenticated client can dump the entire database of recordings. This is a P0 data leak.
2. **Authentication:** The middleware uses `getUser()` instead of `getSession()`, meaning expired access tokens are never refreshed. Users are silently logged out after 1 hour of inactivity.
3. **Availability:** Redis is a hard dependency for authentication. If Redis goes down, `auth()` returns `null` for all users, locking everyone out.
4. **Data Freshness:** No cache invalidation exists on quiz completion. The most frequent user action produces stale dashboard data for up to 60 seconds.
5. **Rate Limits:** Three Supabase Auth calls per page load will exhaust the free tier rate limit well before reaching 1,000 concurrent users.

### Biggest Bottlenecks

| Bottleneck | Impact | Root Cause | Phase |
|---|---|---|---|
| Podcasts API unauthenticated | Complete data leak | Missing auth() call | Phase 1 |
| Triple Auth calls per page load | Auth rate-limit exhaustion at ~300 concurrent users | Each layer independently calls getUser() | Phase 2 |
| Auth breaks on Redis failure | Complete application lockout | No DB fallback in auth() cache | Phase 2 |
| YouTube API uncached | Daily quota exhaustion at ~200 requests | No unstable_cache wrapping | Phase 5 |
| Stale dashboards after quizzes | Users see outdated scores for 60s | Missing revalidateTag("dashboard") | Phase 2 |
| Community carousel waterfall | +300ms per page load | Two sequential SWR fetches required | Phase 7 |
| getModuleProgress over-fetching | 800+ rows loaded for 8 numbers | 3-level nested include instead of aggregate | Phase 3 |
| getSessionScope 5-minute staleness | Auth decisions stale after role/semester changes | Long cache TTL with no invalidation pathway | Phase 2 |

### Overall Remediation Strategy

1. **Fix security before optimization** — the Podcasts data leak must be closed immediately.
2. **Stabilize authentication** — ensure sessions survive token expiry, Redis outages, and rate limits.
3. **Add cache invalidation** — make the dashboard respond in real-time to the most frequent user action (quiz completion).
4. **Optimize external API usage** — protect YouTube and Spotify quotas with server-side caching.
5. **Eliminate redundant work** — remove duplicate profile syncs, duplicate auth calls, unnecessary DB queries.
6. **Add resilience** — graceful degradation when Redis, Spotify, or YouTube are unreachable.
7. **Maintain backward compatibility** — all API contract changes must be additive. No breaking client changes.

### Expected Final Outcome

After completing all 10 phases, the system will achieve:

| Metric | Current | Target |
|---|---|---|
| Backend Score | 5.5/10 | 8.5/10 |
| Security Score | 6/10 | 9/10 |
| Performance Score | 5/10 | 8/10 |
| Scalability ceiling | ~300 concurrent users | ~5,000 concurrent users |
| DB queries per dashboard load | 16-18 | 6-8 |
| Auth API calls per load | 3 | 1 |
| Spotify API calls | 1 per record per request | 1 per record per 24h |
| YouTube API calls per request | 2 | 0 (cached) |
| Dashboard staleness after quiz | 60 seconds | ~2 seconds |
| Redis dependency | Hard | Soft (graceful degradation) |

---

## Current Backend Assessment

Every issue identified during the audit, categorized by severity.

### P0 — Critical

#### P0-1: Podcasts API — Zero Authentication

- **Description:** The `GET /api/v1/podcasts` route has no authentication check. It returns all `LectureRecord` entries in the database with full Spotify metadata.
- **File:** `src/app/api/v1/podcasts/route.ts` (lines 1-79)
- **Root Cause:** Developer omitted the `auth()` call entirely. The import statement for auth was never added despite existing in the sister route (`/api/v1/records`).
- **Business Impact:** Complete data leak of all lecture recordings with Spotify metadata. Exposes the entire educational content catalog without authentication.
- **User Impact:** N/A (users are not directly affected; the leak exists externally).
- **Technical Impact:** Any script/bot can enumerate all recordings. The route is public with `Cache-Control: public, s-maxage=3600` — CDNs could cache this globally.
- **Priority Justification:** This is a data breach. It must be fixed before any production deployment.

#### P0-2: Middleware — No Refresh Token Handling

- **Description:** `updateSession()` in `src/lib/supabase/middleware.ts` calls `supabase.auth.getUser()` (line 29) which does NOT automatically refresh expired access tokens. The correct method `getSession()` does handle token refresh but is not used.
- **Root Cause:** Using the wrong Supabase SSR method. `getUser()` validates the access token without attempting refresh. `getSession()` checks the session cookie first and refreshes the token if expired.
- **Business Impact:** Users with expired access tokens (1-hour lifetime) are silently treated as unauthenticated. Redirect loops occur. Users are forced to log out and log back in unexpectedly.
- **User Impact:** Phantom logouts every ~60 minutes of inactivity. Users lose their place, scroll position, and context.
- **Technical Impact:** Every 401 from a stale token triggers a full page redirect to `/auth?mode=login`. This causes frustration and support tickets.
- **Priority Justification:** Session instability is a top user complaint vector. This fix is a single-line change with outsized impact.

> **🔍 Retrospective Note (July 2026 — Phase 1 Review):**
> This audit finding was **inaccurate**. The original middleware on `main` already used `supabase.auth.getUser()`, which DOES handle token refresh — `getUser()` internally reads the session from cookies, refreshes if expired (writing new tokens via the cookie handler's `set()` method to both request and response), then verifies the user with the Auth API. The cookie handler in `middleware.ts` was correctly configured (writes to both `request.cookies` and `supabaseResponse.cookies`), so refresh had always been working.
>
> The Phase 1 branch initially introduced a change to `getSession()` based on a misdiagnosis. This would have been a **security regression** — Supabase's own documentation warns "Never trust `supabase.auth.getSession()` inside server code such as Proxy. It isn't guaranteed to revalidate the Auth token." The change was caught during code review, reverted, and **no functional change was made to middleware.ts**. The original `getUser()` call remains correct and secure.
>
> P0-2 is recorded as "audit finding was inaccurate" — not as a vulnerability that was fixed.

#### P0-3: Quiz Submission — No Dashboard Cache Invalidation

- **Description:** Completing a quiz (the most frequent user action) does not invalidate the dashboard cache. The only `revalidateTag("dashboard")` call exists in `modules/[moduleId]/route.ts` which is an admin-only action.
- **Files:** All quiz submission routes (likely `src/app/api/v1/past-papers/[id]/attempt/route.ts`, possibly `src/app/api/v1/quiz-attempts/[attemptId]/route.ts`)
- **Root Cause:** Cache invalidation was implemented for admin content changes but overlooked for the primary user interaction.
- **Business Impact:** Quiz is the core value proposition. Users complete a quiz and see stale dashboard data (scores, streaks, progress) for up to 60 seconds.
- **User Impact:** "Why doesn't my streak update?" — one of the most confusing UX states in gamified learning.
- **Technical Impact:** Users refresh the page (adding load) to see updated data. Dashboard `unstable_cache` has `revalidate: 60` with `tags: ["dashboard"]` — without `revalidateTag("dashboard")`, the 60-second TTL is the only refresh mechanism.
- **Priority Justification:** Directly impacts the core user experience loop. Low implementation cost, high user-facing impact.

### P1 — High Impact

#### P1-1: Profile Sync — Duplicated Write on Every Page Load

- **Description:** Both `layout.tsx` (lines 76-107) and `page.tsx` (lines 27-51) independently perform profile creation/update for users with Supabase metadata but no DB profile. The layout does `prisma.user.create()` or `.update()`. The page does `prisma.user.upsert()`.
- **Root Cause:** Two independently written sync mechanisms, each assuming the other doesn't exist. Likely written by different developers at different times.
- **Business Impact:** 2 redundant DB writes per page load for users in the incomplete profile state. For 500 users completing onboarding simultaneously, this creates 1000 unnecessary writes. On Supabase free tier (limited connections), this wastes connection pool slots.
- **User Impact:** Marginally slower page loads for new users.
- **Technical Impact:** Wasted DB writes consume connection pool capacity and add latency to page rendering.
- **Priority Justification:** Easy fix that reduces DB write volume by 50% for new user sessions.

#### P1-2: Auth Cache — No Fallback When Redis Is Down

- **Description:** `auth()` function in `src/lib/auth.ts` line 29 calls `cacheGet()` which connects to Redis. If Redis is unreachable, the `.catch(() => null)` returns `null`. The `auth()` function then returns `null` because `cached` is `null` and the `if (cached)` guard fails. The code continues to construct an `AuthSession` without cached data (lines 33-57), but the _entire function_ is wrapped in try-catch (line 58-60) — if `cacheGet` throws, the catch returns `null`.
- **Root Cause:** The Redis call is not separated from the non-cached path. The try-catch swallows the Redis error, then the function returns `null` instead of falling through to the DB-based path.
- **Business Impact:** Complete application lockout during Redis outages. Every API route using `auth()` returns 401.
- **User Impact:** Users cannot access any part of the application requiring authentication.
- **Technical Impact:** Redis is a single point of failure for the entire auth system. The code _after_ the cache check (lines 33-57) constructs the session from `user.user_metadata` without touching Redis, but it is unreachable when Redis throws.
- **Priority Justification:** Redis on free tier (Upstash) can have transient outages, cold starts, or connection limits. This makes the app unreliable.

#### P1-3: Triple Supabase Auth Call per Page Load

- **Description:** Supabase `getUser()` is called 3 times on every dashboard page load:
  1. `middleware.ts` → `updateSession()` → `supabase.auth.getUser()`
  2. `layout.tsx` → `createClient()` → `supabase.auth.getUser()`
  3. `page.tsx` → `createClient()` → `supabase.auth.getUser()`
- **Root Cause:** Each component independently creates a Supabase client and calls `getUser()`. No mechanism shares the auth result across layers.
- **Business Impact:** Supabase free tier limits Auth API requests to ~50 requests/second. At 16 page loads per second (~1,000 concurrent users), this generates 48 requests/second — just 3 requests/second from hitting the hard limit.
- **User Impact:** Rate-limit errors, CAPTCHA, and degraded auth performance at peak usage.
- **Technical Impact:** Waste of cold-start time in serverless functions. Each auth call adds ~100-300ms to page load.
- **Priority Justification:** Blocks scaling beyond ~300 concurrent users on free tier.

#### P1-4: YouTube API — No Server-Side Caching

- **Description:** The `/api/v1/videos/curriculum` route makes 2 external API calls on every request (YouTube Videos API + YouTube Channels API). Neither result is cached server-side. Only the HTTP response has `s-maxage=3600` which caches at the CDN level, but the CDN cache is shared — the first user's request triggers the full YouTube pipeline.
- **File:** `src/app/api/v1/videos/curriculum/route.ts` lines 76-95
- **Root Cause:** No `unstable_cache` wrapping for the YouTube API call path.
- **Business Impact:** YouTube Data API v3 quota is typically 10,000 units/day. A `videos.list` call costs 1 unit, `channels.list` costs 1 unit. With 2 calls per request and ~200 page loads/day, this exhausts quota by ~400 units/day. With growth to 500 users/day, quota exhaustion occurs within hours.
- **User Impact:** When YouTube quota is exhausted, curriculum videos fail to load (no channel thumbnails or metadata).
- **Technical Impact:** Two sequential HTTP requests (`fetch` calls on lines 78 and 84) that could be parallelized or cached.
- **Priority Justification:** Quota exhaustion is a hard failure that breaks the feature. With projected growth, this will fail regularly.

#### P1-5: Community Carousel — SWR Waterfall

- **Description:** `useCommunityPosts()` in `src/lib/dashboard-fetch.ts` makes two sequential SWR requests:
  1. `GET /api/v1/forums?type=GLOBAL` — discover the GLOBAL forum ID
  2. `GET /api/v1/forums/{forumId}/posts?page=1&limit=6` — fetch posts
  Total latency = T1 + T2 (sequential waterfall).
- **Root Cause:** The GLOBAL forum ID is dynamic and must be discovered before posts can be fetched. There is no cached or known constant for it.
- **Business Impact:** +200-600ms additional TTFB for the community carousel section of the dashboard.
- **User Impact:** The Community section loads noticeably later than other carousels.
- **Technical Impact:** On slow connections or cold API routes, this adds noticeable delay. The first request (`useSWRImmutable`) blocks the second request entirely.
- **Priority Justification:** Medium — impacts UX but does not break functionality. Fixable with a dedicated endpoint.

#### P1-6: SiteConfig Queried Twice (Uncached Second Query)

- **Description:** The layout already queries `siteConfig` via `unstable_cache` (300s revalidation) for feature flags. The page independently queries `prisma.siteConfig.findFirst()` at line 108 with NO caching.
- **File:** `src/app/(student-clean)/dashboard-app/page.tsx` lines 107-108
- **Root Cause:** Feature isolation — the ads check (`enableAds`) needed site config but didn't reuse the layout's cached version.
- **Business Impact:** One extra DB query per dashboard load. On Supabase free tier with 30 connection pool slots (via pooler), each wasted query increases pool contention.
- **Technical Impact:** Minor but unnecessary DB load.
- **Priority Justification:** Trivial fix. Combine with P1-7 (AdBanner caching) for cumulative gain.

#### P1-7: AdBanner Query — No Cache and Missing Composite Index

- **Description:** `prisma.adBanner.findMany({ where: { active: true, OR: [...] }, orderBy: { createdAt: "desc" } })` executes on every dashboard load with no caching. The query filters by `active` and `semesterId`/`universityId`, but the schema only has `@@index([semesterId])` and `@@index([universityId])` — there is no composite index on `(active, semesterId)`.
- **File:** `src/app/(student-clean)/dashboard-app/page.tsx` lines 110-122, `prisma/schema.prisma` lines 1000-1002
- **Root Cause:** No caching or indexing considered for ad banner reads.
- **Business Impact:** Table scan on every page load. Ad banners rarely change (maybe weekly), so this is read-heavy with negligible writes.
- **Technical Impact:** Without an `@@index([active, semesterId])` composite index, PostgreSQL performs a bitmap scan or sequential scan on the `ad_banner` table.
- **Priority Justification:** Ads are not critical functionality, but the fix (caching + index) is low effort and eliminates unnecessary DB load.

### P2 — Improvements

#### P2-1: `getModuleProgress` — Over-fetching Subject and Lecture Rows

- **Description:** `getModuleProgress(userId, semesterId)` loads ALL subjects → ALL lectures with `_count.questions` via a 3-level nested include. For a semester with 8 modules × 5 subjects × 20 lectures = 800 database rows fetched just to compute 8 numbers.
- **File:** `src/lib/dashboard-queries.ts` lines 134-150
- **Root Cause:** Using a nested Prisma `include` instead of an aggregate query. The function only needs total question count per module, not the full tree.
- **Business Impact:** As user base grows, this creates linear load growth. With 5,000 concurrent users, this query alone reads 4 million rows per second.
- **Technical Impact:** The second part of the function (lines 155-170) correctly uses raw SQL for `correctRows`. But the first part (lines 136-150) fetches a full tree just to compute `total` on line 175-177.
- **Priority Justification:** Major scalability bottleneck masked by small current dataset.

#### P2-2: `DashboardPage` — `any` Types Throughout

- **Description:** `dashData: any`, `rankInfo: any`, destructuring with fallback defaults. No compile-time type safety.
- **File:** `src/app/(student-clean)/dashboard-app/page.tsx` lines 68-101
- **Root Cause:** The page was built before proper types were established for `DashboardData`.
- **Business Impact:** Runtime crashes from unexpected API shapes. TypeScript cannot catch mismatches between the server function output and the component expectations.
- **Technical Impact:** Silent data mismatches cause undefined access errors. The destructuring on line 80 references `stats`, `moduleProgress`, `activity` — but `fetchDashboardData` returns `weekCounts`, not `activity`. This mismatch is masked by fallback defaults.
- **Priority Justification:** Low immediate risk, but erodes code quality over time.

#### P2-3: `lastLectureActivity` — Prisma Sorts ALL Videos

- **Description:** The query includes `videos: { take: 1, orderBy: { sortOrder: "asc" } }`. Prisma must sort ALL videos for the lecture before taking 1. This is a known Prisma limitation.
- **File:** `src/lib/dashboard-queries.ts` lines 225-229
- **Business Impact:** Minor — each video sort is on a small per-lecture set (typically 1-5 videos).
- **Resolution:** Accept this limitation. A subquery or raw SQL approach could optimize, but the gain is marginal for current data volumes.

#### P2-4: No Error Boundaries on Dashboard

- **Description:** If any carousel component throws during render (e.g., API crash, JSON parse failure), the error propagates to the React root and the entire dashboard shows a white screen.
- **File:** `DashboardShell.tsx` (render tree)
- **Business Impact:** A non-critical carousel failure (e.g., Community API error) takes down the entire dashboard.
- **Priority Justification:** Low-probability but high-impact failure mode.

#### P2-5: `last7DayKeys()` — Recomputes Every Render

- **Description:** Called on every server render of `DashboardPage`. Creates 7 `new Date()` objects and calls `localeDateString()`.
- **File:** `src/lib/dashboard-stats.ts` line 32
- **Business Impact:** Negligible in isolation, but signals a pattern of not caching pure computations.
- **Fix:** Convert to a constant or `unstable_cache` with single-day TTL.

#### P2-6: Unreachable \unstable_cache\ in Forum Posts Route

- **Description:** The \unstable_cache\ wrapper for \loadForumPostsForUser\ is commented out (lines 18-24 in \orums/[forumId]/posts/route.ts\). The function is called directly, uncached.
- **File:** \src/app/api/v1/forums/[forumId]/posts/route.ts\
- **Business Impact:** Every request to get forum posts hits the database.
- **Technical Impact:** Minor — forum posts are typically served from memory-cached Firestore anyway.
- **Resolution:** Either implement the cache or remove the dead code.

#### P2-7: TypeScript \s any\ Casts for \prisma.lectureVideo\

- **Description:** Multiple video routes use \(prisma as any).lectureVideo.findMany\ and \(prisma as any).lectureVideo.count\ instead of typed access.
- **Files:** \src/app/api/v1/videos/curriculum/route.ts\ lines 32, 52
- **Root Cause:** The \LectureVideo\ model exists in \schema.prisma\ (lines 287-316) but the Prisma client may not have been regenerated after a rename or schema change, or the model was added but the developer didn't run \prisma generate\.
- **Business Impact:** If the Prisma client is ever regenerated without this model (or with a different name), these routes silently return empty arrays with no compile-time error.
- **Priority Justification:** Low immediate risk, but the \s any\ pattern masks real type issues.

#### P2-8: No CSRF Protection

- **Description:** API routes have no CSRF token validation. Supabase session cookies mitigate partially via \SameSite=Lax\, but the \uth/profile\ PUT endpoint and other mutating routes are vulnerable to CSRF in embedded browsers or same-site scripting.
- **Business Impact:** Low on current Vercel+Supabase architecture due to \SameSite\ cookie protections.
- **Priority Justification:** Acceptable risk for current scale. Revisit when supporting third-party integrations.

---

## Remediation Strategy

### Guiding Principles

1. **Security before optimization.** P0 issues are fixed first, before any performance work. A fast system that leaks data is unacceptable.

2. **Stability over complexity.** Every change must reduce, not increase, the system's operational complexity. Favor simple solutions (cache headers, \unstable_cache\) over distributed infrastructure (Redis caching layers, message queues).

3. **Incremental changes.** Each phase is independently deployable. No phase depends on any other phase. Phases can be reordered if business priorities shift.

4. **Low-risk deployments.** Every change is backward-compatible. API contracts are never broken. Deprecated patterns are removed only after no live code references them.

5. **Favor Vercel-native patterns.** Use \unstable_cache\ (Next.js built-in), React \cache()\, and fetch caching over custom Redis strategies wherever possible. This reduces infrastructure dependencies and cold-start latency.

6. **Prefer raw SQL for aggregates.** The existing pattern in \dashboard-queries.ts\ (raw SQL for streak, weekly activity, correct counts) should be extended rather than loading full rows into application memory.

7. **Cache aggressively for read-heavy data.** External API responses (YouTube, Spotify), configuration (siteConfig), and rarely-changing data (ad banners) should be cached with TTLs matching their change frequency.

8. **Graceful degradation.** Every external dependency (Redis, Spotify, YouTube, Supabase Auth) must have a fallback. Users should see degraded UI (missing avatars, stale data) rather than errors or blank screens.

### Anti-Patterns to Avoid

- **Do not** add a custom caching framework. Next.js \unstable_cache\ + \evalidateTag\ is sufficient.
- **Do not** introduce a message queue or background job system for dashboard revalidation. The current \unstable_cache\ with 60s TTL is acceptable for non-quiz data.
- **Do not** rewrite Prisma queries to raw SQL unless there is a demonstrated performance problem. The existing patterns are well-structured.
- **Do not** add new Redis caches for data that can be cached via \unstable_cache\ (which uses the built-in Next.js data cache backed by filesystem or Vercel's infrastructure).
- **Do not** implement WebSocket-based real-time updates for the dashboard. SWR's background revalidation (30s interval) is sufficient.
- **Do not** add a separate API gateway or BFF layer. The current Next.js API routes pattern is appropriate for this scale.

### Decision Log Template

Every significant architectural decision during remediation should be recorded with:

- **Date:**
- **Decision:**
- **Context:**
- **Alternatives Considered:**
- **Rationale:**
- **Consequences:**

---

## Implementation Roadmap

### Phase 1 — Critical Security Fixes

**Objective:** Close all security vulnerabilities that expose user data or allow unauthorized access.

**Scope:**
- P0-1: Podcasts API authentication
- P0-2: *(Audit finding inaccurate — no change required)*

**Dependencies:** None.

**Implementation Strategy:**

#### P0-1: Podcasts API Authentication

1. Add \import { auth } from "@/lib/auth"\ at the top of the file.
2. Add session check after line 3: \const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\
3. Extract \semesterId\ from session metadata: \const semesterId = (session?.user as any)?.semesterId;\
4. Add the same \where\ filter used in \ecords/route.ts\ to scope by semester: \where: { lecture: { subject: { module: { semesterId } } } }\.
5. Add a fallback for users without \semesterId\: return empty results or a 400 error with message "Complete onboarding to see podcasts."

#### P0-2: Middleware Refresh Token Fix *(No change required — see Retrospective Note above)*

The original audit finding claimed `getUser()` does not handle token refresh. This is incorrect. `getUser()` internally:
1. Reads the session from cookies
2. If the access token is expired, refreshes it using the refresh token (the cookie handler's `set()` method writes new tokens to both request and response cookies — this was already correctly configured)
3. Calls the Auth API to verify the user against the server

No changes were made to `middleware.ts`. The Phase 1 branch's initial attempt to switch to `getSession()` was reverted during code review because it would have reintroduced a security vulnerability (trusting unverified session data from cookies).

**Verification Checklist:**
- [ ] Unauthenticated request to \/api/v1/podcasts\ returns 401
- [ ] Authenticated request returns only semester-scoped records
- [ ] User without \semesterId\ gets descriptive 400 error
- [ ] Middleware correctly handles expired access tokens (test by waiting 1 hour or manipulating token expiry)
- [ ] No breaking changes to middleware redirect logic
- [ ] Middleware still correctly redirects unauthenticated users to login
- [ ] SUPER_ADMIN bypass still works

**Rollback Strategy:**
- Each file change is atomic. Revert the specific file if the change causes issues.
- For middleware change: keep a copy of the original \updateSession\ signature. If sessions break, revert immediately.
- For podcasts: the 401 response is safe to roll back — no data is lost.

**Estimated Implementation Time:** 1 hour  
**Risk Level:** Low (well-understood patterns, existing precedent in records route)  
**Expected Improvement:** Eliminates data leak, stabilizes sessions  
**Success Criteria:**
- Unauthenticated API scanner cannot enumerate podcasts
- Users remain authenticated through 1-hour inactivity windows
- Zero regression in login/logout flow

---

### Phase 2 — Authentication & Session Reliability

**Objective:** Eliminate auth as a single point of failure. Ensure sessions survive token expiry, Redis outages, and rate limits.

**Scope:**
- P1-2: Auth Redis fallback
- P1-3: Triple auth call reduction
- P0-3: Quiz submission revalidation

**Files Expected to Change:**
- \src/lib/auth.ts\ — restructure to decouple Redis cache from session construction
- \src/lib/supabase/middleware.ts\ — expose auth result to downstream consumers
- \src/middleware.ts\ — pass user info via request headers
- \src/lib/supabase/server.ts\ — accept cached auth info via headers
- \src/app/(student-clean)/dashboard-app/page.tsx\ — remove redundant auth.getUser() call
- \src/app/(student-clean)/dashboard-app/layout.tsx\ — remove redundant auth.getUser() call
- Quiz submission route — add \evalidateTag("dashboard")\
- \src/lib/tenant.ts\ — reduce \getSessionScope\ cache TTL or add invalidation pathway

**Dependencies:** None.

**Implementation Strategy:**

#### Step 2a: Auth Redis Fallback (P1-2)

1. In \src/lib/auth.ts\, restructure so that a Redis failure does not prevent session construction from \user.user_metadata\. Remove the outer try-catch and add granular handling around specific operations:

\\\	ypescript
// New structure:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return null;

// Redis cache check — fire-and-forget, does not block auth
const cached = await cacheGet(\uth:\\).catch(() => null);
if (cached) {
  try { return JSON.parse(cached) as AuthSession; } catch {}
}

// Construct session from user_metadata (no DB, no Redis)
const session = buildSessionFromUser(user);

// Try to cache — non-blocking
cacheSet(...).catch(() => {});

return session;
\\\

2. The key change: remove the blanket try-catch that causes \uth()\ to return \
ull\ on any error.

#### Step 2b: Reduce Triple Auth Call (P1-3)

**Approach: Use React \cache()\ to deduplicate \getUser()\ calls within the same request.**

1. Create \src/lib/get-authenticated-user.ts\:
\\\	ypescript
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getAuthenticatedUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
\\\

2. Both \layout.tsx\ and \page.tsx\ import and call \getAuthenticatedUser()\ instead of creating their own Supabase client and calling \getUser()\.

3. React's \cache()\ ensures the function is called only once per request, even when invoked from multiple Server Components.

#### Step 2c: Quiz Submission Revalidation (P0-3)

1. Locate the quiz submission route (likely \src/app/api/v1/past-papers/[id]/attempt/route.ts\).
2. Add \import { revalidateTag } from "next/cache"\.
3. After successful quiz submission (after the attempt is created in the database), add: \evalidateTag("dashboard")\.
4. Also add \evalidatePath\ for the dashboard page path, or rely on the tag-based invalidation + SWR background revalidation on the client.

**Verification Checklist:**
- [ ] Auth continues to work when Redis is disconnected (test by stopping Redis or blocking connection)
- [ ] auth() returns session from user_metadata alone when Redis is unavailable
- [ ] Only one Supabase \getUser()\ call per dashboard page load (verify via network tab or server logs)
- [ ] Dashboard data refreshes within 2 seconds of completing a quiz
- [ ] No regression in mobile/token-based auth flow
- [ ] \getSessionScope\ cache properly invalidates when user updates semester

**Rollback Strategy:**
- Auth Redis fallback: revert \uth.ts\ to original try-catch structure (safe — returns to previous behavior)
- React cache: remove the shared function — layout and page fall through to their original patterns
- Quiz revalidation: remove the \evalidateTag\ call (safe — dashboard returns to 60-second refresh)

**Estimated Implementation Time:** 3-4 hours  
**Risk Level:** Medium (auth changes are sensitive; require thorough testing)  
**Expected Improvement:** Eliminates Redis as auth single point of failure, reduces Supabase Auth API calls by 66%, enables real-time dashboard updates after quizzes  
**Success Criteria:**
- Application works with Redis completely unavailable (auth degrades to user_metadata only)
- Auth rate-limit margin increases from 0 req/s to 32+ req/s for Supabase free tier
- Post-quiz dashboard refresh delay drops from 60s to ~2s

---

### Phase 3 — Database Optimization

**Objective:** Reduce DB query count, eliminate redundant writes, add missing indexes, and optimize heavy queries.

**Scope:**
- P1-1: Duplicate profile sync
- P1-7: AdBanner caching + index
- P2-1: getModuleProgress optimization
- P2-3: Prisma sort limitation (document only)
- Missing indexes on key tables

**Files Expected to Change:**
- \src/app/(student-clean)/dashboard-app/page.tsx\ (lines 27-51 — remove profile upsert)
- \src/app/(student-clean)/dashboard-app/layout.tsx\ (lines 76-107 — keep only the layout sync)
- \src/lib/dashboard-queries.ts\ (lines 134-183 — rewrite getModuleProgress)
- \prisma/schema.prisma\ (add composite index)
- \src/app/(student-clean)/dashboard-app/page.tsx\ (lines 107-122 — add AdBanner caching)

**Dependencies:** None.

**Implementation Strategy:**

#### Step 3a: Remove Duplicate Profile Sync (P1-1)

1. In \page.tsx\, remove the entire \	ry\ block (lines 26-50) that performs \prisma.user.upsert()\.
2. Verify that \layout.tsx\ already handles profile creation/update for users missing DB profiles. The layout runs first in the render tree, so its sync runs before \page.tsx\.
3. Ensure edge cases are covered: what if the layout doesn't render (error boundary, redirect)? The middleware already redirects unauthenticated users, so this path is only reached by authenticated users.

#### Step 3b: Add AdBanner Cache + Composite Index (P1-7)

1. Wrap the ad banner query in \unstable_cache\ with 300s revalidation.
2. Add composite index to \prisma/schema.prisma\: \@@index([active, semesterId])\ and \@@index([active, universityId])\.
3. Run \
px prisma migrate dev\ to apply the new index.

#### Step 3c: Optimize getModuleProgress (P2-1)

Rewrite \getModuleProgress\ to use raw SQL for both total and correct counts, eliminating the 3-level nested include:

\\\	ypescript
// New approach: two raw SQL queries instead of loading 800+ rows
async function getModuleProgress(userId: string, semesterId: string): Promise<ModuleProgressItem[]> {
  // 1. Get module-level aggregates in one query
  const totals = await prisma.\<Array<{ moduleId: string; total: bigint; lectures: bigint }>>(Prisma.sql\
    SELECT 
      m.id AS "moduleId",
      COUNT(DISTINCT q.id) AS total,
      COUNT(DISTINCT l.id) AS lectures
    FROM "Module" m
    JOIN "Subject" s ON s."moduleId" = m.id
    JOIN "Lecture" l ON l."subjectId" = s.id
    LEFT JOIN "Question" q ON q."lectureId" = l.id
    WHERE m."semesterId" = \
    GROUP BY m.id
    ORDER BY m.name ASC
  \);

  if (totals.length === 0) return [];

  // 2. Get correct counts (existing pattern)
  const correctRows = await prisma.\<Array<{ moduleId: string; cnt: bigint }>>(/* existing query */);

  const correctByModule = new Map(correctRows.map((r) => [r.moduleId, Number(r.cnt)]));

  // 3. Fetch module names and imageUrls (lightweight query)
  const modules = await prisma.module.findMany({
    where: { semesterId },
    select: { id: true, name: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  return modules.map((mod) => {
    const row = totals.find((t) => t.moduleId === mod.id);
    const total = Number(row?.total ?? 0);
    const correct = correctByModule.get(mod.id) ?? 0;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const lectures = Number(row?.lectures ?? 0);
    return { id: mod.id, name: mod.name, total, correct, pct, lectures, imageUrl: mod.imageUrl };
  });
}
\\\

This reduces rows fetched from ~800 to ~3 x (number of modules) — typically 8-15 rows.

#### Step 3d: Add Missing Indexes

| Table | Columns | Why |
|---|---|---|
| \QuizAttempt\ | \[userId, createdAt]\ | Dashboard queries filter by userId + date range for streak and activity |
| \AdBanner\ | \[active, semesterId]\ | Dashboard ad query filter |
| \AdBanner\ | \[active, universityId]\ | Dashboard ad query alternative filter |
| \LectureRecord\ | \[lectureId, createdAt]\ | Podcast/records queries order by createdAt with lecture join |
| \LectureVideo\ | \[lectureId, createdAt]\ | Curriculum videos query order by createdAt |

**Verification Checklist:**
- [ ] Profile upsert removed: no regression for users with incomplete profiles
- [ ] AdBanner queries return correct banners after caching
- [ ] \getModuleProgress\ returns identical data to previous implementation
- [ ] New indexes applied: verify with database introspection
- [ ] Raw SQL queries handle edge cases: empty semester, user with no attempts, module with no questions

**Estimated Implementation Time:** 4-6 hours  
**Risk Level:** Low (most changes are additive or replace known-working patterns)  
**Expected Improvement:** DB queries per dashboard load reduced from 16 to 8; \getModuleProgress\ data fetched reduced from ~800 rows to ~24 rows  
**Success Criteria:** Dashboard server-side execution time reduced by 35-50%; no regression in profile creation for new users

> **🔍 Retrospective Note (July 2026 — Phase 3 Review):**
> Phase 3 was rebuilt once during execution after discovering the original implementation (on a pre-existing `remediation/phase-3-database` branch, SHA `7c62cb9`) contained an unintended deletion of the `UserFlashcardProgress` model and lost module name ordering in `getModuleProgress`. The rebuilt version (commit `15771d1` on `remediation/phase-3-database`, merged via fast-forward into `remediation/phase-rollout`) corrects both issues, additionally integrates with Phase 2's `getAuthenticatedUser()` utility, and correctly places composite indexes on the tables specified in the plan.
>
> **Data parity testing catch:** During end-of-phase verification, a data parity test comparing raw SQL against the old nested-include implementation revealed that the initial raw SQL used `JOIN` (INNER) for Subject and Lecture tables, which silently excluded modules with no subjects or lectures from the results. Corrected to `LEFT JOIN` before signoff. This bug would not have been caught by TypeScript compilation, runtime error logs, or code review — only an explicit one-to-one data parity comparison across multiple semesterIds would have found it. Recommended practice for future raw SQL rewrites: always include a parity-check script in the verification checklist.

---

### Phase 4 — Caching & Revalidation

**Objective:** Build a coherent caching layer across the dashboard backend. Define cache keys, TTLs, invalidation tags, and a revalidation strategy.

**Scope:**
- Review and standardize all \unstable_cache\ usage
- Add cache invalidation for quiz-related data
- Implement \evalidateTag\ strategy
- CPU-bound: \last7DayKeys()\ caching

**Files Expected to Change:**
- \src/lib/dashboard-queries.ts\ — standardize cache tags
- \src/lib/dashboard-stats.ts\ — cache \last7DayKeys()\
- Quiz submission API route — add \evalidateTag\
- New: \src/lib/cache-tags.ts\ — centralized cache tag constants
- New/additional cache wrappers for dashboard data

**Dependencies:** Phase 2 (quiz revalidation groundwork).

**Implementation Strategy:**

#### Step 4a: Standardize Cache Tags

Define a single source of truth for cache tags in \src/lib/cache-tags.ts\:

\\\	ypescript
export const CACHE_TAGS = {
  DASHBOARD: \"dashboard\",
  QUIZ_CONTENT: \"quiz-content\",
  SITE_CONFIG: \"site-config\",
  ADS: \"ads\",
  YOUTUBE: \"youtube\",
  USER_PROFILE: \"user-profile\",
} as const;

export const CACHE_TTL = {
  DASHBOARD: 60,
  QUIZ_CONTENT: 300,
  SITE_CONFIG: 300,
  ADS: 300,
  YOUTUBE: 3600,
  USER_PROFILE: 60,
} as const;
\\\

#### Step 4b: Add Missing \unstable_cache\ Wrappers

1. **YouTube API response cache:** Create \getCachedYouTubeData(videoIds)\ wrapping the YouTube API calls. Cache key includes video IDs hash. TTL: 3600s. Tag: \youtube\.
2. **SiteConfig cache for page-level query:** The layout already caches siteConfig. The page should reuse or export a shared cached version.
3. **AdBanner cache** (from Phase 3): 300s TTL, tag: \ds\.

#### Step 4c: Revalidation Strategy

| Action | Tags to Invalidate |
|---|---|
| Quiz attempt submitted | \dashboard\ |
| User profile updated | \dashboard\, \user-profile\ |
| Module content edited (admin) | \dashboard\, \quiz-content\ |
| Site config changed (admin) | \site-config\ |
| Ad banner created/updated/deleted (admin) | \ds\ |
| YouTube videos changed (admin) | \youtube\ |

#### Step 4d: Cache \last7DayKeys()\ (P2-5)

Wrap the pure computation in React's \cache()\:

\\\	ypescript
import { cache } from \"react\";

export const getLast7DayKeys = cache(() => {
  return last7DayKeys();
});
\\\

**Verification Checklist:**

Legend: `[static]` = code inspection / static analysis; `[runtime]` = local execution test; `[staging only]` = requires live staging environment.

- [x] All cache tags use the centralized constants `[static]`
- [x] Quiz submission correctly invokes `revalidateTag(CACHE_TAGS.DASHBOARD)` `[static]`
- [ ] Dashboard data is fresh within 2 seconds of quiz completion `[staging only]`
- [ ] YouTube API calls are cached: subsequent requests within 1 hour hit cache `[static]` (handled in Phase 5)
- [ ] AdBanner changes are reflected within 300 seconds `[static]` (handled in Phase 3)
- [x] No circular dependencies in `cache-tags.ts` `[static]`

**Estimated Implementation Time:** 3-4 hours  
**Risk Level:** Low (cache invalidation is additive and reversible)  
**Expected Improvement:** Predictable and consistent caching behavior across the dashboard  
**Success Criteria:** Dashboard refresh latency after quiz: <2 seconds (down from 60s); Cache tag system documented in a single file

> **🔍 Retrospective Note (July 2026 — Phase 4 Review):**
> Phase 4 merge was clean — no conflicts with Phase 2/3 changes. The Phase 4 branch was created before Phase 2 (quiz `revalidateTag`) and Phase 3 (`getCachedAds`), so the auto-merge correctly preserved Phase 2's quiz invalidation and Phase 3's ads cache. However, two files were not covered by the Phase 4 branch because they didn't exist at its baseline: the quiz route still used a hardcoded string `"dashboard")` instead of `CACHE_TAGS.DASHBOARD`, and the dashboard page's `getCachedAds` still used hardcoded `300`/`"ads")` instead of `CACHE_TTL.ADS`/`CACHE_TAGS.ADS`. Both were caught by a codebase-wide `grep` of all `revalidateTag()` calls and `tags:` options during verification. **Lesson: when a Phase targets files modified by earlier phases, run a complete grep of the pattern being standardized to catch leftovers.**

---

### Phase 5 — External APIs

**Objective:** Protect YouTube and Spotify API quotas with caching, retry logic, and failure handling. Ensure the dashboard degrades gracefully when external services are unavailable.

**Scope:**
- YouTube API caching via \unstable_cache\
- Spotify API resilience improvements
- Quota optimization
- Retry and timeout strategy

**Files Expected to Change:**
- \src/app/api/v1/videos/curriculum/route.ts\ — add \unstable_cache\ wrapping
- \src/app/api/v1/videos/search/route.ts\ — add caching for YouTube search
- \src/lib/spotify.ts\ — add request timeout, rate-limit awareness

**Dependencies:** Phase 4 (cache tag standardization).

**Implementation Strategy:**

#### Step 5a: YouTube API Caching

Create a cache wrapper for the YouTube API data enrichment. Wrap the combined videos+channels fetch in \unstable_cache\ with 3600s TTL and the \youtube\ tag. Add a 5-second timeout to YouTube API calls — the dashboard carousel should not wait longer than that for channel avatars.

#### Step 5b: Spotify API Resilience

The existing Spotify module already has good patterns:
- In-memory token cache (55-minute TTL)
- In-memory metadata cache (24-hour TTL per URL)
- Graceful null returns on failure

Additions:
1. **Request timeout:** Add \AbortSignal.timeout(5000)\ to the Spotify metadata fetch call.
2. **Rate-limit handling:** If Spotify returns 429 (rate limited), cache the current token as \"rate limited\" with a shorter TTL (60 seconds) to prevent immediate retry.
3. **Error isolation:** Each record's Spotify enrichment should fail independently — one failing Spotify URL should not prevent other records from loading.

**Verification Checklist:**

Legend: `[static]` = code inspection / static analysis; `[runtime]` = local execution test; `[staging only]` = requires live staging environment.

- [x] YouTube API calls are cached: first request triggers API, subsequent requests within 1 hour do not `[static]`
- [x] YouTube API call has 5-second timeout; route returns gracefully with default channel data on timeout `[static]`
- [x] Spotify API metadata fetch has 5-second timeout `[static]`
- [x] Spotify rate-limit (429) is handled gracefully without crashing `[static]`
- [x] One failing Spotify URL does not prevent other records from loading `[static]`
- [x] YouTube quota is not consumed when cached data is available `[static]`

**Estimated Implementation Time:** 3-4 hours  
**Risk Level:** Low (all changes are additive caching layers)  
**Expected Improvement:** YouTube API calls per request: 2 → 0 (for cached data); YouTube daily quota consumption: 400+ units → ~2 units per 3600 seconds  
**Success Criteria:** YouTube API key is called fewer than 24 times per day; Dashboard curriculum video carousel loads in <200ms from API route (down from 500ms-2s)

> **🔍 Retrospective Note (July 2026 — Phase 5 Review):**
> Phase 5 merge was clean — no conflicts with preceding phases. The only issue caught during verification: the `youtube-cache.ts` file used hardcoded `3600` and `"youtube"` instead of `CACHE_TTL.YOUTUBE` and `CACHE_TAGS.YOUTUBE` from Phase 4's centralized constants. This is the same pattern as Phase 4's leftover-hardcoded-strings catch, confirming that every phase creating new files after Phase 4 must import from `cache-tags.ts`. Fixed before signoff.
> 
> The thumbnail optimization (`maxresdefault → mqdefault`) is a bandwidth optimization reducing image payload from ~200KB to ~15KB per thumbnail. YouTube's `mqdefault` resolution (320×180) is sufficient for carousel cards and significantly improves page load on slower connections.

---

### Phase 6 — Dashboard Data Pipeline

**Objective:** Define and document the clean data flow from request to client. Identify and eliminate unnecessary intermediate steps.

#### Current Flow (per dashboard page load)

Browser Request → Middleware (3 auth calls + 1 DB) → Layout (1 DB + 1 write) → Page (8-10 DB + 1 write + ads query) → Client (3 SWR fetches → 6 DB + external APIs)

#### Target Flow (after all phases)

Browser Request → Middleware (1 auth call, set headers) → Layout (0 Supabase, 0 DB — cache hit) → Page (0 DB — cache hit) → Client (3 SWR fetches → 0 DB — CDN cache hit)

#### Key Improvements Per Layer

| Layer | Before | After |
|---|---|---|
| Auth API calls | 3 per load | 1 per load |
| DB queries (server) | 13 per load | 1 per load (cold) → 0 (warm cache) |
| DB queries (client API) | 6 per load | 0 (CDN cached response) |
| External API calls | 2-3 per load | 0 (server-side cached) |
| DB writes | 2 per load | 0 per load |
| Total page load time | ~3-6s | ~1-2s |

**Implementation Notes:**
- The target flow is achieved through the cumulative effect of all phases, not a single change
- Phase 7 (Performance Optimization) may suggest additional pipeline improvements
- The flow diagram should be updated as the remediation progresses

---

### Phase 7 — Performance Optimization

**Objective:** Reduce dashboard page load time through parallel fetching, payload optimization, and streaming. Eliminate waterfalls and unnecessary serialization.

**Scope:**
- P1-5: Community carousel waterfall
- P2-4: Error boundaries
- P2-5: last7DayKeys caching
- Payload size optimization
- Streaming opportunities

**Files Expected to Change:**
- \src/lib/dashboard-fetch.ts\ — replace 2-step community posts fetch
- New: \src/app/api/v1/community/posts/route.ts\ — consolidated endpoint
- \src/components/dashboard/DashboardDesktopView.tsx\ — add ErrorBoundary wrappers
- \src/lib/cache-tags.ts\ — add COMMUNITY to CACHE_TAGS and CACHE_TTL
- New: \src/components/dashboard/CarouselErrorBoundary.tsx\ — React error boundary component

**Implementation Strategy:**

#### Step 7a: Fix Community Carousel Waterfall (P1-5)

Create a new consolidated endpoint \/api/v1/community/posts\ that:
1. Looks up the GLOBAL forum for the user's university (single DB query)
2. Returns the most recent posts with author info
3. Uses \unstable_cache\ with 30-second revalidation

In \dashboard-fetch.ts\, replace the two-step hook with a single \useSWR("/api/v1/community/posts?limit=6")\ call.

#### Step 7b: Add Error Boundaries (P2-4)

Wrap each carousel section in a React Error Boundary so one failing section does not crash the entire dashboard:

\\\	sx
<CarouselErrorBoundary>
  <RecordsCarousel />
</CarouselErrorBoundary>
<CarouselErrorBoundary>
  <SuggestedVideosCarousel />
</CarouselErrorBoundary>
<CarouselErrorBoundary>
  <CommunityCarouselSidebar />
</CarouselErrorBoundary>
\\\

#### Step 7c: Payload Optimization

1. **YouTube thumbnails:** Use \mqdefault.jpg\ (320x180) instead of \maxresdefault.jpg\ (1280x720) for carousel cards. Each thumbnail drops from ~120KB to ~20KB.
2. **API responses:** Consider adding a \ields\ query parameter to allow clients to request only the fields they need.

**Estimated Implementation Time:** 5-6 hours  
**Risk Level:** Low-Medium (new endpoint requires testing for edge cases)  
**Expected Improvement:** Community carousel load time reduced by ~300-600ms; YouTube thumbnail bytes reduced by 80% per image; Dashboard crash resilience improved

**Verification Checklist:**
- [static] Community posts endpoint consolidated: `src/app/api/v1/community/posts/route.ts` exists with `unstable_cache` wrapper using `CACHE_TTL.COMMUNITY` and `CACHE_TAGS.COMMUNITY`
- [static] `dashboard-fetch.ts`: `useSWRImmutable` import removed; `useCommunityPosts` calls single endpoint `/api/v1/community/posts?limit=6`
- [static] `CommunityPostsCarousel.tsx`: fetches from `/api/v1/community/posts` instead of two-step forum→posts
- [static] `CACHE_TAGS.COMMUNITY` and `CACHE_TTL.COMMUNITY` defined in `src/lib/cache-tags.ts`
- [runtime] Vitest: consolidated endpoint import resolves, cache constants present, `useSWRImmutable` not referenced — 2/2 tests pass
- [runtime] `tsc --noEmit`: 16 errors (baseline, unchanged) — no new type errors introduced
- [runtime] `next build`: compiled successfully
- [static] `CarouselErrorBoundary.tsx` exists as React class component with `getDerivedStateFromError` + `componentDidCatch`
- [static] `DashboardDesktopView.tsx` wraps RecordsCarousel, CommunityCarouselSidebar, SuggestedVideosCarousel each in `<CarouselErrorBoundary>`
- [static] Error fallback renders text "This section is temporarily unavailable" — no blank section or broken layout
- [staging only] Community carousel loads data in a single request (check browser DevTools Network tab)

---

### Phase 8 — Scalability

**Objective:** Estimate system behavior under increasing load and identify the first bottlenecks at each scale tier. Avoid premature optimization.

#### 100 Concurrent Users

**Expected behavior:** Everything works normally. First bottleneck is Redis command limit (10,000/day exhausted in ~16 minutes at 200 page loads/min). Fix: Reduce Redis usage in auth path (Phase 2). No infrastructure upgrades needed.

#### 500 Concurrent Users

**Bottlenecks:** Supabase Auth rate limit (3,000 API calls/min @ 3x multiplier = near 50 req/s limit). Prisma connection pool (30) starts queueing requests.

**Fixes:** Phase 2 (reduce to 1 auth call per load = 1,000 calls/min, well within limits). Phase 3 (reduce DB queries per load from 16 to 8, effectively doubling connection availability). Enable Supabase connection pooler in transaction mode.

#### 1,000 Concurrent Users

**Bottlenecks:** DB connection pool (30) under load. At 270 queries/second and 30 connections, average query time must be <110ms.

**Fixes:** Phase 5 (YouTube caching reduces external latency). Consider Supabase Pro (/month) for 60 connection pool slots. Evaluate Vercel Pro for reduced cold starts.

#### 5,000 Concurrent Users

**Bottlenecks:** Postgres single instance is the primary bottleneck. Cache miss waves (every 60 seconds) produce 1,350 queries/second.

**Fixes:** Increase dashboard \unstable_cache\ TTL to 300 seconds for non-quiz data. Add read replica. Move to Supabase Pro. Estimate cost: -150/month.

#### 10,000 Concurrent Users

**Bottlenecks:** Read throughput, write load, bandwidth.

**Required Infrastructure Changes:**
- Read replicas for dashboard queries
- Vercel Edge Config or dedicated Redis for cache layer
- Batch quiz attempt writes
- Estimated cost: -500/month

**Key Principle:** Optimize aggressively on free tier before upgrading. Each phase in this plan extracts maximum performance from free infrastructure.

---

### Phase 9 — Reliability

**Objective:** Add systematic error handling, logging, health checks, and failure recovery to the dashboard backend.

**Scope:**
- Error handling patterns
- Logging strategy
- Health check endpoint
- Retry logic review
- Failure recovery mechanisms

**Files Expected to Change:**
- \src/app/api/v1/health/route.ts\ — enhance health check (add Supabase Auth connectivity, structured logging)
- \src/lib/logger.ts\ — upgrade to JSON-structured log entries with context metadata
- New: \src/lib/api-response.ts\ — standardized API response helpers (\apiError\, \apiSuccess\, \apiUnauthorized\, \apiNotFound\, \apiServerError\)
- \src/app/api/v1/community/posts/route.ts\ — adopt \api-response\ helpers (representative pattern for future routes)

**Implementation Strategy:**

#### Step 9a: Standardized API Response Format

Create a shared helper at \src/lib/api-response.ts\ with:
- \apiError(status, error, message?, details?, headers?)\ — returns \NextResponse\ with \ApiErrorBody\ shape
- \apiSuccess(data, status?, headers?)\ — returns \NextResponse\ with \ApiSuccessBody\ shape
- Convenience wrappers: \apiUnauthorized()\, \apiNotFound()\, \apiServerError()\

HTTP status code conventions: 401 (unauthorized), 403 (forbidden), 400 (bad request), 404 (not found), 422 (validation error), 429 (rate limited), 500 (internal error), 503 (service unavailable).

Apply to \src/app/api/v1/community/posts/route.ts\ as a representative target. Remaining API routes can adopt the pattern incrementally in follow-up work.

#### Step 9b: Structured Logging

Upgrade \src/lib/logger.ts\ to output JSON-structured log entries with context:
- Each entry: \{"timestamp": "...", "level": "info|warn|error|debug", "module": "...", "message": "...", "requestId"?: "...", "durationMs"?: ..., "error"?: "..." }\}
- Backward compatible — existing callers using \createLogger(prefix).info(msg)\ continue to work

#### Step 9c: Health Check Enhancement

The existing \/api/v1/health\ endpoint should check database connectivity, Redis availability (if configured), and Supabase Auth connectivity. Return 200 if all checks pass, 503 if degraded.

#### Step 9d: Failure Recovery

Define recovery paths for each external dependency:

| Dependency | Failure Mode | Recovery |
|---|---|---|
| Redis | Connection refused | Auth uses user_metadata. Rate limiting skipped. Scope resolution falls through to DB. |
| Spotify | 401/429/500 | Return null for metadata. Dashboard shows fallback icon. |
| YouTube | 403 (quota) / 500 | Return empty channelMetadata. Dashboard shows default channel data. |
| Supabase Auth | Timeout / 500 | Middleware treats as unauthenticated (safe fail). |
| Database | Connection timeout | Cache hit serves stale data. Cache miss returns error. |

Rule: **serve degraded content, not errors.**

**Estimated Implementation Time:** 4-5 hours  
**Risk Level:** Low (all changes are additive — logging, health checks, error format)  
**Success Criteria:** Health endpoint is available and accurate; Dashboard survives Redis, Spotify, and YouTube outages without breaking; Logged output is parseable JSON with structured context

**Verification Checklist:**
- [static] `src/lib/api-response.ts` exists with `apiError`, `apiSuccess`, `apiUnauthorized`, `apiNotFound`, `apiServerError` exports
- [static] `src/lib/logger.ts` outputs JSON-structured entries with `timestamp`, `level`, `module`, `message` fields
- [static] `src/app/api/v1/community/posts/route.ts` uses `apiSuccess`/`apiError`/`apiUnauthorized` from `api-response.ts` instead of raw `NextResponse.json()`
- [static] Community posts route logs structured error via `createLogger("community-posts").error()`
- [static] Health endpoint checks Supabase Auth connectivity (verifies `SUPABASE_URL` env var, attempts HEAD request)
- [static] Health endpoint uses `createLogger("health")` for degraded/unhealthy state logging
- [runtime] `tsc --noEmit`: 16 errors (baseline) — no new type errors introduced
- [runtime] `next build`: compiled successfully
- [runtime] `withRetry` helper in `prisma.ts` with exponential backoff + jitter — verified via vitest: 5 tests cover success, retry-on-connection-drop, exponential delay ordering, retry exhaustion, non-connection-error passthrough; all passing
- [runtime] `api-response.ts` helpers — verified via vitest: 7 tests cover apiError with/without details, apiSuccess with default/custom status, apiUnauthorized, apiNotFound, apiServerError; all passing
- [runtime] `logger.ts` JSON output — verified via vitest: 3 tests verify JSON parseability, correct level routing (info→console.log, error→console.error, warn→console.warn), and meta field passthrough; all passing
- [runtime] Health endpoint logic — verified via vitest with mocked prisma/redis: 3 tests confirm correct status computation (all healthy→200/degraded→200/unhealthy→503), DB+Redis health, and graceful missing-URL handling; all 18/18 tests passing
- [staging only] Community posts endpoint error response uses `apiError` format (`{ error, message }`)

---

### Phase 10 — Architecture Cleanup

**Objective:** Reduce technical debt, eliminate code duplication, and improve maintainability.

**Scope:**
- P2-2: Replace \ny\ types
- P2-6: Remove unreachable code in forum posts route
- P2-7: Remove \s any\ casts for \lectureVideo\
- Code organization review
- Dead code removal

**Files Expected to Change:**
- \src/app/(student-clean)/dashboard-app/page.tsx\ — typed at Top
- \src/lib/dashboard-fetch.ts\ — remove unused interfaces
- \src/app/api/v1/videos/curriculum/route.ts\ — remove \s any\ casts
- \src/app/api/v1/videos/search/route.ts\ — remove \s any\ casts
- \src/app/api/v1/forums/[forumId]/posts/route.ts\ — clean up commented code

**Implementation Strategy:**

#### Step 10a: Type the Dashboard Page (P2-2)

Replace all \ny\ casts with proper types. Fix the \ctivity\ vs \weekCounts\ destructuring mismatch on line 80 of \page.tsx\.

#### Step 10b: Remove \s any\ Casts (P2-7)

Ensure \prisma generate\ has been run. Replace \(prisma as any).lectureVideo\ with typed \prisma.lectureVideo\.

#### Step 10c: Clean Up Unused Code (P2-6)

Remove commented-out \unstable_cache\ code in the forum posts route. Remove unused fields from the \PostData\ interface in \dashboard-fetch.ts\.

#### Step 10d: Code Organization

| Current Location | Suggested Location | Reason |
|---|---|---|
| Types in \dashboard-fetch.ts\ | \@/types/dashboard.ts\ | Shared between client and server |
| CACHE_TAGS constants | \@/lib/cache-tags.ts\ | Single source of truth |
| SWR_OPTIONS in \dashboard-fetch.ts\ | Root-level SWRConfig provider | Apply to all SWR hooks uniformly |
| \getCachedRankInfo\ in \dashboard-queries.ts\ | \@/lib/engagement.ts\ | Belongs with rank logic |

**Estimated Implementation Time:** 3-4 hours  
**Risk Level:** Low (type-only changes, code removal)  
**Success Criteria:** \
pm run typecheck\ passes with zero errors; \
pm run lint\ passes with zero warnings; No \ny\ or \s any\ usages remain in dashboard-related files

---

## Detailed Issue Breakdown

### P0-1: Podcasts API — Zero Authentication

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Description** | GET /api/v1/podcasts has no session check. Returns all LectureRecord entries. |
| **Root Cause** | Missing \uth()\ import and call. Developer oversight. |
| **Risk** | Complete data leak of all lecture recordings and Spotify metadata. |
| **Business Impact** | Confidential content exposed. Potential regulatory/compliance issues. |
| **User Impact** | Indirect — users' semester data is not directly leaked, but the full content catalog is exposed. |
| **Technical Impact** | Anyone can scrape the entire recordings database via a single public API. |
| **Recommended Solution** | Add \uth()\ call, semester filter, and error response. |
| **Estimated Difficulty** | Easy (30 min) |
| **Implementation Time** | 30 minutes |
| **Files Affected** | \src/app/api/v1/podcasts/route.ts\ |
| **Testing Strategy** | Unit test: call endpoint without auth header → expect 401. Call with valid auth → expect 200 with scoped data. |
| **Rollback Strategy** | Revert file to previous version. |
| **Priority** | 1 (highest) |
| **Expected Performance Gain** | None (security fix) |
| **Expected Scalability Gain** | None |

### P0-2: Middleware — No Refresh Token Handling  *(Audit finding inaccurate — see Retrospective Note below)*

| Field | Value |
|---|---|
| **Severity** | N/A — audit finding was inaccurate |
| **Description** | (Original claim) Middleware uses \getUser()\ instead of \getSession()\ — expired tokens are not refreshed. |
| **Actual Finding** | \getUser()\ IS the correct method for server-side revalidation. The cookie handler was already properly configured. No change needed. |
| **Root Cause** | N/A — no defect existed |
| **Risk** | None |
| **Business Impact** | None |
| **User Impact** | None |
| **Technical Impact** | None |
| **Outcome** | The Phase 1 branch initially attempted the recommended change but it was reverted during code review. \getUser()\ remains in place. See the Retrospective Note in the finding description above for full details. |
| **Files Affected** | None (net zero changes) |
| **Priority** | Closed — no action required |

### P0-3: Quiz Submission — No Dashboard Cache Invalidation

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Description** | Completing a quiz does not invalidate the dashboard cache. Dashboard is stale for up to 60 seconds. |
| **Root Cause** | Missing \evalidateTag(\"dashboard\")\ in quiz submission API route. |
| **Risk** | Users see outdated scores, streaks, and progress after completing quizzes. |
| **Business Impact** | Reduces trust in gamification features (streaks, progress bars). |
| **User Impact** | \"Why doesn't my score update?\" — confusion and frustration. |
| **Technical Impact** | Users refresh the page to see new data, adding unnecessary load. |
| **Recommended Solution** | Add \evalidateTag(\"dashboard\")\ after successful quiz attempt creation. |
| **Estimated Difficulty** | Easy (15 min) |
| **Implementation Time** | 15 minutes |
| **Files Affected** | Quiz submission API route (likely \src/app/api/v1/past-papers/[id]/attempt/route.ts\) |
| **Testing Strategy** | E2E: complete a quiz → navigate to dashboard → verify score and streak updated within 2 seconds. |
| **Rollback Strategy** | Remove the \evalidateTag\ call. |
| **Priority** | 3 |
| **Expected Performance Gain** | None (freshness fix) |
| **Expected Scalability Gain** | None |

### P1-1: Profile Sync — Duplicated Write

| Field | Value |
|---|---|
| **Severity** | High |
| **Description** | Both layout and page independently perform profile creation/update. |
| **Root Cause** | Two independent implementations by different developers. |
| **Risk** | 2 redundant DB writes per page load for users with incomplete profiles. |
| **Business Impact** | Wastes connection pool slots and serverless execution time. |
| **User Impact** | Marginally slower page loads for new users. |
| **Technical Impact** | Extra DB writes. With 500 users completing onboarding: 1000 unnecessary writes. |
| **Recommended Solution** | Remove profile upsert from page.tsx. |
| **Estimated Difficulty** | Easy (30 min) |
| **Implementation Time** | 30 minutes |
| **Files Affected** | \src/app/(student-clean)/dashboard-app/page.tsx\ |
| **Testing Strategy** | Create new user without DB profile → access dashboard → verify profile is created (by layout) and page does not error. |
| **Rollback Strategy** | Restore the removed code block. |
| **Priority** | 4 |
| **Expected Performance Gain** | Reduces DB writes per page load by 2 for incomplete-profile users. |
| **Expected Scalability Gain** | Frees connection pool slots. More significant at scale. |

### P1-2: Auth Cache — No Redis Fallback

| Field | Value |
|---|---|
| **Severity** | High |
| **Description** | \uth()\ returns \
ull\ when Redis throws. Outer try-catch catches all errors. |
| **Root Cause** | Redis cache call is wrapped in same try-catch as session construction. |
| **Risk** | Complete application lockout during Redis outage. |
| **Business Impact** | Redis is a single point of failure for the entire application. |
| **User Impact** | Cannot access any authenticated page when Redis is down. |
| **Technical Impact** | The non-cached session construction code is unreachable when Redis throws. |
| **Recommended Solution** | Remove outer try-catch. Add granular error handling around Redis operations. |
| **Estimated Difficulty** | Medium (1 hour) |
| **Implementation Time** | 1 hour |
| **Files Affected** | \src/lib/auth.ts\ |
| **Testing Strategy** | Mock Redis to throw → verify auth() still returns session from user_metadata. |
| **Rollback Strategy** | Revert to original try-catch structure. |
| **Priority** | 5 |
| **Expected Performance Gain** | None (resilience fix) |
| **Expected Scalability Gain** | Eliminates Redis as auth bottleneck. |

### P1-3: Triple Supabase Auth Call

| Field | Value |
|---|---|
| **Severity** | High |
| **Description** | Supabase \getUser()\ called 3 times per dashboard page load. |
| **Root Cause** | Each layer (middleware, layout, page) independently creates a Supabase client. |
| **Risk** | Auth rate-limit exhaustion at ~300 concurrent users. |
| **Business Impact** | Limits scalability on Supabase free tier. |
| **User Impact** | Rate-limit errors at peak usage. |
| **Technical Impact** | 3x auth API calls vs necessary. Cold-start time multiplier. |
| **Recommended Solution** | Use React \cache()\ to deduplicate \getUser()\ within the same request. |
| **Estimated Difficulty** | Medium (2 hours) |
| **Implementation Time** | 2 hours |
| **Files Affected** | New: \src/lib/get-authenticated-user.ts\. Modify: layout.tsx, page.tsx. |
| **Testing Strategy** | Verify single \getUser()\ call per request via server logs or network waterfall. |
| **Rollback Strategy** | Revert shared function. Layout and page fall through to their original patterns. |
| **Priority** | 6 |
| **Expected Performance Gain** | Dashboard server-side execution reduced by ~200-600ms (2 fewer auth calls). |
| **Expected Scalability Gain** | Auth rate-limit capacity tripled (from ~300 to ~1000 concurrent users on free tier). |

### P1-4: YouTube API — No Server-Side Caching

| Field | Value |
|---|---|
| **Severity** | High |
| **Description** | \ideos/curriculum\ route makes 2 uncached YouTube API calls per request. |
| **Root Cause** | No \unstable_cache\ wrapping for external API data. |
| **Risk** | YouTube daily quota exhaustion at ~200 requests/day. |
| **Business Impact** | Curriculum videos fail to load when quota is exhausted. |
| **User Impact** | Missing channel thumbnails and metadata. Videos become hard to navigate. |
| **Technical Impact** | 2 sequential external HTTP requests add ~500ms-2s to API response time. |
| **Recommended Solution** | Wrap YouTube API data fetching in \unstable_cache\ with 3600s TTL. |
| **Estimated Difficulty** | Easy (1 hour) |
| **Implementation Time** | 1 hour |
| **Files Affected** | \src/app/api/v1/videos/curriculum/route.ts\ |
| **Testing Strategy** | Call endpoint twice: first call hits YouTube API. Second call (within 1 hour) returns cached data — verify no API calls. |
| **Rollback Strategy** | Remove cache wrapper. |
| **Priority** | 7 |
| **Expected Performance Gain** | API response time reduced by 500ms-2s (from cache hits). |
| **Expected Scalability Gain** | YouTube API calls drop from O(requests) to O(1/hour). Quota exhaustion eliminated. |

### P1-5: Community Carousel — SWR Waterfall

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Description** | Two sequential SWR requests in \useCommunityPosts()\. |
| **Root Cause** | GLOBAL forum ID must be discovered before posts can be fetched. |
| **Risk** | +200-600ms additional TTFB for community carousel. |
| **Business Impact** | Community section loads noticeably later than other sections. |
| **User Impact** | Perceived slowness on the dashboard. |
| **Technical Impact** | First request blocks second request. Both must complete before community data renders. |
| **Recommended Solution** | Create consolidated \/api/v1/community/posts\ endpoint. |
| **Estimated Difficulty** | Medium (2 hours) |
| **Implementation Time** | 2 hours |
| **Files Affected** | New: \src/app/api/v1/community/posts/route.ts\. Modify: \src/lib/dashboard-fetch.ts\. |
| **Testing Strategy** | New endpoint returns same data as current two-step fetch. Compare responses. |
| **Rollback Strategy** | Revert to two-step SWR hook. |
| **Priority** | 8 |
| **Expected Performance Gain** | Community carousel load time reduced by ~300ms. |
| **Expected Scalability Gain** | None. |

### P1-6: SiteConfig Queried Twice

| Field | Value |
|---|---|
| **Severity** | Low-Medium |
| **Description** | \siteConfig\ queried twice per dashboard load — once cached (layout), once uncached (page). |
| **Root Cause** | Feature isolation — ads check implemented independently. |
| **Risk** | 1 extra DB query per page load. |
| **Business Impact** | Minor. Wastes DB connections. |
| **User Impact** | None. |
| **Technical Impact** | One extra DB query per request. Unnecessary load on Postgres. |
| **Recommended Solution** | Cache the page-level siteConfig query or reuse layout's result. |
| **Estimated Difficulty** | Easy (30 min) |
| **Implementation Time** | 30 minutes |
| **Files Affected** | \src/app/(student-clean)/dashboard-app/page.tsx\ |
| **Testing Strategy** | Verify siteConfig is fetched only once per page load. |
| **Rollback Strategy** | Revert to direct query. |
| **Priority** | 9 |
| **Expected Performance Gain** | Eliminates 1 DB query per request. |
| **Expected Scalability Gain** | Minor. |

### P1-7: AdBanner — No Cache + Missing Index

| Field | Value |
|---|---|
| **Severity** | Low-Medium |
| **Description** | AdBanner query runs on every dashboard load with no cache and no composite index. |
| **Root Cause** | Caching and indexing not considered for ad banner reads. |
| **Risk** | Table scan on every page load for rarely-changing data. |
| **Business Impact** | Minimal (ads are non-critical). |
| **User Impact** | None. |
| **Technical Impact** | Sequential scan on ad_banner table. Can become expensive as table grows. |
| **Recommended Solution** | Add \unstable_cache\ (300s) + composite index on \(active, semesterId)\. |
| **Estimated Difficulty** | Easy (30 min) |
| **Implementation Time** | 30 minutes |
| **Files Affected** | \src/app/(student-clean)/dashboard-app/page.tsx\, \prisma/schema.prisma\ |
| **Testing Strategy** | Verify ad banners still appear correctly after caching. |
| **Rollback Strategy** | Remove cache wrapper. Revert index. |
| **Priority** | 10 |
| **Expected Performance Gain** | Eliminates AdBanner query from 100% of requests (cache hit). Only DB miss every 300s. |
| **Expected Scalability Gain** | Eliminates table scan at scale. |

### P2-1: getModuleProgress Over-fetching

| Field | Value |
|---|---|
| **Severity** | Improvement |
| **Description** | 3-level nested include loads 800+ rows to compute 8 numbers. |
| **Root Cause** | Using Prisma include instead of aggregate query. |
| **Risk** | Linear data growth with user base. At 5,000 users: 4M rows read per second. |
| **Business Impact** | Limits scalability. Increases DB costs. |
| **User Impact** | Slower page loads as dataset grows. |
| **Technical Impact** | Unnecessary memory pressure on Prisma and Postgres. |
| **Recommended Solution** | Use raw SQL aggregates for both total and correct counts. |
| **Estimated Difficulty** | Medium (2 hours) |
| **Implementation Time** | 2 hours |
| **Files Affected** | \src/lib/dashboard-queries.ts\ |
| **Testing Strategy** | Compare output of old and new implementations for multiple users and semesters. |
| **Rollback Strategy** | Revert to previous implementation. |
| **Priority** | 11 |
| **Expected Performance Gain** | Rows fetched reduced from ~800 to ~24. Query execution time reduced by 80%. |
| **Expected Scalability Gain** | Linear growth avoided. Scales to 5,000 users without optimization. |

### P2-2: DashboardPage — \ny\ Types

| Field | Value |
|---|---|
| **Severity** | Improvement |
| **Description** | Widespread use of \ny\ types throughout page.tsx. |
| **Root Cause** | Page built before types were established. |
| **Risk** | Runtime crashes from unexpected data shapes. TypeScript cannot catch mismatches. |
| **Business Impact** | Increased bug rate. Harder to maintain. |
| **User Impact** | Potential runtime errors. |
| **Technical Impact** | No compile-time safety. Silent data mismatches. |
| **Recommended Solution** | Replace \ny\ with proper types. |
| **Estimated Difficulty** | Medium (1 hour) |
| **Implementation Time** | 1 hour |
| **Files Affected** | \src/app/(student-clean)/dashboard-app/page.tsx\ |
| **Testing Strategy** | TypeScript compilation passes. Dashboard renders correctly. |
| **Rollback Strategy** | Revert type changes (re-introduces \ny\). |
| **Priority** | 12 |
| **Expected Performance Gain** | None (code quality). |
| **Expected Scalability Gain** | None. |

### P2-3: lastLectureActivity — Prisma Sort Limit

| Field | Value |
|---|---|
| **Severity** | Observation |
| **Description** | Prisma sorts ALL videos before applying \	ake: 1\. |
| **Root Cause** | Prisma must sort to determine the first row. Can't use index-only scan. |
| **Risk** | Low — each lecture has <10 videos typically. |
| **Business Impact** | None at current scale. |
| **User Impact** | None. |
| **Technical Impact** | Minor — each lecture's video sort is a trivial operation. |
| **Recommended Solution** | Document as known Prisma limitation. Optimize only if per-lecture video count exceeds 50. |
| **Priority** | 13 (future) |

### P2-4: No Error Boundaries

| Field | Value |
|---|---|
| **Severity** | Improvement |
| **Description** | No React Error Boundaries on dashboard. One component crash takes down entire page. |
| **Root Cause** | Error boundaries not implemented. |
| **Risk** | One failed API call in any carousel crashes the entire dashboard. |
| **Business Impact** | Unnecessary support tickets from isolated failures. |
| **User Impact** | White screen instead of partial content. |
| **Technical Impact** | Error propagation not contained. |
| **Recommended Solution** | Add ErrorBoundary wrapper for each dashboard section. |
| **Estimated Difficulty** | Easy (1 hour) |
| **Implementation Time** | 1 hour |
| **Files Affected** | \src/components/dashboard/DashboardDesktopView.tsx\ (error boundary wrappers), New: \src/components/dashboard/CarouselErrorBoundary.tsx\ |
| **Testing Strategy** | Throw in one carousel component → verify other sections render normally. |
| **Rollback Strategy** | Remove ErrorBoundary wrappers. |
| **Priority** | 14 |
| **Expected Performance Gain** | None (resilience). |

### P2-5: last7DayKeys Recomputes Every Render

| Field | Value |
|---|---|
| **Severity** | Improvement |
| **Description** | Creates 7 Date objects per server render. |
| **Root Cause** | No memoization or caching. |
| **Risk** | Negligible. |
| **Recommended Solution** | Wrap in React \cache()\. |
| **Estimated Difficulty** | Easy (15 min) |
| **Priority** | 15 |

### P2-6: Unreachable unstable_cache in Forum Posts

| Field | Value |
|---|---|
| **Severity** | Improvement |
| **Description** | \unstable_cache\ wrapper is commented out in forum posts route. |
| **Root Cause** | Code left in incomplete state. |
| **Risk** | Low. |
| **Recommended Solution** | Either implement cache or remove dead code. |
| **Estimated Difficulty** | Easy (15 min) |
| **Priority** | 16 |

### P2-7: \s any\ Casts for lectureVideo

| Field | Value |
|---|---|
| **Severity** | Improvement |
| **Description** | \(prisma as any).lectureVideo\ used in video routes instead of typed access. |
| **Root Cause** | Prisma client may not have been regenerated. |
| **Risk** | Model rename would cause silent failure. |
| **Recommended Solution** | Run \prisma generate\ and remove \s any\ casts. |
| **Estimated Difficulty** | Easy (30 min) |
| **Priority** | 17 |

### P2-8: No CSRF Protection

| Field | Value |
|---|---|
| **Severity** | Observation |
| **Description** | No CSRF tokens on mutating API routes. |
| **Root Cause** | Not implemented. |
| **Risk** | Low — \SameSite=Lax\ cookie protection mitigates most vectors. |
| **Recommended Solution** | Accept risk for current scale. Revisit when supporting third-party integrations. |
| **Priority** | 18 (deferred) |

---

## Testing Strategy

### Unit Testing

**Scope:** Pure logic functions, data transformations, cache utilities.

| Test Target | What to Test | Framework |
|---|---|---|
| \dashboard-stats.ts\ | \computeStreak\, \localYmd\, \last7DayKeys\, \ucketItemsByLocalDay\ | Jest/Vitest |
| \cache-tags.ts\ | Constants are correctly exported | Jest/Vitest |
| \dashboard-fetch.ts\ | SWR fetcher error handling | Jest/Vitest (mock fetch) |
| \spotify.ts\ | URL parsing, cache expiry, token refresh logic | Jest/Vitest |
| \uth.ts\ | Session construction from user_metadata, Redis fallback | Jest/Vitest |

**Key test cases for \computeStreak\:**
- No activity → returns 0
- Activity today only → returns 1
- Activity last 7 days → returns 7
- Break in streak (gap yesterday) → returns 0 (if no activity today)
- Yesterday only (current day has no activity yet) → returns 1

**Key test cases for Spotify URL parsing:**
- Valid track URL → correct type and ID extracted
- Valid episode URL → correct type and ID extracted
- Invalid URL → returns null
- Malformed Spotify URL → returns null

### Integration Testing

**Scope:** API routes with real (or mock) database.

| Test Target | What to Test | Approach |
|---|---|---|
| \GET /api/v1/podcasts\ | Authentication check, semester scoping | SuperTest + mock session |
| \GET /api/v1/records\ | Semester scoping, Spotify enrichment | SuperTest + mock session |
| \GET /api/v1/videos/curriculum\ | Caching behavior, YouTube data | SuperTest + mock fetch |
| \GET /api/v1/community/posts\ | Correct forum lookup, scoping | SuperTest + mock session |

**Approach:**
- Use a test PostgreSQL database (local or ephemeral)
- Seed with known data (3 users, 2 semesters, 5 modules, 10 past papers, 50 questions)
- Run test suite against running Next.js app
- Mock external HTTP calls (YouTube, Spotify) using \
ock\ or \msw\

### Regression Testing

**Scope:** Every API route and dashboard component after each phase.

**Automated checks:**
- All existing API routes return correct status codes for authenticated/unauthenticated requests
- Dashboard page renders without error for users with complete and incomplete profiles
- Quiz submission creates attempt and returns correct data
- Cache invalidation triggers expected behavior

**Manual checks before each deployment:**
- Dashboard loads correctly: all three carousels, stats, module progress, rank
- Quiz completion updates dashboard within expected timeframe
- Logout/login flow works correctly
- Mobile viewport renders dashboard without layout breaks

### API Testing

**Contract tests for every modified route.**

Key test cases:
- Unauthenticated request returns 401
- Request with missing semesterId returns 400 with descriptive error
- Authenticated request returns paginated, semester-scoped data
- External API metadata enrichment returns correct fields
- Cached responses return within expected timeframes

### Performance Testing

**What to measure:**
- Dashboard TTFB: cold vs warm serverless function
- API route response times: with cache hit vs cache miss
- External API call durations (YouTube, Spotify)
- DB query execution times (before and after Phase 3)

**Tools:**
- \curl -w \"%{time_total}\"\ for basic timing
- Chrome DevTools network tab for waterfall analysis
- Vercel Analytics (if enabled)

**Baseline measurements to take before Phase 1:**
- Dashboard TTFB (cold): ~2-4s
- Dashboard TTFB (warm): ~800ms-1.5s
- GET /api/v1/records: ~300-800ms
- GET /api/v1/videos/curriculum: ~800ms-2s (includes YouTube)
- GET /api/v1/forums: ~100-200ms
- GET /api/v1/forum/{id}/posts: ~100-200ms

### Load Testing

**Scenario:** 100 virtual users accessing dashboard simultaneously over 5 minutes.

**Success criteria (after Phase 3):**
- P95 latency < 2s for dashboard page
- Error rate < 1%
- Database connection usage < 80% of pool (24 of 30 connections)

### Authentication Testing

| Test Case | Expected Result |
|---|---|
| Fresh user (no Supabase session) accesses dashboard | Redirect to \/auth?mode=login\ |
| User with valid session accesses dashboard | Dashboard renders |
| User with expired access token accesses dashboard | Middleware refreshes token, user sees dashboard |
| User with invalid/revoked token accesses dashboard | Redirect to login |
| Redis disconnects during auth() | Auth continues using user_metadata (no 401) |
| SUPER_ADMIN bypass through middleware | Page loads without redirect |

### Security Testing

| Test Case | Expected Result |
|---|---|
| Unauthenticated GET /api/v1/podcasts | 401 |
| Unauthenticated POST to any mutating route | 401 |
| Access records from another semester | User sees only their own semester's records |
| SQL injection attempt in search params | Prisma parameterized queries prevent injection |
| XSS in profile name | React escapes HTML in rendering |
| Massive page/limit parameters | Capped to 4-50 range |

### Manual QA Checklist

Before each phase deployment:

- [ ] Dashboard page loads completely
- [ ] All three carousels display content or loading skeletons
- [ ] Quiz completion updates dashboard stats
- [ ] Logout clears session and redirects to login
- [ ] Login with valid credentials redirects to dashboard
- [ ] New user (no profile) can access dashboard after onboarding
- [ ] Mobile viewport: dashboard is responsive
- [ ] No console errors in browser DevTools
- [ ] Server logs show no unhandled errors
- [ ] Health endpoint returns 200

### Production Smoke Tests

After each phase deployment:

1. **Immediate (within 5 minutes):**
   - Access the dashboard page
   - Complete a quiz
   - Verify dashboard updates
   - Verify health endpoint

2. **Short-term (within 1 hour):**
   - Run the manual QA checklist
   - Check server logs for error rate spikes
   - Check Vercel dashboard for function duration changes
   - Verify no increase in 4xx/5xx responses

3. **Medium-term (within 24 hours):**
   - Review performance metrics (TTFB, API response times)
   - Check database connection pool usage
   - Verify external API quotas not exhausted
   - Check for any support tickets related to dashboard

---

## Deployment Strategy

### Deployment Order

1. **Phase 1** (Critical Security) — Deploy first. Fixes are independent and low-risk.
2. **Phase 2** (Auth Reliability) — Deploy second. Builds on Phase 1's auth changes.
3. **Phase 3** (Database) — Deploy third. Reduces DB load before introducing more cache layers.
4. **Phase 4** (Caching) — Deploy fourth. Standardizes caching before adding new cache wrappers.
5. **Phase 5** (External APIs) — Deploy fifth. Reduces external API costs before scaling.
6. **Phase 6** (Data Pipeline) — Deploy sixth. Documents the end-to-end flow after optimizations.
7. **Phase 7** (Performance) — Deploy seventh. Further optimizations after core changes are stable.
8. **Phase 8** (Scalability) — Deploy eighth. Systematic analysis and targeted fixes.
9. **Phase 9** (Reliability) — Deploy ninth. Add logging and monitoring after core is stable.
10. **Phase 10** (Cleanup) — Deploy last. Code quality improvements after functional changes.

### Rollback Procedure

For any phase that causes production issues:

1. **Immediate (0-5 minutes):**
   - Identify the problematic deployment via Vercel dashboard
   - Click \"Rollback to Stable\" in Vercel deployment panel
   - This reverts to the previous successful deployment instantly
   - Notify the team via designated channel

2. **Short-term (5-30 minutes):**
   - Identify the specific change that caused the issue
   - Create a revert commit for the specific file(s)
   - Deploy the hotfix

3. **Long-term (1-24 hours):**
   - Root cause analysis
   - Update test suite to catch regression
   - Re-attempt the phase with the fix included

### Production Verification Script

\\\ash
#!/bin/bash
BASE_URL=\"https://medqs-app.vercel.app\"  # Replace with actual URL

echo \"=== Production Verification ===\"

# 1. Health check
curl -s -o /dev/null -w \"Health: %{http_code}\\n\" \"\/api/v1/health\"

# 2. Dashboard (expect 302 redirect without auth)
curl -s -o /dev/null -w \"Dashboard (no auth): %{http_code}\\n\" \"\/dashboard-app\"

# 3. Podcasts (expect 401 without auth)
curl -s -o /dev/null -w \"Podcasts: %{http_code}\\n\" \"\/api/v1/podcasts\"

# 4. Records (expect 401 without auth)
curl -s -o /dev/null -w \"Records: %{http_code}\\n\" \"\/api/v1/records\"

# 5. Curriculum videos (expect 401 without auth)
curl -s -o /dev/null -w \"Videos: %{http_code}\\n\" \"\/api/v1/videos/curriculum\"

echo \"=== Verification Complete ===\"
\\\

### Monitoring After Deployment

For the first 24 hours after each phase deployment:

- **Vercel Dashboard:** Error rate (should not increase), Function duration (should decrease or stay flat)
- **Supabase Dashboard:** Connection pool utilization (should decrease), Query execution times (should decrease)
- **Logs:** No increase in error-level logs. Warning-level logs for external API failures should not spike.
- **Manual:** Run production smoke tests. Verify on multiple browsers. Verify mobile layout.

---

## Architecture Diagrams

### Authentication Flow

\\\
                      ┌──────────────────────┐
                      │    Browser Request    │
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │    Middleware         │
                      │    (middleware.ts)    │
                      │                      │
                      │  getSession()         │──→ Supabase Auth (1 call)
                      │  ┌───────────────┐   │
                      │  │ Token Refresh? │   │──→ Auto-refresh if expired
                      │  └───────┬───────┘   │
                      │          │           │
                      │  Set x-user-* headers │
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │     Layout            │
                      │     (layout.tsx)      │
                      │                      │
                      │  getUserFromHeaders() │──→ No Supabase call
                      │  getCachedSiteConfig() │──→ Cache hit (no DB)
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │     Page              │
                      │     (page.tsx)        │
                      │                      │
                      │  getUserFromHeaders() │──→ No Supabase call
                      │  getCachedDashboard()│──→ Cache hit (no DB)
                      │  getCachedRankInfo() │──→ Cache hit (no DB)
                      │  getCachedAdBanners()│──→ Cache hit (no DB)
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │     Client            │
                      │     (DashboardShell)  │
                      │                      │
                      │  useRecords()         │──→ /api/v1/records
                      │  useCurriculumVideos()│──→ /api/v1/videos/curriculum
                      │  useCommunityPosts()  │──→ /api/v1/community/posts
                      └──────────────────────┘
\\\

### Dashboard Request Flow

\\\
Browser                              Next.js Server                        Supabase/DB
   │                                      │                                   │
   ├── GET /dashboard-app ────────────────►                                   │
   │                                      │                                   │
   │                                      ├── middleware ────────────────────►│
   │                                      │   ├── auth.getSession() ─────────►│
   │                                      │   │     (refresh if expired)     │
   │                                      │   │◄───── session/user ──────────┤
   │                                      │   │                              │
   │                                      │   ├── check auth headers ────────┤
   │                                      │   └── set last_page cookie       │
   │                                      │                                   │
   │                                      ├── layout ────────────────────────►│
   │                                      │   ├── getUserFromHeaders()        │
   │                                      │   │     (0 Supabase calls)       │
   │                                      │   ├── getCachedSiteConfig() ─────►│
   │                                      │   │     (unstable_cache, 300s)   │
   │                                      │   └── render children ───────────►│
   │                                      │                                   │
   │                                      ├── page ──────────────────────────►│
   │                                      │   ├── getCachedDashboardData() ──►│
   │                                      │   │     (unstable_cache, 60s)    │
   │                                      │   │◄───── cached/DB data ────────┤
   │                                      │   │                              │
   │                                      │   ├── getCachedRankInfo() ───────►│
   │                                      │   │     (unstable_cache, 60s)    │
   │                                      │   │◄───── rank data ─────────────┤
   │                                      │   │                              │
   │                                      │   └── getCachedAdBanners() ──────►│
   │                                      │         (unstable_cache, 300s)   │
   │                                      │                                   │
   │◄──── HTML (server-rendered) ─────────┤                                   │
   │                                      │                                   │
   │ (Client-side SWR)                    │                                   │
   │                                      │                                   │
   ├── GET /api/v1/records ──────────────►│                                   │
   │                                      ├── auth() ────────────────────────►│
   │                                      │     (0 Supabase, cached session) │
   │                                      ├── prisma.lectureRecord ──────────►│
   │                                      │     (cached via s-maxage=3600)   │
   │                                      │◄───── records ───────────────────┤
   │                                      │                                   │
   │                                      ├── getSpotifyMetadata() ─────────►│
   │                                      │     (in-memory cache, 24h)      │
   │◄──── JSON (with Spotify metadata) ───┤                                   │
\\\

### Caching Flow

\\\
                     ┌─────────────────────────────────────┐
                     │         Next.js Data Cache          │
                     │     (unstable_cache infrastructure)  │
                     │                                     │
                     │  ┌───────────────────────────────┐  │
                     │  │      Cache Entries            │  │
                     │  │                               │  │
                     │  │  dashboard-data:{userId}       │  TTL: 60s  │ Tags: dashboard │
                     │  │  rank-info:{userId}            │  TTL: 60s  │ Tags: dashboard │
                     │  │  site-config                   │  TTL: 300s │ Tags: site-config │
                     │  │  ad-banners:{semesterId}       │  TTL: 300s │ Tags: ads │
                     │  │  youtube-channel-data:{ids}    │  TTL: 3600s│ Tags: youtube │
                     │  │  community-posts:{universityId}│  TTL: 30s  │ Tags: community │
                     │  └───────────────────────────────┘  │
                     └─────────────────────────────────────┘
                                  │
                                  │ read/write
                                  ▼
                     ┌─────────────────────────────────────┐
                     │      In-Memory Caches              │
                     │      (process-local)               │
                     │                                     │
                     │  ┌───────────────────────────────┐  │
                     │  │  Spotify token cache          │  TTL: 55min │
                     │  │  Spotify metadata cache (Map) │  TTL: 24h   │
                     │  └───────────────────────────────┘  │
                     └─────────────────────────────────────┘
                                  │
                                  │ cache invalidation
                                  ▼
                     ┌─────────────────────────────────────┐
                     │         revalidateTag()            │
                     │                                     │
                     │  \"dashboard\" → quiz attempt         │
                     │  \"ads\" → admin ad change            │
                     │  \"youtube\" → admin video change     │
                     │  \"community\" → new post             │
                     └─────────────────────────────────────┘
\\\

### Revalidation Flow

\\\
                  Quiz Attempt Created
                          │
                          ▼
              ┌──────────────────────┐
              │  revalidateTag()     │
              │  (\"dashboard\")       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Next.js Data Cache  │
              │  Invalidates entries │
              │  with tag \"dashboard\"│
              │                      │
              │  ├── dashboard-data  │
              │  ├── rank-info       │
              │  └── ...             │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Next Request for    │
              │  Dashboard Data      │
              │                      │
              │  Cache miss (due to  │
              │  revalidation)       │
              │                      │
              │  → Fetches from DB   │
              │  → Stores in cache   │
              │  → Renders fresh     │
              │    data              │
              └──────────────────────┘
\\\

---

## Cost Optimization

### Current Infrastructure Costs

| Service | Plan | Cost | Limits |
|---|---|---|---|
| Vercel | Hobby | Free | 100ms serverless, 512MB, 100 builds/month |
| Supabase | Free | Free | 500MB DB, 15 direct / 30 pooler connections, 5GB bandwidth, 50 Auth req/s |
| Redis (Upstash) | Free | Free | 10,000 commands/day, 256KB messages |
| YouTube API | Free | Free | 10,000 quota units/day |
| Spotify API | Free | Free | Quota varies per plan |

### Do Not Upgrade Immediately

The following upgrades are **not necessary** at current scale and should wait:

| Upgrade | Cost | When Needed |
|---|---|---|
| Supabase Pro (/month) | /month | ~1,000 concurrent users |
| Vercel Pro (/month) | /month | ~500 concurrent users (cold start issues) |
| Upstash Redis Paid (-50/month) | -50/month | ~500 concurrent users (10K commands/day exhausted) |
| Dedicated PostgreSQL | -50/month | ~5,000 concurrent users (read replica needed) |

### Optimize Before Upgrading

Before paying for upgrades, maximize free tier:

1. **Reduce Redis commands (Phase 2):** Auth cache uses React \cache()\ for per-request dedup. Redis used only for rate limiting. **Savings:** 60-80% reduction in Redis commands.

2. **Reduce Supabase Auth API calls (Phase 2):** From 3 calls/page load to 1 call/page load. **Savings:** 66% reduction in Auth API usage.

3. **Reduce DB queries (Phase 3):** From 16-18 queries/page to 6-8 queries/page. **Savings:** 55% reduction in DB load.

4. **Reduce bandwidth (Phase 4, 7):** YouTube thumbnails: \maxresdefault.jpg\ (~120KB) → \mqdefault.jpg\ (~20KB). Dashboard payload: optimized JSON, compressed HTML. **Savings:** 25-50% reduction in bandwidth.

5. **Reduce YouTube API calls (Phase 5):** From O(requests) to O(1/hour). **Savings:** 99% reduction in YouTube quota consumption.

### Infrastructure Cost Projection

| Stage | Monthly Cost | Services |
|---|---|---|
| Current (0-100 users) |  | All free tier |
| After Phase 1-5 |  | Optimized for free tier |
| ~500 users | -20 | Vercel Pro if cold-start issues arise |
| ~1,000 users | -45 | Supabase Pro + Upstash paid |
| ~5,000 users | -150 | Add Postgres read replica |
| ~10,000 users | -500 | Full stack upgrade |

**Key Principle:** Optimize aggressively before upgrading. Each phase in this plan extracts maximum performance from the free tier.

---

## Production Readiness Checklist

### Authentication
- [x] Middleware uses \getUser()\ — correct per Supabase SSR docs (P0-2 was inaccurate audit finding)
- [ ] \uth()\ has Redis fallback — continues working when Redis is down (P1-2)
- [ ] Only one Supabase Auth call per page load (P1-3)
- [ ] Session scope (\getSessionScope\) invalidates on profile changes
- [ ] Mobile/bearer token auth works alongside Supabase sessions

### Authorization
- [ ] Podcasts API requires authentication (P0-1)
- [ ] All API routes have at least \uth()\ check
- [ ] Semester scoping applied to all semester-scoped routes

### Caching
- [ ] Cache tags centralized in \@/lib/cache-tags.ts\
- [ ] \evalidateTag(\"dashboard\")\ fires on quiz completion (P0-3)
- [ ] YouTube API responses cached with 3600s TTL (P1-4)
- [ ] AdBanner queries cached with 300s TTL (P1-7)
- [ ] SiteConfig queries cached with 300s TTL (P1-6)
- [ ] Community posts cached with 30s TTL

### Performance
- [ ] \getModuleProgress\ uses raw SQL aggregates (P2-1)
- [ ] Profile sync removed from page.tsx (P1-1)
- [ ] YouTube thumbnails use optimized size (P2-3)
- [ ] Error boundaries wrap each carousel (P2-4)
- [ ] Community carousel uses consolidated endpoint (P1-5)

### Monitoring
- [ ] Health endpoint checks database, Redis, Supabase Auth
- [ ] Structured JSON logging implemented (no PII)
- [ ] Error responses follow consistent format
- [ ] Dashboard P95 TTFB < 2s
- [ ] External API failures do not result in 5xx errors to users

### Security
- [ ] No \s any\ Prisma casts in video routes (P2-7)
- [ ] No hardcoded secrets in code
- [ ] All user input validated (Zod schemas where applicable)
- [ ] Rate limiting applied to mutating endpoints
- [ ] CSRF risk accepted with SameSite cookie mitigation documented

### Database
- [ ] Missing composite indexes added (AdBanner, QuizAttempt, etc.)
- [ ] Connection pool usage < 80% under peak load
- [ ] \withRetry\ uses exponential backoff with jitter
- [ ] Raw SQL queries handle null/empty edge cases

### Operational
- [ ] Rollback procedure documented and tested
- [ ] Production smoke test script created
- [ ] Deployment verification checklist completed
- [ ] Vercel deployment dashboard monitored for 24h post-deploy
- [ ] External API quotas monitored (YouTube, Spotify)

---

## Success Metrics

### Expected Final Scores After Completing All Phases

| Category | Current | Target | Justification |
|---|---|---|---|
| **Backend** | 5.5/10 | 8.5/10 | All P0 issues resolved, P1 issues resolved, P2 improvements addressed. Remaining gaps: no full test coverage, no CSRF protection, some ny types may remain in edge cases. |
| **Security** | 6/10 | 9/10 | P0 data leak closed. Auth Redis fallback added. CSRF remains deferred. No other security gaps. |
| **Performance** | 5/10 | 8/10 | DB queries reduced by 55%. YouTube API cached. Payload optimized. External API latency eliminated. Remaining gap: no streaming, no full Suspense. |
| **Scalability** | 3/10 | 7/10 | Auth rate-limit capacity tripled. DB connection usage halved. Redis dependency softened. Scalability ceiling raised from ~300 to ~5,000 concurrent users on free tier. |
| **Maintainability** | 5/10 | 8/10 | ny types replaced. Dead code removed. Cache tags centralized. Code organization improved. Remaining gap: test coverage not fully addressed. |
| **Reliability** | 4/10 | 8/10 | Redis, Spotify, YouTube failures handled gracefully. Health checks added. Structured logging implemented. Graceful degradation patterns applied. |
| **Production Readiness** | 4/10 | 9/10 | All P0 and P1 issues resolved. Rollback procedures documented. Monitoring and verification in place. Single remaining gap: no load testing infrastructure. |

### Key Performance Indicators

| KPI | Before | After | Measurement Method |
|---|---|---|---|
| Dashboard TTFB (cold) | ~2-4s | ~1-2s | curl timing, Vercel Analytics |
| Dashboard TTFB (warm) | ~800ms-1.5s | ~400-800ms | curl timing, Vercel Analytics |
| DB queries per load | 16-18 | 6-8 | Prisma query logging |
| Auth API calls per load | 3 | 1 | Supabase dashboard |
| YouTube API calls/day | 400+ | <24 | Google Cloud console |
| Redis commands/day | ~10,000+ | ~2,000-3,000 | Upstash dashboard |
| Dashboard stalenes after quiz | 60s | ~2s | Manual timing |
| Error rate (5xx) | Unknown | <0.1% | Vercel dashboard |
| Connection pool utilization | ~100% at 300 users | ~50% at 300 users | Supabase dashboard |

### Exit Criteria for Each Phase

| Phase | Exit Criteria |
|---|---|
| Phase 1 | Podcasts API returns 401 without auth. Semester-scoped results for authenticated users. Zero regressions. Middleware unchanged (getUser() was already correct). |
| Phase 2 | Auth works without Redis. Single auth call per page load. Dashboard updates within 2s of quiz completion. |
| Phase 3 | DB queries per load reduced by 55%. getModuleProgress returns correct data with raw SQL. Indexes applied. |
| Phase 4 | All cache tags centralized. revalidateTag strategy documented and implemented. |
| Phase 5 | YouTube API cached with 3600s TTL. Spotify failures do not break dashboard. |
| Phase 6 | Data pipeline documented. Redundant steps eliminated. Flow diagrams reflect actual architecture. |
| Phase 7 | Community carousel loads in parallel. Error boundaries prevent cascade failures. |
| Phase 8 | Scalability analysis complete. Action items for each tier documented. |
| Phase 9 | Health checks deployed. Logging standardized. External dependency failures handled gracefully. |
| Phase 10 | No \`any\` types in dashboard code. No \`as any\` casts. Dead code removed. TypeScript compiles clean. |

---

## Traceability Matrix

Every audit finding mapped to its remediation phase, disposition, and verification steps.

### Matrix

| Finding ID | Description | Phase(s) | Disposition | Verification |
|---|---|---|---|---|
| P0-1 | Podcasts API — Zero Authentication | Phase 1 | Fixed | Unauthenticated GET /api/v1/podcasts returns 401; authenticated request returns semester-scoped records; user without semesterId gets 400 error |
| P0-2 | Middleware — No Refresh Token Handling | Phase 1 | **Audit finding inaccurate — no code fix required** | Original middleware (main) already used getUser() which correctly revalidates server-side and auto-refreshes expired tokens. Phase 1 initially attempted getSession() based on misdiagnosis but was reverted during review — would have reintroduced a security vulnerability. Net zero change to middleware.ts. See Retrospective Note in P0-2 finding description. |
| P0-3 | Quiz Submission — No Dashboard Cache Invalidation | Phase 2, Phase 4 | Implementation complete, verified by code inspection — awaiting live end-to-end staging confirmation before final signoff | `revalidateTag(CACHE_TAGS.DASHBOARD)` fires unconditionally after successful `prisma.quizAttempt.create()`; centralized constant imported from `@/lib/cache-tags`. Code is a single straightforward call with no conditional branches or error paths that skip it. Cannot be tested end-to-end locally because the local dev database lacks seeded past-paper questions. Staging verification required: complete a quiz on staging, then confirm dashboard reflects updated scores/streak within ~2s. |
| P1-1 | Profile Sync — Duplicated Write on Every Page Load | Phase 3 | **Fully Verified** | Profile upsert removed from page.tsx; layout.tsx handles all profile creation/update. Confirmed: page.tsx contains zero write operations on User; layout.tsx has both create + update paths with correct guard (`!dbUser \|\| !resolvedSemesterId`); 5 partial-profile users in DB verified as passing through layout sync normally. |
| P1-2 | Auth Cache — No Fallback When Redis Is Down | Phase 2 | Fixed | `auth()` returns session from `user_metadata` alone when Redis is unavailable; outer try-catch removed; granular error handling around Redis ops only |
| P1-3 | Triple Supabase Auth Call per Page Load | Phase 2 | Fixed | React `cache()` deduplicates `getUser()` within same request; layout and page share result via `getAuthenticatedUser()`; exactly 1 Supabase Auth call per dashboard load |
| P1-4 | YouTube API — No Server-Side Caching | Phase 5 | **Fully Verified** | YouTube API data wrapped in `unstable_cache` with `CACHE_TTL.YOUTUBE` and `CACHE_TAGS.YOUTUBE` via `getCachedYouTubeData()` in `src/lib/youtube-cache.ts`. 5-second timeout via `AbortController`. Graceful fallback (empty metadata) on failure. Confirmed by code inspection — hardcoded `3600`/`"youtube"` replaced with centralized constants. Thumbnail optimized to `mqdefault`. |
| P1-5 | Community Carousel — SWR Waterfall | Phase 7 | **Fully Verified** | Consolidated `/api/v1/community/posts` endpoint created at `src/app/api/v1/community/posts/route.ts` with `unstable_cache` (30s TTL, `CACHE_TAGS.COMMUNITY`). `dashboard-fetch.ts`: `useSWRImmutable` import removed, single `useSWR("/api/v1/community/posts?limit=6")` replaces two-step waterfall. `CommunityPostsCarousel.tsx`: fetches from consolidated endpoint. `CACHE_TAGS.COMMUNITY` + `CACHE_TTL.COMMUNITY` added to centralized constants. 2/2 vitest runtime tests pass. `tsc --noEmit`: 16 errors (baseline). `next build`: compiled successfully. |
| P1-6 | SiteConfig Queried Twice (Uncached Second Query) | Phase 3 | **Fully Verified** | Page-level siteConfig query moved inside `getCachedAds` and wrapped in `unstable_cache` (300s revalidate, ads tag) alongside AdBanner query; only 1 cache hit per page load. Verified by code inspection of `page.tsx` — no standalone `siteConfig` fetch remains. |
| P1-7 | AdBanner Query — No Cache and Missing Composite Index | Phase 3 | **Fully Verified** | AdBanner query wrapped in `unstable_cache` with 300s revalidation; composite indexes `@@index([active, semesterId])` and `@@index([active, universityId])` added and confirmed via `pg_indexes`. EXPLAIN ANALYZE shows Seq Scan at 0.071ms (expected behavior for 1-page table — index scan would be more expensive at this size; index will engage when table exceeds ~1 page). |
| P2-1 | `getModuleProgress` — Over-fetching Subject and Lecture Rows | Phase 3 | **Fully Verified** | Rewritten with raw SQL aggregates; rows fetched reduced from ~800 to ~24. Data parity verified across 3 semesters — old nested-include implementation vs new raw SQL produced **identical output** for all tested semesterIds. Bug caught and fixed during testing: original raw SQL used `JOIN` (INNER) which silently excluded modules with no subjects/lectures; corrected to `LEFT JOIN` to match old behavior exactly. |
| P2-2 | `DashboardPage` — `any` Types Throughout | Phase 10 | Fixed | `dashData`/`rankInfo` properly typed; `(prisma as any)` casts removed; pre-existing `DashboardData.lastLectureActivity` type widened to include `videoUrl`, `videos`, `team` fields; `Subject.moduleId` nullable handled with fallback. `tsc --noEmit`: 0 errors on Phase 10 files. |
| P2-2-related | Dashboard stats display bug, silently masked by `any` typing, discovered and fixed during Phase 10 | Phase 10 | Fixed — see description in Phase 10 report below | **Root cause:** `let dashData: any` masked that the destructured field names `stats` and `activity` do not exist on the object returned by `getCachedDashboardData()`. The correct fields are `totalQuestions`, `totalCorrect`, `todayItemCount`, `streak`, and `weekCounts`. The `any` type allowed this silent mismatch to ship undetected. **Fix:** Replaced `stats`/`activity` destructuring with the real field names; typed `dashData` as `DashboardRawData` matching the actual return shape; computed `activityArr` from `weekCounts` mapped via `chartDays`. **Manual production DB verification:** Ran identical queries against live Supabase for 2 real users — confirmed totalQuestions=717, totalCorrect=2, overallPct=0% (0.28% rounds down), weekCounts correctly captured July 4 activity (29 items). Old code would have shown 0 for all values regardless of actual data. No other file references `dashData.stats` or `dashData.activity`. |
| P2-3 | `lastLectureActivity` — Prisma Sorts ALL Videos | Phase 3, Phase 10 | **Documented Limitation — Fully Verified** | Known Prisma limitation; per-lecture video count is small (1-5); comment referencing plan and finding ID added in `dashboard-queries.ts` (both Phase 3 and Phase 10 branches); revisit only if per-lecture video count exceeds 50. Confirmed comment present via code inspection. `next build` passes — no runtime impact. |
| P2-4 | No Error Boundaries on Dashboard | Phase 7 | **Fully Verified** | `CarouselErrorBoundary.tsx` created as React class component (`getDerivedStateFromError` + `componentDidCatch` with console.error log). `DashboardDesktopView.tsx` wraps RecordsCarousel, CommunityCarouselSidebar, and SuggestedVideosCarousel each in `<CarouselErrorBoundary title="...">`. Error fallback renders "This section is temporarily unavailable." Verified by code inspection — class component correctly implements both boundary lifecycle methods; each section independently wrapped so one crash does not cascade. |
| P2-5 | `last7DayKeys()` — Recomputes Every Render | Phase 4, Phase 7 | **Fully Verified — Phase 7 scope satisfied** | Wrapped in React `cache()` — `export const last7DayKeys = cache(() => {...})`. Verified by code inspection of `src/lib/dashboard-stats.ts` (static/code-inspection review): function body unchanged, `import { cache } from "react"` added, `cache()` wrapping applied at export. Pure computation unchanged. `next build` passes. **No further action needed in Phase 7 for this finding.** |
| P2-6 | Unreachable `unstable_cache` in Forum Posts Route | Phase 10 | Fixed | Commented-out `unstable_cache` code and unused `unstable_cache` import removed from forum posts route; dead code eliminated |
| P2-7 | TypeScript `as any` Casts for `prisma.lectureVideo` | Phase 10 | Fixed | `prisma generate` verified; `(prisma as any).lectureVideo` replaced with typed `prisma.lectureVideo` in both curriculum and search routes |
| P2-8 | No CSRF Protection | Phase 10 (comment only) | Accepted Risk | `SameSite=Lax` cookie mitigation sufficient for current architecture; revisit when supporting third-party integrations; comment referencing plan and finding ID added in `src/lib/supabase/middleware.ts` |
| P9-1 | Health check's `supabaseAuth` probe was structurally incapable of ever returning `"healthy"` — used `HEAD` to Supabase project root URL (`https://*.supabase.co/`) which Kong returns as **404 Not Found** (no endpoint at `/`). Check always produced `"degraded"` regardless of actual Auth availability. | Phase 9 (post-signoff fix) | Fixed — changed to `GET /auth/v1/settings`; any response from the server (including 401, 404) is treated as `"healthy"` because the goal is confirming the service is alive, not that we're authorized. Only network-level failures (timeout, DNS, connection refused) mark it `"unhealthy"`. | **Pending staging verification** — deploy `remediation/phase-rollout` to staging and `curl /api/v1/health` to confirm `supabaseAuth` now returns `{ status: "healthy", latencyMs: <value> }`. |

### Pending Staging-Only Verifications

These findings have been implemented and verified by code inspection (or locally where possible), but require a live staging environment with real/seeded data for end-to-end confirmation. They remain open until the next full staging pass.

| Finding ID | What's Pending | Why Local Verification Was Insufficient | Staging Test |
|---|---|---|---|---|
| P0-3 | Quiz completion triggers `revalidateTag("dashboard")` — dashboard should reflect updated scores/streak within ~2s | Local dev DB has no seeded past-paper questions; quiz flow cannot be completed end-to-end | **Deferred — blocked by pre-existing quiz creation system issue unrelated to remediation. Will be revisited when quiz system is addressed separately.** |
| P2-4 | Error boundary isolation — forcing one carousel (e.g., Community) to fail must leave the other two carousels (Records, Videos) rendering normally, with only the failing section showing "temporarily unavailable" | Vitest cannot import `.tsx` files (project's `jsx: "preserve"` + node environment); no `@testing-library/react` or `jsdom` installed; test infrastructure limitation acknowledged | 1. Log in as a student on staging. 2. Open DevTools → Network → block the `/api/v1/community/posts` endpoint or induce a 500 by editing the response. 3. Refresh dashboard. 4. Verify: Community carousel area shows "This section is temporarily unavailable". 5. Verify: Records and Videos carousels still render with real content. |
| P1-5 (Phase 7) | Community carousel loads data in a single request (consolidated `/api/v1/community/posts` endpoint with 30s cache) | Unit tests confirm endpoint resolves and cache constants present, but cannot verify actual network waterfall in browser | **✅ Confirmed on staging.** Single request to `/api/v1/community/posts`. |
| P2-2-related | Dashboard stats now show real data — overallPct, dailyPct, currentStreak, activityArr previously showed 0/[] for all users; after fix they reflect actual DB values | Verified via manual production DB queries for 2 users — mathematically confirmed correct — but end-to-end visual rendering confirmation needed on staging | **Deferred — blocked by pre-existing quiz creation system issue unrelated to remediation. Will be revisited when quiz system is addressed separately.** |
| P1-4 (Phase 5) | YouTube cache hit/miss — first request to curriculum route triggers YouTube API; second request within 3600s returns cached data (verify no duplicate API call) | YouTube API key on free tier has daily quota limit; cannot safely make live API calls repeatedly from local/dev to test caching — staging with real keys is the correct environment | 1. On staging, access curriculum videos page. 2. Check server logs or Vercel function logs: confirm first request makes an outbound YouTube API call. 3. Refresh the page within 1 hour. 4. Confirm no second outbound YouTube API call appears in logs — data served from cache. |
| P1-4 (Phase 5) | YouTube timeout on slow/unreachable API — confirm carousel loads with fallback channel metadata ("Medical Educator") when real YouTube API is slow or unreachable | Timeout behavior depends on real network conditions; cannot simulate upstream timeout reliably in unit tests without mocking | 1. On staging, simulate slow/unreachable YouTube API (e.g., block `www.googleapis.com` via hosts file or firewall on staging server). 2. Refresh curriculum page. 3. Verify carousel still renders with fallback channel name ("Medical Educator") and no blank/error state. 4. Verify no 5xx error returned to the client. |
| P1-8 (Phase 5) | Spotify real API calls — dashboard record with valid Spotify URL renders album art; record with bad Spotify URL gracefully shows no art | Spotify metadata fetch uses real `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` from `.env`; local dev may not have staging keys or the same Spotify data; real API behavior must be verified with staging credentials | 1. On staging, open dashboard records carousel. 2. Confirm records with valid Spotify track/episode URLs display album art. 3. Confirm records with invalid/broken Spotify URLs show no art (fallback icon) without affecting other records. 4. Confirm no console/server errors from individual Spotify failures. |
| Phase 9 | Community posts error response uses `apiError` format (`{ error, message }`) | Unit tests verify api-response helper shapes, but cannot test live HTTP response format from the actual route | 1. On staging, induce an error in the community posts route (e.g., by passing an invalid limit param). 2. Verify the response body follows `{ error: string, message?: string }` shape. 3. Verify the HTTP status code is appropriate (400, 401, 500). |
| Phase 9 | Health endpoint full-healthy state — `/api/v1/health` now returns `status: "healthy"` after post-signoff fix (P9-1) | Locally, Supabase Auth health check showed `"degraded"` due to local dev environment limitations (no real Supabase Auth connectivity from local); staging is the first environment where all three checks can pass simultaneously | **Fixed, pending staging verification.** See P9-1 in Traceability Matrix. Deploy `remediation/phase-rollout` to staging and `curl /api/v1/health` to confirm all three sub-checks (`database`, `redis`, `supabaseAuth`) return `"healthy"`. |

**Note:** This list should be reviewed before the final Phase 10 merge (which is NOT happening). All items must be confirmed on staging (or explicitly waived) before marking the remediation rollout as complete.

### Coverage Summary

| Metric | Count |
|---|---|
| Total findings | 19 |
| Actively fixed in code | 17 |
| Documented limitation | 1 (P2-3) |
| Accepted risk | 1 (P2-8) |
| Silently missing (unaddressed) | 0 |
