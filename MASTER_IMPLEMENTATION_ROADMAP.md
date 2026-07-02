# MASTER IMPLEMENTATION ROADMAP
## MedOneX (MedQs) — Production-Grade Backend Transformation

**Generated:** 2026-06-29  
**Version:** 1.0  
**Team:** CTO · Principal Architect · Principal Backend Engineer · Senior Database Architect · Security Engineer · DevOps Engineer · Infrastructure Engineer · Performance Engineer · QA Architect · SRE · Code Reviewer · Solution Architect  

---

## TABLE OF CONTENTS

1. [Overall Assessment](#section-1-overall-assessment)
2. [Problem Inventory](#section-2-problem-inventory)
3. [Dependency Impact Analysis](#section-3-dependency-impact-analysis)
4. [Master Fix Strategy](#section-4-master-fix-strategy)
5. [Execution Roadmap](#section-5-execution-roadmap)
6. [Architecture Improvements](#section-6-architecture-improvements)
7. [Database Remediation](#section-7-database-remediation)
8. [API Stabilization](#section-8-api-stabilization)
9. [Authentication & Authorization](#section-9-authentication--authorization)
10. [Performance Optimization](#section-10-performance-optimization)
11. [Security Hardening](#section-11-security-hardening)
12. [Code Quality Refactoring](#section-12-code-quality-refactoring)
13. [Project Structure Improvements](#section-13-project-structure-improvements)
14. [Infrastructure](#section-14-infrastructure)
15. [Testing Strategy](#section-15-testing-strategy)
16. [Regression Prevention](#section-16-regression-prevention)
17. [Verification Matrix](#section-17-verification-matrix)
18. [Production Readiness Checklist](#section-18-production-readiness-checklist)
19. [Implementation Timeline](#section-19-implementation-timeline)
20. [Final Engineering Verdict](#section-20-final-engineering-verdict)

---

# SECTION 1: OVERALL ASSESSMENT

## Current Architecture Maturity

MedOneX is a **layered monolith** built on Next.js 14 App Router. The architectural pattern is appropriate for a 1–3 person team at this stage of the product's life. The V2 API, the platform/ layer, and the envelope pattern represent genuine architectural growth and show the team thinking ahead. However, the V1 API (which carries ~90% of the actual endpoints) is still in a pre-pattern state with mixed concerns, inconsistent error handling, and no standardized response contract.

**Maturity level: Pre-production startup (3/10)**  
The feature scope is remarkable — 95 database models, 69 API route groups, multi-provider AI fallback, Telegram bot, PWA, spaced repetition, gamification, multi-tenant — but the infrastructure and hardening that would allow this to run for real users at scale has not been applied.

## Current Quality

The code is competent TypeScript. Strict mode is enabled. Prisma is used well. The singleton patterns for Prisma and Redis are correct. The AI fallback chain is sophisticated and practical. The multi-tenant data scoping is thoughtful.

However: mixed concerns throughout route handlers, business logic not separated into services, no real test coverage (3 unit test files for 95 models and 69 API groups), and critical security failures that mean this system cannot go to production as-is.

## Current Risks

| Risk | Severity | Category |
|------|----------|----------|
| Secrets committed to git (Supabase service role, all AI keys, OAuth secrets) | CRITICAL | Security |
| Hardcoded JWT fallback secret | CRITICAL | Security |
| No automated tests | CRITICAL | Quality |
| No CSRF protection | HIGH | Security |
| AI chat blocking (Vercel 10s timeout) | HIGH | Reliability |
| No structured logging or error monitoring | HIGH | Observability |
| Local file storage (not Vercel-compatible) | HIGH | Reliability |
| No rate limiting on auth endpoints (only registration) | HIGH | Security |
| Redis pub/sub publishers without subscribers | MEDIUM | Reliability |
| ~95 models with ~0% integration test coverage | MEDIUM | Quality |

## Production Readiness

**Score: NOT production ready.**

The feature set is production-quality. The infrastructure and security posture are not. This system cannot be exposed to real users until at minimum the critical and high severity issues are resolved.

## Technical Debt

| Category | Debt Level | Notes |
|----------|-----------|-------|
| Security | CRITICAL | Must be resolved first |
| Testing | CRITICAL | Blocks all production ambitions |
| API consistency | HIGH | V1 vs V2 fragmentation |
| Service layer | HIGH | Business logic in route handlers |
| Observability | HIGH | No monitoring, no APM |
| Schema complexity | MEDIUM | 95 models is schema bloat risk |
| V1/V2 coexistence | MEDIUM | Inconsistent patterns increase maintenance cost |

## Estimated Engineering Effort

| Phase | Effort | Duration |
|-------|--------|---------|
| Phase 0 (Emergency Security) | 3–5 days | Week 1 |
| Phase 1 (Stabilization) | 2–3 weeks | Weeks 2–4 |
| Phase 2 (Testing & Service Layer) | 3–4 weeks | Weeks 5–8 |
| Phase 3 (Performance & API) | 2–3 weeks | Weeks 9–11 |
| Phase 4 (Infrastructure & Observability) | 2–3 weeks | Weeks 12–14 |
| Phase 5 (V1→V2 Migration) | 4–6 weeks | Weeks 15–20 |

**Total: ~5 months** for a 2-person engineering team to reach full production readiness.

---

# SECTION 2: PROBLEM INVENTORY

## Master Problem Table

| ID | Description | Affected Files | Affected Module | Severity | Business Impact | Technical Impact | Dependencies | Root Cause | Difficulty | Priority |
|----|-------------|---------------|-----------------|----------|-----------------|-----------------|-------------|------------|-----------|----------|
| SEC-001 | `.env` file with ALL secrets committed to git | `.env` | Global | CRITICAL | Total credential compromise, API billing abuse, database exfiltration | All external services compromised | All services | Missing `.gitignore` entry | Low | P0 |
| SEC-002 | Hardcoded JWT fallback secret `"fallback-secret-change-in-production"` | `src/lib/supabase/auth-helpers.ts:6` | Auth/Mobile | CRITICAL | Forged mobile auth tokens for any user | Any attacker can impersonate any user | Mobile auth | Defensive coding without enforcement | Low | P0 |
| SEC-003 | Supabase service role key in committed `.env` | `.env` | Auth/DB | CRITICAL | Full database bypass, delete any data | Unlimited admin access to entire database | All DB operations | Secrets management failure | Low | P0 |
| SEC-004 | `NEXTAUTH_SECRET` is placeholder `"your-super-secret-key-change-this-in-production"` | `.env` | Auth | HIGH | Session forgery if used for signing | Session tokens insecure | Web auth | Dev placeholder not replaced | Low | P0 |
| SEC-005 | No CSRF protection on any POST endpoint | All V1/V2 route handlers | API | HIGH | CSRF attacks on authenticated endpoints | Unauthorized state-changing requests | All POST routes | Architecture gap | Medium | P1 |
| SEC-006 | No rate limiting on login, password reset, or most API endpoints | Auth route handlers | Auth/API | HIGH | Brute-force login, API abuse | Account takeover, service disruption | Auth routes | Incomplete rate limiting | Medium | P1 |
| SEC-007 | Mass assignment risk in profile update endpoints | `PUT /api/v1/auth/profile` and similar | Auth/User | HIGH | Users could elevate their own role or points | Data integrity violation | User update routes | No field whitelist | Low | P1 |
| SEC-008 | `USE_LOCAL_FILE_UPLOAD=true` writes files to `public/uploads/` which is ephemeral on Vercel | `src/lib/storage.ts` | Storage | HIGH | All uploaded files lost on redeploy | Broken uploads in production | Storage | Dev setting left enabled | Low | P1 |
| SEC-009 | No security headers (CSP, X-Frame-Options, X-Content-Type-Options) | `next.config.js` or middleware | Global | MEDIUM | XSS, clickjacking | Browser-level attacks not mitigated | All pages | Missing configuration | Low | P1 |
| SEC-010 | DuckDuckGo chat API used without authorization (scraping, ToS violation) | `src/lib/ai-router.ts` | AI | MEDIUM | Service termination, legal risk | Sudden AI fallback failure | AI fallback chain | Lack of API access | Low | P2 |
| SEC-011 | No input sanitization for AI-generated content stored or displayed | `src/lib/gemini.ts`, AI route handlers | AI | MEDIUM | XSS via AI-generated content rendered to other users | Stored XSS | AI routes | Missing sanitization layer | Low | P1 |
| SEC-012 | Google Sheets service account JSON (with private key) in committed `.env` | `.env` | Admin | CRITICAL | Full Google Workspace access | Google API abuse | Sheet integrations | Secrets management failure | Low | P0 |
| PERF-001 | AI chat is fully blocking with no streaming — Vercel 10s timeout risk | `src/lib/ai-router.ts`, `/api/v1/ai/chat` | AI | HIGH | Chat fails for responses >10s (common) | Broken AI chat in production | AI chat | No streaming implementation | High | P1 |
| PERF-002 | N+1 query pattern in AI context builder (3+ sequential queries + raw SQL) | `src/lib/ai-context-builder.ts` | AI | MEDIUM | High latency for every AI chat request | Every AI call is slow | AI chat | No query batching | Medium | P2 |
| PERF-003 | Auth session cached for only 30 seconds (TTL too short, defeats caching) | `src/lib/auth.ts:21` | Auth | MEDIUM | Extra Redis + Supabase calls on nearly every request | High latency on all authenticated routes | Auth | Misconfigured cache TTL | Low | P2 |
| PERF-004 | No response caching for academic hierarchy (universities, modules, lectures — almost static) | API route handlers for universities/faculties/modules | Content | MEDIUM | Database hit on every page load for mostly-static data | Unnecessary DB load | Content routes | No cache layer | Medium | P2 |
| PERF-005 | Large Prisma schema (~95 models, 2803 lines) increases cold start time on Vercel | `prisma/schema.prisma` | DB/Infrastructure | MEDIUM | Slower cold starts on Vercel serverless | User-facing latency spikes | All routes | Schema bloat | High | P3 |
| QUAL-001 | Near-zero test coverage — only 3 unit test files for 95 models and 69 API route groups | `src/lib/__tests__/` | Global | CRITICAL | Cannot safely refactor or deploy with confidence | Every change is high-risk regression | All code | No testing culture established | High | P1 |
| QUAL-002 | Business logic mixed with data access and response formatting in V1 route handlers | All V1 route handlers (~69 files) | API/Business | HIGH | Hard to test, maintain, or reason about any one piece | Technical debt compounds on every change | Route handlers | No service layer architecture | High | P2 |
| QUAL-003 | Redis pub/sub publishers have no subscriber — dead code in production | `src/lib/redis.ts` — `publishNotification()`, `broadcastNotification()` | Notifications | MEDIUM | Notifications sent via pub/sub are never delivered | Silent notification failure | Notification system | Incomplete implementation | Medium | P2 |
| QUAL-004 | V1 API response format inconsistent across 69 route groups (3+ different shapes) | All V1 route handlers | API | HIGH | Mobile/client apps must handle multiple error shapes | Brittle client code | All clients | No early standardization | High | P2 |
| QUAL-005 | No error monitoring or APM (no Sentry, Datadog, etc.) | Global | Observability | HIGH | Errors are invisible in production | Issues go undetected until users report | All services | Configuration gap | Low | P1 |
| QUAL-006 | No structured logging (only `console.log`) | Global | Observability | HIGH | Cannot search, filter, or alert on logs | Production debugging is blind | All services | Missing logging infrastructure | Low | P1 |
| QUAL-007 | `Math.random()` used for request IDs — not cryptographically unique | `src/platform/api/envelope.ts:17` | API | LOW | Request ID collisions in high-volume scenarios | Broken request tracing | V2 API | Quick implementation | Low | P3 |
| QUAL-008 | Dual password storage (Supabase Auth + local `User.password`) — sync risk | `src/app/api/v1/auth/register/route.ts`, `User` model | Auth | MEDIUM | Password reset updates one store but not the other | Auth inconsistency | Auth | Architecture decision without sync mechanism | Medium | P2 |
| QUAL-009 | Email sent fire-and-forget after HTTP response — no error handling, no retry | Register route | Auth/Email | MEDIUM | User never knows email failed | Silent email failures | Registration | Missing email queue | Medium | P2 |
| QUAL-010 | No API documentation (no OpenAPI/Swagger) | Global | Documentation | MEDIUM | Mobile app team works from memory | Integration drift | All clients | Documentation gap | Medium | P3 |
| INFRA-001 | No Docker / docker-compose for local development | Repository root | DevEx | MEDIUM | Onboarding is manual and error-prone | Dev environment inconsistency | Local dev | Not prioritized | Low | P2 |
| INFRA-002 | No CI/CD pipeline with automated test gate | `.github/workflows/` | CI/CD | HIGH | Broken code can be deployed automatically | Silent regressions | All code | Not configured | Low | P1 |
| INFRA-003 | Vercel Hobby plan limits (10 concurrent functions, no team features) | Vercel config | Infrastructure | MEDIUM | Scale ceiling for real traffic | Platform constraint | All routes | Plan not upgraded | Low | P2 |
| INFRA-004 | Gmail SMTP limited to 500 emails/day | `src/lib/email.ts` | Email | MEDIUM | Email service silently fails at scale | Broken transactional emails | Email | Free tier limitation | Low | P2 |
| DB-001 | No database migration documentation — migration history only in Prisma files | `prisma/migrations/` | DB | MEDIUM | Migration order unclear, rollback undefined | Dangerous production deployments | DB migrations | Documentation gap | Low | P2 |
| DB-002 | Ad-hoc migration scripts (`backfill-forum-university.ts`, `migrate-faculties.ts`) not tracked | `prisma/` | DB | MEDIUM | Migration state unknown — was it run? | Data inconsistency | DB | No migration tracking | Low | P2 |
| DB-003 | V1 and V2 models coexist in the same schema without clear separation | `prisma/schema.prisma` | DB | MEDIUM | Schema bloat, confusion over which model to use | Developer confusion | Schema | Gradual evolution without cleanup | High | P3 |
| DB-004 | No defined strategy for orphaned data from cascading deletes | `prisma/schema.prisma` | DB | MEDIUM | Orphaned records accumulate | Data integrity risk | All relations | Missing cascade or nullify definitions | Medium | P2 |

---

# SECTION 3: DEPENDENCY IMPACT ANALYSIS

## SEC-001 — Committed Secrets

**What depends on it:** Every external service (Supabase, Gemini, OpenAI, Google, Facebook OAuth, Gmail, Telegram, UploadThing, Cloudinary, Turnstile, Firebase, Upstash).

**What breaks if modified (key rotation):** Temporarily, all services requiring the rotated key. Application downtime during the rotation window if done carelessly.

**Safe migration strategy:**
1. Create new keys on each platform BEFORE invalidating old ones.
2. Add new keys to Vercel environment variables (not `.env`).
3. Deploy the new key configuration.
4. Verify all services work with new keys.
5. Rotate/invalidate old keys.
6. Remove `.env` from git history using `git filter-repo --path .env --invert-paths`.

**Rollback strategy:** Keep old keys active during transition window (both old and new work simultaneously for ~1 hour where the provider supports it).

**Testing requirements:** Smoke test every external integration after key rotation: auth flow, AI chat, file upload, email send, Telegram bot.

---

## SEC-002 — Hardcoded JWT Fallback

**What depends on it:** All mobile app authentication. Any request with `Authorization: Bearer` header.

**What breaks if removed:** Mobile auth fails if `MOBILE_AUTH_SECRET` is not set in environment.

**Safe migration strategy:**
1. Set `MOBILE_AUTH_SECRET` to a new cryptographically secure random value in Vercel environment (and in all `.env.example` files).
2. Deploy the code change that removes the fallback and requires the env var.
3. All existing mobile tokens signed with the old fallback become invalid — users must re-login. This is acceptable as the old tokens were potentially compromised.

**Rollback strategy:** Re-add the fallback temporarily if mobile users are locked out. However, the fallback secret must be changed in the next deploy.

**Testing requirements:** Mobile login flow must be tested end-to-end after change. Verify JWT verification still works with the new secret.

---

## QUAL-001 — No Test Coverage

**What depends on it:** Every refactoring, every new feature, every deployment.

**What breaks if you add tests:** Nothing existing breaks. Tests only catch existing breakage.

**Safe migration strategy:** Start with the most critical business logic in isolation:
1. Unit tests for `quiz-attempt-score.ts`, `flashcard-engine.ts`, `gemini-keys.ts`
2. Integration tests for the registration flow
3. API integration tests for auth endpoints
4. Expand from there

**Rollback strategy:** N/A — tests are additive.

**Testing requirements:** Tests must run in CI and gate deployment.

---

## QUAL-002 — Business Logic in Route Handlers

**What depends on it:** Every V1 API endpoint.

**What breaks if refactored:** Route handler → service call chain — if the service function signature changes, the route handler breaks.

**Safe migration strategy:**
1. Extract logic INTO service functions WITHOUT deleting the original route handler code.
2. Make route handler call the new service function.
3. Run integration tests (once written) to verify the route still responds the same.
4. Delete the original inline code.
5. Never extract more than one route handler's logic at a time.

**Rollback strategy:** Git revert to the pre-extraction commit. Route handler still has the original inline logic.

**Testing requirements:** Each extracted service function must have unit tests before the extraction is considered complete.

---

## QUAL-003 — Dead Redis Pub/Sub

**What depends on it:** `publishNotification()` and `broadcastNotification()` are called in notification flows.

**What currently happens:** Messages are published to Redis channels. No subscriber receives them. Notifications via this mechanism are silently dropped.

**What breaks if fixed:** Nothing currently relies on the subscriber side — adding one is purely additive.

**Safe migration strategy:**
1. Option A: Implement a Redis subscriber in a long-lived process (not applicable on Vercel serverless — workers die).
2. Option B (recommended): Replace Redis pub/sub with a Supabase Realtime subscription or a polling-based notification endpoint. Keep the `publishNotification()` API surface intact but change the transport.
3. Option C: Use Vercel Edge Functions with Server-Sent Events (SSE) for push.

**Rollback strategy:** Remove the subscriber. Messages continue being published harmlessly (current state).

---

## PERF-001 — Blocking AI Chat

**What depends on it:** `/api/v1/ai/chat` — the Dr. Q AI tutor feature.

**What breaks if streaming is added:** The client must change from parsing a single JSON response to handling a streaming response (SSE or chunked transfer). The mobile app may need a client update.

**Safe migration strategy:**
1. Implement streaming as a NEW endpoint: `/api/v1/ai/chat/stream`.
2. Keep the old blocking endpoint intact for backward compatibility.
3. Update the web client to use streaming.
4. Once mobile client supports streaming, deprecate the blocking endpoint.

**Rollback strategy:** Stop sending to the streaming endpoint; fall back to the blocking endpoint.

**Testing requirements:** Test with AI responses known to take >5 seconds. Verify the stream arrives incrementally. Verify error states (provider failure mid-stream) are handled gracefully.

---

## QUAL-008 — Dual Password Storage

**What depends on it:** Login (via Supabase + bcrypt comparison), password reset (Supabase only), profile updates.

**What breaks if fixed:** If you remove the local `User.password` field, all login flows that use bcrypt must be updated to use Supabase Auth only. Mobile login currently uses Supabase's `signInWithPassword()` and then issues a custom JWT — this path is unaffected.

**Safe migration strategy:**
1. Phase 1: Keep dual storage. Add a sync endpoint `POST /api/v1/auth/sync-password` that Supabase Auth webhooks call on password reset.
2. Phase 2: After all clients use Supabase Auth for validation, deprecate the bcrypt comparison path.
3. Phase 3: Remove `User.password` from schema.

**Rollback strategy:** The password field can remain in the schema and be ignored.

---

# SECTION 4: MASTER FIX STRATEGY

## Phase 0: Emergency Security (Before Any Other Work)

**Objective:** Stop the bleeding. The system has critical credentials exposed. No feature work should happen until these are resolved.

**Comes before Phase 1 because:** A system with exposed secrets is compromised regardless of how good the code is. All other improvements are irrelevant if an attacker already has the keys.

**Expected outcome:** All secrets rotated, removed from git history, stored in Vercel environment variables. JWT fallback removed. Password placeholder replaced.

**Success criteria:**
- `git log --all -S "SUPABASE_SERVICE_ROLE_KEY"` returns no results
- All external services (Supabase, Gemini, OpenAI, etc.) have new keys
- `src/lib/supabase/auth-helpers.ts` has no string literal as JWT secret fallback
- Application deploys and functions correctly with new secrets in Vercel env

---

## Phase 1: Hardening & Stabilization

**Objective:** Make the system safe to operate. Add security headers, CSRF protection, rate limiting, error monitoring, structured logging, and CI/CD.

**Comes before Phase 2 because:** You cannot safely refactor code you can't observe. Logging and monitoring must be in place before you start changing things. Security hardening cannot wait for the service layer refactor.

**Expected outcome:** Observable, protected system that can detect and report its own problems.

**Success criteria:**
- All API endpoints have rate limiting
- CSRF tokens implemented for state-changing endpoints
- Sentry installed and receiving errors
- Pino logging installed with correlation IDs
- Security headers returning from all pages
- GitHub Actions CI running on every push

---

## Phase 2: Testing Foundation

**Objective:** Build the safety net that makes all future changes safe.

**Comes before Phase 3 because:** You cannot safely refactor business logic into a service layer without tests that verify the behavior is preserved. Writing tests first (even for existing code) is the minimum bar.

**Expected outcome:** Core business flows have test coverage. CI gate blocks deployment on test failure.

**Success criteria:**
- Auth flow (registration, login, JWT) has unit + integration tests
- Quiz scoring logic has unit tests
- Flashcard SM-2 algorithm has unit tests
- AI router fallback chain has unit tests
- At least 3 API endpoints have integration tests
- Test coverage gate enforced in CI (>30% lines for now)

---

## Phase 3: Service Layer Extraction

**Objective:** Separate business logic from route handlers. Create a proper service layer.

**Comes before Phase 4 because:** Fixing performance issues like N+1 queries and caching is much easier once the code is in services you can test and compose independently.

**Expected outcome:** Route handlers become thin: parse input → call service → return response. All business logic lives in testable service functions.

**Success criteria:**
- Each major domain has a service file: `AuthService`, `QuizService`, `PostService`, `AIService`, `FlashcardService`
- No Prisma calls directly inside route handlers (only in services or repositories)
- All service functions have unit tests

---

## Phase 4: Performance & Caching

**Objective:** Make the system fast enough for real load.

**Comes before Phase 5 because:** API standardization is an interface concern. Performance is an infrastructure concern. Infrastructure should be stable before changing the interface.

**Expected outcome:** AI chat streams. Academic content is cached. Auth session cache TTL increased. N+1 queries eliminated.

**Success criteria:**
- AI chat streams responses incrementally
- `/api/v1/universities`, `/api/v1/faculties`, `/api/v1/modules` have >5 minute cache
- Auth session cache TTL increased to 5 minutes
- AI context builder uses parallel queries
- No query returning >5MB payload

---

## Phase 5: API Standardization (V1 → V2 Migration)

**Objective:** Standardize all V1 endpoints to the V2 envelope format. Deprecate raw `NextResponse.json()` patterns.

**Comes after Phase 4 because:** This is the highest-effort change. By this point the service layer is clean, tests exist, and the system is stable — making this migration safe to execute.

**Expected outcome:** Single consistent API contract across all endpoints. Mobile and web clients have predictable error shapes.

**Success criteria:**
- All endpoints return `{ requestId, tenantKey, actor, result, errors }` envelope
- All errors return proper HTTP status codes with machine-readable error codes
- Mobile app updated to use new envelope
- API documentation (OpenAPI) generated from route handlers

---

# SECTION 5: EXECUTION ROADMAP

## MILESTONE 0.1 — Rotate All Secrets

**Goal:** Eliminate the compromised credentials.

**Affected files:** `.env`, `.gitignore`, all external service dashboards

**Files to create:** `.env.example` (comprehensive), `.env.local.example`

**Files to modify:** `.gitignore`

**Files to delete:** `.env` (from git tracking — file stays on disk)

**Database changes:** None

**API changes:** None

**Migration steps:**
1. Open every external service dashboard and generate new API keys/tokens.
   - Supabase: regenerate `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`
   - Google Cloud: new Gemini API keys (5 keys), new OAuth client secret
   - Facebook: new app secret
   - Gmail: new App Password
   - UploadThing: new token
   - Cloudinary: regenerate API secret
   - Upstash: regenerate Redis token
   - Firebase: new service account key
   - Telegram: revoke and reissue bot token via @BotFather
   - Turnstile: new secret key
2. Add ALL environment variables to Vercel dashboard (Settings → Environment Variables)
3. Run: `git rm --cached .env`
4. Add `.env` to `.gitignore`
5. Run: `git filter-repo --path .env --invert-paths` (requires `git filter-repo` installed)
6. Create `.env.example` with all variable names and empty/placeholder values
7. Force-push rewritten history: `git push --force-with-lease`
8. Verify Vercel deployment works with Vercel env vars only

**Risk assessment:** HIGH — temporary service interruption during rotation window.

**Validation checklist:**
- [ ] `git log --all --full-history -- .env` returns nothing
- [ ] `grep -r "egxvmkhynsaikucsucjs" .` returns nothing
- [ ] All external services accept new keys
- [ ] App deploys and login works
- [ ] File upload works
- [ ] AI chat works
- [ ] Telegram bot responds

**Expected result:** No secrets in git. Application runs on Vercel env vars only.

---

## MILESTONE 0.2 — Fix JWT Fallback Secret

**Goal:** Eliminate the possibility of forged mobile auth tokens.

**Affected files:** `src/lib/supabase/auth-helpers.ts`

**Files to modify:** `src/lib/supabase/auth-helpers.ts`

**Migration steps:**

```typescript
// BEFORE (auth-helpers.ts)
const JWT_SECRET = 
  process.env.MOBILE_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "fallback-secret-change-in-production"; // ← REMOVE THIS

// AFTER
const JWT_SECRET = (() => {
  const secret = 
    process.env.MOBILE_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error(
      "[AUTH] No JWT secret configured. Set MOBILE_AUTH_SECRET in your environment variables."
    );
  }
  return secret;
})();
```

Generate a proper secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add `MOBILE_AUTH_SECRET=<generated_secret>` to Vercel environment variables.

**Risk assessment:** MEDIUM — existing mobile sessions become invalid. Users must re-login.

**Validation checklist:**
- [ ] Mobile app login issues a new JWT
- [ ] JWT is verifiable with new secret
- [ ] Old tokens with fallback secret are rejected
- [ ] Cold start does not throw if env var is set

**Expected result:** No hardcoded secrets anywhere in source code.

---

## MILESTONE 0.3 — Fix NEXTAUTH_SECRET and Placeholder Values

**Goal:** Replace all placeholder environment variable values.

**Migration steps:**
1. Generate new `NEXTAUTH_SECRET`: `openssl rand -base64 64`
2. Set in Vercel environment
3. Confirm the `NEXTAUTH_URL` is set to the production URL, not `http://localhost:3000`
4. Verify `S3_*` vars are either fully configured or completely removed if S3 is unused

**Validation checklist:**
- [ ] `NEXTAUTH_SECRET` is not the placeholder value
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] No empty required env vars

---

## MILESTONE 1.1 — Add Security Headers

**Goal:** Enable browser-level security protections.

**Affected files:** `next.config.js`

**Files to modify:** `next.config.js`

**Migration steps:**

```javascript
// next.config.js — add headers() section
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://res.cloudinary.com https://uploadthing.com https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://generativelanguage.googleapis.com",
      "frame-src https://challenges.cloudflare.com",
      "media-src 'self' https://res.cloudinary.com",
    ].join('; ')
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // ... existing config
};
```

**Risk assessment:** LOW — may break inline scripts. Monitor for CSP violations in browser console and adjust `script-src` if needed.

**Validation checklist:**
- [ ] `curl -I https://your-domain.com | grep -i "x-frame"` shows header
- [ ] No console CSP violations on main pages
- [ ] Security header scan at securityheaders.com shows green

---

## MILESTONE 1.2 — Rate Limiting on Auth Endpoints

**Goal:** Protect login, password reset, and all mutation endpoints from brute force and abuse.

**Affected files:** `src/lib/redis.ts`, all auth route handlers

**Files to create:** `src/lib/rate-limit.ts` (centralized rate limiter)

**Migration steps:**

Create `src/lib/rate-limit.ts`:
```typescript
import { redis } from "./redis";
import { NextResponse } from "next/server";

interface RateLimitConfig {
  window: number;    // seconds
  max: number;       // max requests per window
  keyPrefix: string;
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `rl:${config.keyPrefix}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.window;

  try {
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(key, 0, windowStart);
    pipe.zadd(key, now, `${now}-${Math.random()}`);
    pipe.zcard(key);
    pipe.expire(key, config.window);
    const results = await pipe.exec();
    
    const count = (results?.[2]?.[1] as number) ?? 0;
    
    return {
      success: count <= config.max,
      remaining: Math.max(0, config.max - count),
      reset: now + config.window,
    };
  } catch {
    // Redis unavailable — fail open in development
    if (process.env.NODE_ENV === "development") return { success: true, remaining: config.max, reset: now + config.window };
    // In production, fail closed
    return { success: false, remaining: 0, reset: now + config.window };
  }
}

export const RATE_LIMIT_CONFIGS = {
  LOGIN: { window: 900, max: 10, keyPrefix: "login" },          // 10 per 15 min
  REGISTER: { window: 3600, max: 5, keyPrefix: "register" },    // 5 per hour (existing)
  PASSWORD_RESET: { window: 3600, max: 3, keyPrefix: "reset" }, // 3 per hour
  AI_CHAT: { window: 60, max: 20, keyPrefix: "ai-chat" },       // 20 per minute
  POST_CREATE: { window: 3600, max: 5, keyPrefix: "post" },     // 5 per hour
  COMMENT_CREATE: { window: 3600, max: 10, keyPrefix: "comment" },
} as const;

// Middleware helper to return 429 response
export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests", retryAfter: reset },
    { status: 429, headers: { "Retry-After": String(reset - Math.floor(Date.now() / 1000)) } }
  );
}
```

Apply to login endpoint:
```typescript
// src/app/api/v1/auth/login/route.ts (if exists, or wherever login is handled)
const ip = req.headers.get("x-forwarded-for") ?? "unknown";
const limit = await rateLimit(ip, RATE_LIMIT_CONFIGS.LOGIN);
if (!limit.success) return rateLimitResponse(limit.reset);
```

**Risk assessment:** LOW — rate limiting is purely additive. Legitimate users stay well under limits.

**Validation checklist:**
- [ ] 11+ login attempts from same IP within 15 min → 429
- [ ] After 15 min window, login works again
- [ ] Redis unavailable in dev → login still works (fail-open)
- [ ] Redis unavailable in prod → login blocked (fail-closed)

---

## MILESTONE 1.3 — Error Monitoring (Sentry)

**Goal:** Make errors visible in production.

**Affected files:** `package.json`, `next.config.js`, new Sentry config files

**Files to create:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

**Migration steps:**
```bash
npx @sentry/wizard@latest -i nextjs
```

This generates all config files automatically. Set `SENTRY_DSN` in Vercel environment.

Add to `src/lib/` a thin wrapper:
```typescript
// src/lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error("[ERROR]", error);
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
```

Replace bare `console.error` in route handlers with `captureError()` over time.

**Risk assessment:** LOW — purely additive. No existing functionality changes.

**Validation checklist:**
- [ ] Throw a test error in dev → appears in Sentry dashboard
- [ ] Sentry performance traces show request durations
- [ ] Source maps uploaded so stack traces are readable

---

## MILESTONE 1.4 — Structured Logging (Pino)

**Goal:** Replace `console.log()` with structured, searchable JSON logs.

**Affected files:** All files using `console.log/error/warn`

**Files to create:** `src/lib/logger.ts`

**Migration steps:**

```bash
npm install pino pino-pretty
```

```typescript
// src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: "medonex-api",
    env: process.env.NODE_ENV,
  },
});

// Request-scoped logger factory
export function requestLogger(requestId: string, userId?: string) {
  return logger.child({ requestId, userId });
}
```

Replace uses incrementally — start with auth and AI routes.

**Validation checklist:**
- [ ] Logs are JSON in production
- [ ] Logs are pretty-printed in development
- [ ] Every log line has a `requestId` field
- [ ] Vercel log drain (or similar) receives structured logs

---

## MILESTONE 1.5 — CI/CD Pipeline

**Goal:** Automated test and lint gate on every push.

**Files to create:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      REDIS_URL: ${{ secrets.TEST_REDIS_URL }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build
      
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

**Validation checklist:**
- [ ] Push to main triggers CI workflow
- [ ] Failed test blocks merge
- [ ] npm audit runs on every CI run

---

## MILESTONE 1.6 — Fix Local File Upload (Storage)

**Goal:** Ensure file uploads work in production (Vercel ephemeral filesystem issue).

**Affected files:** `src/lib/storage.ts`, `.env`

**Migration steps:**
1. Set `USE_LOCAL_FILE_UPLOAD=false` in Vercel environment variables
2. Ensure `UPLOADTHING_TOKEN` and Cloudinary env vars are set in Vercel
3. In `src/lib/storage.ts`, add a startup warning if `USE_LOCAL_FILE_UPLOAD=true` and `NODE_ENV=production`:

```typescript
if (process.env.USE_LOCAL_FILE_UPLOAD === "true" && process.env.NODE_ENV === "production") {
  console.warn(
    "[STORAGE] WARNING: USE_LOCAL_FILE_UPLOAD is true in production. " +
    "Files will be lost on redeploy. Set to false and configure Cloudinary/UploadThing."
  );
}
```

**Validation checklist:**
- [ ] Upload a lecture file in production → persists after redeploy
- [ ] Upload an avatar → persists
- [ ] `USE_LOCAL_FILE_UPLOAD` is `false` in Vercel environment

---

## MILESTONE 2.1 — Unit Tests: Core Business Logic

**Goal:** Safety net for the most critical business logic.

**Files to create:**
- `src/lib/__tests__/quiz-scoring.test.ts`
- `src/lib/__tests__/flashcard-engine.test.ts`
- `src/lib/__tests__/gemini-keys.test.ts`
- `src/lib/__tests__/rate-limit.test.ts`
- `src/lib/__tests__/ai-router.test.ts`

**Example — quiz scoring test:**
```typescript
// src/lib/__tests__/quiz-scoring.test.ts
import { describe, it, expect } from "vitest";
import { computeScore } from "../quiz-attempt-score";

describe("computeScore", () => {
  it("returns 100 when all answers correct", () => {
    const result = computeScore([
      { isCorrect: true, weight: 1 },
      { isCorrect: true, weight: 1 },
    ]);
    expect(result).toBe(100);
  });

  it("returns 50 when half answers correct with equal weights", () => {
    const result = computeScore([
      { isCorrect: true, weight: 1 },
      { isCorrect: false, weight: 1 },
    ]);
    expect(result).toBe(50);
  });

  it("returns 0 for empty attempt", () => {
    expect(computeScore([])).toBe(0);
  });
});
```

**Validation checklist:**
- [ ] `npm test` passes all unit tests
- [ ] Coverage report shows >50% for tested files
- [ ] CI runs tests on every push

---

## MILESTONE 2.2 — Integration Tests: Auth Flow

**Goal:** End-to-end test of registration and login.

**Files to create:**
- `src/__tests__/integration/auth/register.test.ts`
- `src/__tests__/integration/auth/login.test.ts`
- `src/__tests__/integration/auth/mobile-jwt.test.ts`

**Migration steps:**
Use a test database (separate Supabase project or local PostgreSQL via Docker):
```typescript
// src/__tests__/integration/setup.ts
import { beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**Validation checklist:**
- [ ] Registration creates user in DB and Supabase
- [ ] Login with correct credentials returns session
- [ ] Login with wrong password returns 401
- [ ] JWT creation and verification work
- [ ] Expired JWT returns 401

---

## MILESTONE 3.1 — Service Layer: Auth Service

**Goal:** Extract auth business logic from route handlers.

**Files to create:** `src/services/auth.service.ts`

**Files to modify:** Auth route handlers

**Example extraction:**
```typescript
// src/services/auth.service.ts
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { captureError } from "@/lib/monitoring";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  nickname: string;
  phone: string;
  universityId: string;
  semesterId: string;
  facultyId: string;
  telegramCode: string;
}

export interface RegisterResult {
  id: string;
  name: string;
  studentCode: string;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  // 1. Verify telegram code
  const botUser = await prisma.botUser.findFirst({ where: { phone: input.phone } });
  if (!botUser) throw new Error("Phone number not registered with Telegram bot");
  
  const botAuth = await prisma.botAuth.findFirst({ where: { telegramId: botUser.telegramId } });
  if (!botAuth || botAuth.code !== input.telegramCode) throw new Error("Invalid verification code");

  // 2. Check uniqueness
  const [emailExists, nicknameExists] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
    prisma.user.findUnique({ where: { nickname: input.nickname.toLowerCase() }, select: { id: true } }),
  ]);
  if (emailExists) throw new Error("EMAIL_EXISTS");
  if (nicknameExists) throw new Error("NICKNAME_EXISTS");

  // 3. Create in Supabase
  const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    user_metadata: { name: input.name, role: "STUDENT" },
  });
  if (supabaseError || !supabaseUser.user) throw new Error(`Supabase: ${supabaseError?.message}`);

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // 5. Create user in transaction
  const university = await prisma.university.findUnique({ where: { id: input.universityId }, select: { abbr: true } });
  const studentCode = generateStudentCode(university?.abbr ?? "UNI", input.facultyId, input.phone);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        id: supabaseUser.user!.id,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        nickname: input.nickname.toLowerCase(),
        universityId: input.universityId,
        semesterId: input.semesterId,
        facultyId: input.facultyId,
        telegramId: botUser.telegramId,
        studentCode,
        role: "STUDENT",
      },
      select: { id: true, name: true, studentCode: true },
    });
    await tx.botAuth.deleteMany({ where: { telegramId: botUser.telegramId } });
    return newUser;
  });

  return user;
}
```

Then the route handler becomes thin:
```typescript
// src/app/api/v1/auth/register/route.ts
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimit(ip, RATE_LIMIT_CONFIGS.REGISTER);
  if (!limit.success) return rateLimitResponse(limit.reset);

  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await registerUser(parsed.data);
    // Send verification email (non-blocking)
    sendVerificationEmail(result.email, result.name).catch(captureError);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTS") return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      if (error.message === "NICKNAME_EXISTS") return NextResponse.json({ error: "Nickname already taken" }, { status: 409 });
    }
    captureError(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
```

---

## MILESTONE 3.2 — Service Layer: Quiz Service

**Files to create:** `src/services/quiz.service.ts`

**Key functions to extract:**
- `submitQuizAttempt(userId, pastPaperId, answers, timeTaken)`
- `getQuizAttemptHistory(userId, options)`
- `computeAttemptScore(answers, questions)`
- `saveSharedQuiz(data)`

---

## MILESTONE 3.3 — Service Layer: AI Service

**Files to create:** `src/services/ai.service.ts`

**Key functions to extract:**
- `getAIChatResponse(userId, message, context)` → returns streaming SSE or buffered response
- `extractQuestionsFromText(text, options)`
- `generateFlashcardsFromText(text, options)`
- `gradeEssayAnswer(question, answer, rubric)`

---

## MILESTONE 4.1 — AI Chat Streaming

**Goal:** Eliminate Vercel 10s timeout for AI chat.

**Files to create:** `src/app/api/v1/ai/chat/stream/route.ts`

**Migration steps:**

```typescript
// src/app/api/v1/ai/chat/stream/route.ts
import { withAuth } from "@/lib/auth-middleware";
import { NextRequest } from "next/server";

export const maxDuration = 60; // Vercel Pro allows up to 60s

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get("message");
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = await getAIStreamingResponse(userId, message!);
        
        for await (const chunk of aiStream) {
          const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errData = `data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`;
        controller.enqueue(encoder.encode(errData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
```

Update `ai-router.ts` to support async generators for streaming.

**Validation checklist:**
- [ ] Chat response begins arriving within 2 seconds
- [ ] Full 3000-word response arrives without timeout
- [ ] AI provider failure mid-stream sends an error event
- [ ] Old blocking endpoint still works

---

## MILESTONE 4.2 — Cache Academic Content

**Goal:** Eliminate database hits for static academic hierarchy.

**Affected files:** Route handlers for universities, faculties, modules, subjects, semesters

**Migration steps:**

```typescript
// src/lib/academic-cache.ts
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export const getCachedUniversities = unstable_cache(
  async () => prisma.university.findMany({
    select: { id: true, name: true, abbr: true },
    orderBy: { name: "asc" },
  }),
  ["universities"],
  { revalidate: 3600, tags: ["universities"] }
);

export const getCachedModules = unstable_cache(
  async (semesterId: string) => prisma.module.findMany({
    where: { semesterId },
    select: { id: true, name: true, semesterId: true },
    orderBy: { name: "asc" },
  }),
  ["modules"],
  { revalidate: 3600, tags: ["modules"] }
);

// Invalidation helper for admin use
export function invalidateAcademicCache() {
  revalidateTag("universities");
  revalidateTag("modules");
  // etc.
}
```

Call `invalidateAcademicCache()` in admin routes that create/update/delete academic content.

**Validation checklist:**
- [ ] Second request for universities list hits Next.js cache (response time <10ms)
- [ ] After admin creates a new module, cache is invalidated and next request returns updated list

---

## MILESTONE 4.3 — Increase Auth Cache TTL

**Goal:** Reduce auth lookups from every 30 seconds to every 5 minutes.

**Affected files:** `src/lib/auth.ts`

**Migration steps:**

```typescript
// src/lib/auth.ts — change TTL from 30 to 300 (5 minutes)
const AUTH_CACHE_TTL = parseInt(process.env.AUTH_CACHE_TTL ?? "300", 10);

// In the auth() function:
await cacheSet(`auth:${userId}`, session, AUTH_CACHE_TTL);
```

Also add cache invalidation when user role or profile changes:
```typescript
// In profile update service
await cacheDel(`auth:${userId}`);
```

**Validation checklist:**
- [ ] Authenticated request does not hit Supabase on every call within 5 minutes
- [ ] After profile update, next request gets fresh data

---

## MILESTONE 4.4 — Fix N+1 in AI Context Builder

**Goal:** Eliminate sequential queries in `ai-context-builder.ts`.

**Affected files:** `src/lib/ai-context-builder.ts`

**Migration steps:**

Replace sequential awaits with `Promise.all()`:

```typescript
// BEFORE (sequential)
const syllabus = await fetchSyllabus(userId);
const quizStats = await fetchQuizStats(userId);
const leaderboard = await fetchLeaderboard(userId);

// AFTER (parallel)
const [syllabus, quizStats, leaderboard] = await Promise.all([
  fetchSyllabus(userId),
  fetchQuizStats(userId),
  fetchLeaderboard(userId),
]);
```

For the raw SQL join in context building, ensure it uses a single query rather than separate table queries.

**Validation checklist:**
- [ ] AI chat context building takes <500ms (down from 1500ms+)
- [ ] Context data is the same as before

---

## MILESTONE 5.1 — API Envelope Standardization (V1)

**Goal:** All V1 routes use the same response envelope as V2.

**Affected files:** All 69 V1 route handler files

**Strategy:** Do this module by module, not all at once.

**Order of migration:**
1. Auth routes (highest traffic, most visible)
2. Quiz routes (core feature)
3. Content routes (universities, modules, lectures)
4. Social routes (posts, comments, likes)
5. AI routes
6. Admin routes

**For each route:**

```typescript
// BEFORE
return NextResponse.json({ error: "Email already registered" }, { status: 409 });
return NextResponse.json({ id: user.id, name: user.name }, { status: 201 });

// AFTER
import { ok, fail } from "@/platform/api/envelope";
return fail("Email already registered", undefined, undefined, 409);
return ok({ id: user.id, name: user.name }, scope.universityId, actor, 201);
```

**Validation checklist (per route):**
- [ ] Success response has `{ requestId, tenantKey, actor, result, errors: [] }`
- [ ] Error response has `{ requestId, errors: ["message"] }`
- [ ] HTTP status codes are correct
- [ ] Mobile app handles new format

---

## MILESTONE 5.2 — OpenAPI Documentation

**Goal:** Auto-generate API documentation from route handlers.

**Files to create:** `src/app/api/docs/route.ts`, `openapi.yaml`

**Migration steps:**
```bash
npm install zod-to-openapi @asteasolutions/zod-to-openapi
```

Use existing Zod schemas to generate OpenAPI spec. Host at `/api/docs`.

**Validation checklist:**
- [ ] `/api/docs` returns valid OpenAPI 3.1 JSON
- [ ] All endpoints are documented
- [ ] Request/response schemas match Zod definitions

---

# SECTION 6: ARCHITECTURE IMPROVEMENTS

## 6.1 — Notification System (Fix Dead Pub/Sub)

**Problem:** Redis pub/sub is used to publish notifications but there are no subscribers. Notifications sent via this mechanism are silently dropped.

**Current implementation:** `publishNotification(userId, payload)` publishes to `notifications:{userId}` Redis channel. No process subscribes to these channels. Client polls or relies on Firebase FCM which has a separate path.

**Proposed implementation:** Replace Redis pub/sub with Supabase Realtime (PostgreSQL LISTEN/NOTIFY or Supabase's built-in realtime subscriptions) for web clients. Keep Firebase FCM for push notifications (already works). Remove the Redis pub/sub code to eliminate confusion.

```typescript
// Option A: Supabase Realtime (recommended)
// On client side, subscribe to Supabase realtime channel for notifications
// On server side, create a Notification record in DB → triggers Supabase realtime push

// Option B: SSE endpoint
// Client opens GET /api/v1/notifications/stream
// Server keeps connection open, sends events when new notifications arrive via DB polling
```

**Benefits:** Notifications actually work. No dead code. Supabase Realtime is already in the stack.

**Migration complexity:** Medium — requires client-side changes to subscribe to Supabase channels.

**Potential risks:** Supabase Realtime has connection limits on free plan.

**Rollback plan:** Keep the existing polling approach during transition.

---

## 6.2 — AI Provider: Remove DuckDuckGo Scraping

**Problem:** The AI fallback chain uses DuckDuckGo's unofficial chat API by scraping their endpoints. This violates ToS and can break without notice.

**Current implementation:** `ai-router.ts` makes unauthenticated requests to DuckDuckGo's internal chat API endpoints.

**Proposed implementation:** Replace with either:
- A free-tier OpenRouter account (provides access to free models like Llama via a real API)
- A free Groq account (already in the stack, very fast for free tier)
- Remove DuckDuckGo entirely and rely on SiliconFlow as the free tier

**Benefits:** Stable, ToS-compliant fallback. No surprise API breakage.

**Migration complexity:** Low — change one provider in the fallback chain.

**Rollback plan:** Re-add DuckDuckGo as last resort.

---

## 6.3 — Email Service: Move to Resend

**Problem:** Gmail SMTP limits to 500 emails/day. `resend` is already in `package.json` but nodemailer is used instead.

**Current implementation:** `nodemailer` + Gmail SMTP.

**Proposed implementation:** Use `resend` (already installed). Resend offers 3,000 emails/month on free tier and 100,000/month on Hobby ($20/month).

```typescript
// src/lib/email.ts — replace nodemailer with Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, name: string, link: string) {
  await resend.emails.send({
    from: "MedOneX <no-reply@yourdomain.com>",
    to,
    subject: "Verify your email",
    html: `<h1>Hello ${name}</h1><p>Click <a href="${link}">here</a> to verify.</p>`,
  });
}
```

**Benefits:** Higher limit, better deliverability, no SMTP config.

**Migration complexity:** Low — Resend is already installed.

**Rollback plan:** Revert to nodemailer config.

---

## 6.4 — Request ID Generation

**Problem:** `Math.random()` used for request IDs in the V2 envelope. Not unique under load.

**Current implementation:** `requestId: Math.random().toString(36).slice(2)`

**Proposed implementation:**
```typescript
import { randomUUID } from "crypto";
const requestId = randomUUID(); // Cryptographically secure, guaranteed unique
```

**Benefits:** Truly unique IDs. Safe for distributed tracing and log correlation.

**Migration complexity:** Trivial.

**Rollback plan:** N/A.

---

## 6.5 — Session Management

**Problem:** Auth session is cached for 5 minutes (after fix) but there's no event-driven cache invalidation when a user's role changes.

**Proposed implementation:** Whenever an admin changes a user's role, call `cacheDel(`auth:${userId}`)` to force a fresh session on next request.

Already partially in place — the fix is to ensure it's called consistently in all admin role-change routes.

---

# SECTION 7: DATABASE REMEDIATION

## Schema Review

The 2803-line schema with ~95 models is comprehensive but shows signs of organic growth:
- V1 models (`University`, `Semester`, `Module`, `Lecture`) coexist with V2 models (`V2Faculty`, `V2Subject`, `V2Lecture`, `V2Module`)
- Ad-hoc migration scripts exist outside Prisma's migration system

## Critical Schema Issues

### 7.1 — V1/V2 Model Duplication

**Problem:** `Lecture` and `V2Lecture` are separate models with overlapping purposes. Same for Module/V2Module, Subject/V2Subject.

**Recommendation:** Do NOT remove V1 models until all routes using them are migrated to V2. Document which models are active in a schema comment:

```prisma
// DEPRECATED: Use V2Lecture for new features. V1 API only.
model Lecture {
  // ...
}

// ACTIVE: Used by /api/v2/content/ routes
model V2Lecture {
  // ...
}
```

This prevents confusion about which model to use for new queries.

---

### 7.2 — Missing Cascade Definitions

**Problem:** Several relations lack explicit cascade or set-null behavior. When a `University` is deleted, what happens to its `User` records? When a `User` is deleted, what happens to their `Post` records?

**Current state:** Prisma's default (Restrict) may cause delete failures. Or explicit cascades exist but aren't documented.

**Recommended cascade policy:**

| Relation | On Parent Delete | Reason |
|----------|-----------------|--------|
| University → User | Restrict | Never delete a university with users |
| User → Post | Cascade | Delete user's posts on account deletion |
| User → Comment | Cascade | Delete user's comments |
| User → QuizAttempt | Cascade | Delete attempts |
| Post → Comment | Cascade | Delete comments when post deleted |
| Post → Like | Cascade | Delete likes when post deleted |
| Lecture → Question | Cascade | Delete questions with lecture |
| PastPaper → QuizAttempt | Cascade | Delete attempts when paper deleted |
| Module → Subject | Cascade | Delete subjects with module |
| Subject → Lecture | Cascade | Delete lectures with subject |

Verify these in `schema.prisma` and add where missing:
```prisma
model Post {
  comments Comment[] @relation(onDelete: Cascade)
  likes    Like[]    @relation(onDelete: Cascade)
}
```

---

### 7.3 — Ad-hoc Migration Scripts

**Problem:** `backfill-forum-university.ts` and `migrate-faculties.ts` exist outside Prisma's migration system. It is unknown whether they have been run on the production database.

**Recommendation:**
1. Verify whether these scripts were run by checking for the presence of the data they would have created.
2. If run: add a `_MigrationLog` record (or a comment in the schema) documenting their execution.
3. If not run: convert them to Prisma migrations or document them as one-time scripts with a run log.

**Create a migration documentation file:**
```markdown
# prisma/MIGRATION_LOG.md

## One-Time Migration Scripts

### backfill-forum-university.ts
- Purpose: Backfills universityId on Forum records without it
- Status: [RUN / NOT RUN]
- Run date: [DATE]
- Run by: [PERSON]
- Notes: [Any issues]

### migrate-faculties.ts
- Purpose: Migrates faculty structure to new schema
- Status: [RUN / NOT RUN]
```

---

### 7.4 — Missing Indexes

Review the following for missing indexes:

| Table | Column | Query Pattern | Add Index? |
|-------|--------|--------------|-----------|
| `Comment` | `(postId, createdAt)` | Feed comments sorted by time | YES |
| `Comment` | `parentId` | Threaded comment fetching | YES |
| `DirectMessage` | `(senderId, receiverId, createdAt)` | Conversation history | YES |
| `Notification` | `(userId, createdAt)` | Notification feed | YES — already has `(userId, read)`, add createdAt |
| `UserFlashcardProgress` | `(userId, lectureId)` | Progress by lecture | YES |
| `QuizAttemptItem` | `questionId` | Question statistics | YES |
| `Post` | `authorId` | Profile posts | YES |
| `Like` | `(postId, userId)` | Check if user liked post | YES — composite unique |
| `StudyRoomMember` | `(roomId, userId)` | Room membership check | YES |

Add indexes to `schema.prisma`:
```prisma
model Comment {
  @@index([postId, createdAt])
  @@index([parentId])
}
```

Then create a new Prisma migration:
```bash
npx prisma migrate dev --name add_missing_indexes
```

---

### 7.5 — Migration Execution Order

When applying migrations to production:

1. Always run `npx prisma migrate status` first to see pending migrations
2. For additive migrations (new tables, new columns, new indexes): safe to run live
3. For destructive migrations (drop column, drop table): require maintenance window
4. For data migrations (backfills): run in off-peak hours with transactions

**Safe migration protocol:**
```bash
# 1. Take a database backup (via Supabase dashboard)
# 2. Check migration status
npx prisma migrate status

# 3. Preview the SQL
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# 4. Apply (on production, use --skip-generate to avoid regenerating client)
npx prisma migrate deploy
```

---

# SECTION 8: API STABILIZATION

## 8.1 — Standardized Error Codes

All API errors must include a machine-readable error code, not just a human-readable message.

**Create `src/lib/api-errors.ts`:**
```typescript
export const ApiErrors = {
  // Auth
  UNAUTHORIZED: { code: "UNAUTHORIZED", message: "Authentication required", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", message: "Access denied", status: 403 },
  EMAIL_EXISTS: { code: "EMAIL_EXISTS", message: "Email already registered", status: 409 },
  NICKNAME_EXISTS: { code: "NICKNAME_EXISTS", message: "Nickname already taken", status: 409 },
  INVALID_CREDENTIALS: { code: "INVALID_CREDENTIALS", message: "Invalid email or password", status: 401 },
  INVALID_CODE: { code: "INVALID_CODE", message: "Invalid verification code", status: 400 },
  
  // Rate limiting
  RATE_LIMITED: { code: "RATE_LIMITED", message: "Too many requests", status: 429 },
  
  // Resources
  NOT_FOUND: { code: "NOT_FOUND", message: "Resource not found", status: 404 },
  
  // Validation
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", message: "Validation failed", status: 400 },
  
  // Server
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", status: 500 },
} as const;

export type ApiErrorCode = keyof typeof ApiErrors;
```

---

## 8.2 — Input Validation for Route Parameters

Currently, request body is validated with Zod, but URL params (path segments, query strings) are often accessed without validation.

**Pattern to enforce:**
```typescript
// Route handler for GET /api/v1/lectures/[id]
export const GET = withAuth(async (req, { params }) => {
  const { id } = params;
  
  // Validate that id is a valid CUID (Prisma default ID format)
  const idSchema = z.string().cuid();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return fail(ApiErrors.VALIDATION_ERROR.message, undefined, undefined, 400);
  }
  
  const lecture = await prisma.lecture.findUnique({ where: { id: parsed.data } });
  if (!lecture) return fail(ApiErrors.NOT_FOUND.message, undefined, undefined, 404);
  
  return ok(lecture);
});
```

---

## 8.3 — Consistent HTTP Status Codes

**Enforce these conventions across all routes:**

| Scenario | Status Code |
|----------|------------|
| Success with body | 200 |
| Created resource | 201 |
| Deleted / no content | 204 |
| Validation error | 400 |
| Not authenticated | 401 |
| Authenticated but no permission | 403 |
| Resource not found | 404 |
| Conflict (duplicate) | 409 |
| Rate limited | 429 |
| Server error | 500 |
| External service error | 502 |

---

## 8.4 — Backward Compatibility During Migration

During the V1 → V2 envelope migration:
1. Keep old response format available via `?legacy=true` query param
2. Set a sunset date (e.g., 90 days after envelope migration)
3. Update mobile app to use new envelope format before sunset date

---

# SECTION 9: AUTHENTICATION & AUTHORIZATION

## 9.1 — Authentication Flow Verification

### Web Auth (Supabase SSR)

**Current state:** Correct. `middleware.ts` refreshes the Supabase session cookie on every request. `auth()` in `lib/auth.ts` reads the refreshed cookie.

**Improvement needed:** The `auth()` function catches ALL errors silently (`return null` on any error). This masks auth provider outages.

**Fix:**
```typescript
export async function auth(): Promise<AuthSession | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Don't silently swallow provider errors
      if (error.status !== 401) {
        logger.warn({ error: error.message }, "Supabase auth error (non-401)");
      }
      return null;
    }
    // ... rest of function
  } catch (error) {
    captureError(error, { context: "auth()" });
    return null;
  }
}
```

---

### Mobile Auth (Custom JWT)

**Current state:** JWT is created with `jose` library and verified on each request. 30-day expiry.

**Issues:**
1. No refresh token mechanism — users must re-login after 30 days
2. JWT contains `semesterId`, `universityId` — these can change but the JWT is not invalidated

**Improvements:**
1. Implement refresh token endpoint: `POST /api/mobile/refresh` that issues a new JWT given a valid (non-expired) one
2. Use short-lived access tokens (1 hour) + long-lived refresh tokens (30 days) stored server-side
3. When user's semester/university changes, invalidate their JWT by storing a `jwtVersion` in the user record and including it in the JWT claim

```typescript
// User model addition
model User {
  jwtVersion Int @default(0) // Increment to invalidate all tokens
}

// JWT payload
{ id, sub, role, jwtVersion, exp }

// Verification
const tokenVersion = payload.jwtVersion;
const userVersion = user.jwtVersion;
if (tokenVersion !== userVersion) throw new Error("Token invalidated");
```

---

### Token Lifecycle

| Token Type | Lifetime | Storage | Revocation |
|------------|---------|---------|-----------|
| Supabase Session | Auto-refreshed | HTTPOnly cookie | Supabase logout |
| Mobile Access Token | 1 hour (after fix) | Mobile app memory | `jwtVersion` increment |
| Mobile Refresh Token | 30 days | Secure storage | `jwtVersion` increment |

---

## 9.2 — Permission System

**Current state:** Role hierarchy is correctly implemented. `withAuth()`, `withAdmin()`, `withTeacher()` wrappers are used consistently in most routes.

**Gaps found:**
1. Some V1 routes call `auth()` directly without using `withAuth()` wrapper — inconsistent enforcement
2. Tenant scope validation (assertLecture, assertSemester, etc.) is in some admin routes but not all

**Enforcement rule:** ALL routes that modify data must use:
- At minimum `withAuth()` for ownership validation
- `withAdmin()` for university-scoped management
- `assertLecture(scope, lectureId)` (and similar) for all admin routes that touch academic content

**Audit checklist:**
- [ ] Every POST/PUT/DELETE route uses an auth wrapper
- [ ] All admin routes use `assertLecture`/`assertSemester`/etc. for tenant scope
- [ ] Ownership validation (authorId === userId) is checked for post/comment edits

---

## 9.3 — CSRF Protection

**Implement Double Submit Cookie pattern:**

```typescript
// src/lib/csrf.ts
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const CSRF_COOKIE = "__csrf";
const CSRF_HEADER = "x-csrf-token";

export function getCsrfToken(): string {
  const cookieStore = cookies();
  const existing = cookieStore.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  
  const token = randomUUID();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be readable by JS to include in header
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400, // 24 hours
  });
  return token;
}

export function validateCsrf(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}
```

Apply to all state-changing routes:
```typescript
// In withAuth() wrapper — add CSRF check for non-GET methods
if (req.method !== "GET" && req.method !== "HEAD") {
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }
}
```

Client must include the CSRF token in all POST/PUT/DELETE requests:
```typescript
// Client-side fetch wrapper
async function secureFetch(url: string, options: RequestInit) {
  const csrfToken = document.cookie.match(/__csrf=([^;]+)/)?.[1] ?? "";
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "x-csrf-token": csrfToken,
    },
  });
}
```

Note: CSRF protection applies to web (cookie-based) auth only. Mobile JWT auth is not vulnerable to CSRF.

---

## 9.4 — Role Elevation / Mass Assignment Fix

**Protect user update endpoints:**

```typescript
// ONLY allow these fields to be updated by the user themselves
const ALLOWED_USER_UPDATE_FIELDS = [
  "name", "nickname", "image", "bio", "studyGoals", 
  "semesterId", "facultyId", "prefersArabic"
] as const;

// NEVER allow via self-update
// role, points, isLeader, isVerified, isBanned, universityId
```

Apply in the profile update route:
```typescript
const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  nickname: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
  // ... only safe fields
}).strict(); // .strict() rejects unknown fields
```

---

# SECTION 10: PERFORMANCE OPTIMIZATION

## 10.1 — Priority Matrix

| Issue | Current State | Target State | Effort | Expected Gain |
|-------|-------------|-------------|--------|--------------|
| AI chat blocking | 503 after 10s | Stream in <2s | High | Feature works |
| Auth cache TTL | 30s | 300s | Trivial | 10x fewer cache misses |
| Academic content caching | No cache | 1h cache | Low | 99% fewer DB hits for static content |
| N+1 in AI context | 3+ sequential queries | 1 parallel query | Medium | 3x faster AI responses |
| Vercel cold starts | ~2s (large schema) | — | High (defer) | Marginally better |

## 10.2 — Slow Query Detection

Add Prisma query logging for queries >500ms:

```typescript
// src/lib/prisma.ts — add to PrismaClient config
const prismaClient = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
  ],
});

prismaClient.$on("query", (e) => {
  if (e.duration > 500) {
    logger.warn({
      query: e.query.slice(0, 200),
      duration: e.duration,
      target: e.target,
    }, "Slow query detected");
  }
});
```

## 10.3 — Heavy Endpoint Identification

Routes most likely to be slow:

| Endpoint | Why Slow | Fix |
|----------|---------|-----|
| `POST /api/v1/ai/chat` | Blocking AI call | Streaming |
| `GET /api/v1/feed` | Complex query with multiple joins | Add more indexes + cursor pagination |
| `GET /api/v1/ai/context` | N+1 queries | Parallel Promise.all |
| `POST /api/v1/auth/register` | Sequential: CAPTCHA + DB + Supabase + email | Parallelize where safe |

## 10.4 — Connection Pool

Current `connection_limit=30` in URL combined with Vercel serverless can result in connection exhaustion under load (each function invocation holds connections).

**Fix:** Reduce to 10 for Vercel, and rely on Supabase PgBouncer (already in URL with `pgbouncer=true`):

```
DATABASE_URL="...?pgbouncer=true&connection_limit=10&pool_timeout=30"
```

Also add `DIRECT_URL` for migrations (which must bypass PgBouncer):
```
DIRECT_URL="...?sslmode=require" # No pgbouncer params
```

This is already in the codebase — verify `schema.prisma`:
```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")
}
```

## 10.5 — Payload Size Limits

Add response pagination and payload limits where missing:

```typescript
// All list endpoints must enforce a max limit
const MAX_PAGE_SIZE = 50;
const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), MAX_PAGE_SIZE);
```

---

# SECTION 11: SECURITY HARDENING

## Complete Security Checklist

### 11.1 — Secrets Management ✓ (Milestones 0.1–0.3)

- [ ] All secrets in Vercel environment variables, not `.env`
- [ ] `.env` removed from git history
- [ ] No hardcoded secrets anywhere in source code
- [ ] `.env.example` has all required variable names with empty values

### 11.2 — Authentication Security

- [ ] JWT fallback secret removed (Milestone 0.2)
- [ ] Mobile tokens: 1-hour access + 30-day refresh (Section 9.3)
- [ ] `jwtVersion` field for token revocation
- [ ] Supabase session cookie is HttpOnly + Secure
- [ ] Password minimum requirements enforced (8 chars minimum — already exists)
- [ ] CAPTCHA on registration (already exists via Turnstile)
- [ ] Email verification required before login

### 11.3 — Authorization Security

- [ ] All state-changing routes use auth middleware
- [ ] Admin routes use tenant scope guards
- [ ] SUPER_ADMIN bypass is audited and logged
- [ ] User profile updates use `.strict()` Zod schema
- [ ] Ownership validation on all user-owned resources

### 11.4 — CSRF Protection ✓ (Section 9.3)

- [ ] CSRF token generated on page load
- [ ] CSRF token required on all POST/PUT/DELETE requests
- [ ] CSRF validation in `withAuth()` wrapper
- [ ] Mobile API (JWT Bearer) excluded from CSRF

### 11.5 — Rate Limiting ✓ (Milestone 1.2)

- [ ] Login: 10 per 15 min per IP
- [ ] Registration: 5 per hour per IP
- [ ] Password reset: 3 per hour per IP
- [ ] AI chat: 20 per minute per user
- [ ] Post creation: 5 per hour per user
- [ ] Comment creation: 10 per hour per user

### 11.6 — SQL Injection

Prisma's parameterized queries prevent SQL injection for all model operations. The raw SQL in `ai-context-builder.ts` uses `Prisma.sql` tagged template which is also safe (parameters are escaped). No SQL injection risk identified.

**Ongoing requirement:** All new raw SQL must use `Prisma.sql` template, never string concatenation.

### 11.7 — XSS Prevention

- [ ] AI-generated content sanitized before storage with `dompurify` or `xss` library
- [ ] Rich text editor (Tiptap) output sanitized before storage
- [ ] Content Security Policy header set (Milestone 1.1)
- [ ] No `dangerouslySetInnerHTML` without sanitization

Add sanitization:
```bash
npm install isomorphic-dompurify
```

```typescript
// src/lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "ul", "ol", "li", "p", "a", "br", "code", "pre"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
```

Apply to:
- Post content before storage
- Comment content before storage
- AI-generated flashcard content before storage
- AI-generated notes before storage

### 11.8 — File Upload Security

- [ ] MIME type validation (already in `storage.ts` — verify enforcement)
- [ ] File size limits enforced server-side (not just client-side)
- [ ] `USE_LOCAL_FILE_UPLOAD=false` in production
- [ ] Uploaded files served from CDN, not the app server
- [ ] No executable file types accepted

### 11.9 — CORS

Current CORS setup is permissive. For the API layer:

```typescript
// src/middleware.ts — add CORS for API routes
if (req.nextUrl.pathname.startsWith("/api/")) {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    // Add your mobile app's origin if using web views
  ].filter(Boolean);
  
  if (origin && !allowedOrigins.includes(origin)) {
    // Return 403 for cross-origin requests to the API
    // Exception: public endpoints (universities list, etc.)
  }
}
```

### 11.10 — Dependency Security

Run on every CI build:
```bash
npm audit --audit-level=high
```

Address HIGH and CRITICAL vulnerabilities before deployment.

Also run `npm outdated` monthly and update dependencies with care.

### 11.11 — Logging for Security Events

The `SecurityEvent` model already exists. Ensure these events are logged:
- Failed login attempts (with IP)
- Successful logins (with IP and user agent)
- Role changes
- SUPER_ADMIN actions
- File uploads
- Password changes
- Telegram account linking

---

# SECTION 12: CODE QUALITY REFACTORING

## 12.1 — Refactoring Plan

### Priority 1: Extract Service Layer (Milestone 3.x)

**Target state:** Every domain has a service file. Route handlers are <50 lines.

Services to create:
```
src/services/
├── auth.service.ts       (registration, login, token management)
├── quiz.service.ts       (attempts, scoring, history)
├── post.service.ts       (create, edit, delete, feed)
├── comment.service.ts    (create, edit, delete, threading)
├── flashcard.service.ts  (SM-2, due cards, progress)
├── ai.service.ts         (chat, extract, enhance, grade)
├── notification.service.ts (send, mark read, preferences)
├── study-room.service.ts (create, join, posts, sessions)
└── admin.service.ts      (content management, user management)
```

### Priority 2: Reduce File Sizes

| File | Lines | Action |
|------|-------|--------|
| `prisma/schema.prisma` | 2803 | Split into domain-specific schema files using `prisma-merge` |
| `src/lib/gemini.ts` | 939 | Extract each AI feature into its own file in `src/lib/ai/` |
| `src/lib/ai-router.ts` | 649 | Extract each provider into `src/lib/ai/providers/` |

### Priority 3: Eliminate Duplication

**Duplicate patterns found:**

1. Auth check in route handlers — move to `withAuth()` wrapper
2. Tenant scope validation — move to `assertScope()` helper
3. Pagination parameter parsing — move to `parsePagination()` utility
4. Error response formatting — move to `errorResponse()` helper

### Priority 4: SOLID Compliance

| Violation | Fix |
|-----------|-----|
| Route handlers do too much (SRP) | Extract to services (Priority 1) |
| `ai-router.ts` hard-codes providers (OCP) | Create `AIProvider` interface, each provider implements it |
| `withOptionalAuth` handles mobile + web (ISP) | Split into `withOptionalWebAuth` and `withOptionalMobileAuth` |
| Direct Prisma imports (DIP) | Route handlers use services, services use repositories |

### Priority 5: AI Provider Plugin Architecture

```typescript
// src/lib/ai/provider.interface.ts
export interface AIProvider {
  name: string;
  generateText(messages: Message[], options: AIOptions): Promise<string>;
  generateStream?(messages: Message[], options: AIOptions): AsyncGenerator<string>;
  isAvailable(): Promise<boolean>;
}

// src/lib/ai/providers/gemini.provider.ts
export class GeminiProvider implements AIProvider {
  name = "gemini";
  async generateText(...) { /* ... */ }
  async isAvailable() { return Boolean(process.env.GEMINI_API_KEY_1); }
}

// src/lib/ai/router.ts
const providers: AIProvider[] = [
  new SiliconFlowProvider(),
  new GeminiProvider(),
  new GroqProvider(),
];
```

This makes adding/removing providers a one-line change instead of modifying a 649-line file.

---

## 12.2 — Naming Consistency

**Issues found:**
- `SILICON_FLOW_API_KEY` and `SILICONFLOW_API_KEY` are duplicates in `.env`
- V1 uses `getSessionScope()`, V2 uses `requireTenantSession()` for the same concept
- `withAdmin()` and `withContentManager()` return the same roles — one is redundant

**Fixes:**
- Remove `SILICON_FLOW_API_KEY` duplicate — standardize on `SILICONFLOW_API_KEY`
- Document when to use `getSessionScope()` vs `requireTenantSession()` (or consolidate)
- Remove `withContentManager()` — it's identical to `withTeacher()`. Alias if needed for readability.

---

## 12.3 — Dead Code Removal

**Dead code identified:**
1. Redis pub/sub publishers without subscribers (`publishNotification`, `broadcastNotification`) — replace with Supabase Realtime (Section 6.1)
2. AWS S3 SDK imported but S3 env vars are empty — remove S3 if not used
3. `schema.v2.core.prisma` and `schema.v2.university.prisma` — are these merged into `schema.prisma`? If so, delete them

---

# SECTION 13: PROJECT STRUCTURE IMPROVEMENTS

## Recommended Structure

The current structure is largely fine. The improvements are organizational within `src/`:

```
src/
├── app/                          # Next.js App Router (keep as-is)
│   ├── api/
│   │   ├── v1/                   # Legacy — mark for migration
│   │   ├── v2/                   # New standard
│   │   └── mobile/               # Mobile API
│
├── services/                     # NEW: Business logic layer
│   ├── auth.service.ts
│   ├── quiz.service.ts
│   ├── post.service.ts
│   └── ...
│
├── lib/
│   ├── ai/                       # NEW: Split ai-router.ts into
│   │   ├── router.ts
│   │   ├── providers/
│   │   │   ├── gemini.ts
│   │   │   ├── groq.ts
│   │   │   ├── siliconflow.ts
│   │   │   └── huggingface.ts
│   │   └── gemini-features/      # Split gemini.ts into
│   │       ├── question-gen.ts
│   │       ├── flashcard-gen.ts
│   │       ├── essay-grader.ts
│   │       └── study-plan.ts
│   │
│   ├── prisma.ts                 # Keep (singleton)
│   ├── auth.ts                   # Keep
│   ├── redis.ts                  # Keep (rename to cache.ts?)
│   ├── email.ts                  # Keep (refactor to Resend)
│   ├── logger.ts                 # RENAME: currently admin-logger.ts
│   ├── monitoring.ts             # NEW: Sentry wrapper
│   ├── rate-limit.ts             # NEW: Centralized rate limiting
│   ├── sanitize.ts               # NEW: Content sanitization
│   ├── csrf.ts                   # NEW: CSRF utilities
│   └── api-errors.ts             # NEW: Error codes
│
├── repositories/                 # Keep + expand
│   ├── auth.repository.ts        # Exists
│   ├── user.repository.ts        # Exists
│   ├── quiz.repository.ts        # NEW
│   ├── post.repository.ts        # NEW
│   └── content.repository.ts     # NEW
│
└── platform/                     # Keep (V2 patterns)
```

**Rule:** No business logic in `app/api/`. Only parsing + calling services + formatting responses.

---

# SECTION 14: INFRASTRUCTURE

## 14.1 — Docker for Local Development

**Files to create:** `Dockerfile.dev`, `docker-compose.yml`

```yaml
# docker-compose.yml
version: '3.9'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: medqs
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Update `.env.example`:
```
# Local development with Docker
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medqs?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/medqs?schema=public
REDIS_URL=redis://localhost:6379
```

---

## 14.2 — Environment Configuration

**Required environment variables for production (complete list):**

```bash
# Database
DATABASE_URL=          # Supabase pooler URL with pgbouncer=true
DIRECT_URL=            # Supabase direct URL (no pgbouncer)

# Auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Rotated from committed value
NEXTAUTH_SECRET=               # Cryptographically random
NEXTAUTH_URL=                  # https://your-production-domain.com
MOBILE_AUTH_SECRET=            # Cryptographically random (64+ chars)

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI Providers
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
GEMINI_API_KEY_5=
GROQ_API_KEY=
SILICONFLOW_API_KEY=           # Remove SILICON_FLOW_API_KEY duplicate

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# File Storage
UPLOADTHING_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
USE_LOCAL_FILE_UPLOAD=false    # MUST be false in production

# Email
RESEND_API_KEY=                # After migrating from nodemailer

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_API_ID=
TELEGRAM_API_HASH=

# CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Monitoring
SENTRY_DSN=

# Feature Flags
SUPER_ADMIN_EMAIL=

# App
NEXT_PUBLIC_APP_URL=           # https://your-production-domain.com
NODE_ENV=production
```

---

## 14.3 — Vercel Configuration

**Upgrade to Vercel Pro** to unlock:
- 60-second function timeout (needed for AI streaming)
- More concurrent function invocations
- Team collaboration features
- Better observability

**Update `vercel.json`:**
```json
{
  "functions": {
    "src/app/api/v1/ai/chat/**": {
      "maxDuration": 60
    },
    "src/app/api/v1/ai/**": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/forum-cleanup",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 14.4 — Monitoring & Observability

**Stack recommendation:**

| Layer | Tool | Purpose |
|-------|------|---------|
| Error tracking | Sentry | Exceptions + stack traces |
| APM | Sentry Performance or Vercel Analytics | Request traces |
| Uptime | Better Uptime or UptimeRobot (free) | Availability monitoring |
| Logs | Vercel Log Drains → Axiom or Papertrail | Log aggregation |
| Metrics | Vercel Analytics | Page views, web vitals |

**Health check endpoint (create):**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);
  
  const db = checks[0].status === "fulfilled";
  const cache = checks[1].status === "fulfilled";
  const healthy = db && cache;
  
  return NextResponse.json({
    status: healthy ? "healthy" : "degraded",
    checks: {
      database: db ? "ok" : "fail",
      cache: cache ? "ok" : "fail",
    },
    timestamp: new Date().toISOString(),
  }, { status: healthy ? 200 : 503 });
}
```

---

## 14.5 — Backup & Disaster Recovery

**Database backups:** Supabase Pro provides daily automated backups with 7-day retention. Verify this is enabled.

**Manual backup before migrations:**
```bash
# Via Supabase CLI
supabase db dump --project-ref YOUR_PROJECT_REF > backup_$(date +%Y%m%d).sql
```

**Disaster recovery plan:**
1. Database failure: Restore from most recent Supabase backup (RPO: 24h, RTO: 1h)
2. Application failure: Vercel automatic failover + rollback to previous deployment
3. Redis failure: Application degrades gracefully (auth works, rate limiting fails open in dev, closed in prod)
4. AI provider failure: Fallback chain activates automatically

---

# SECTION 15: TESTING STRATEGY

## 15.1 — Phase 0 Testing (Security Fixes)

**After secret rotation:**
- Manual smoke test: login, upload, AI chat, Telegram bot
- Monitor Sentry for any new errors within 1 hour of deployment

**After JWT fix:**
- Unit test: JWT creation + verification with new secret
- Integration test: Mobile login → issued JWT → authenticated API call

---

## 15.2 — Phase 1 Testing (Stabilization)

**Rate limiting:**
```typescript
describe("Rate limiting — Login", () => {
  it("allows 10 requests in 15 minutes from same IP", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await fetch("/api/v1/auth/login", { method: "POST", ... });
      expect(res.status).not.toBe(429);
    }
  });
  
  it("returns 429 on the 11th request", async () => {
    // 10 requests already made
    const res = await fetch("/api/v1/auth/login", { method: "POST", ... });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });
});
```

**Security headers:**
```typescript
describe("Security headers", () => {
  it("includes X-Frame-Options", async () => {
    const res = await fetch("/");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });
  
  it("includes Content-Security-Policy", async () => {
    const res = await fetch("/");
    expect(res.headers.get("content-security-policy")).toBeDefined();
  });
});
```

---

## 15.3 — Phase 2 Testing (Test Foundation)

**Unit test matrix:**

| File | Tests Required |
|------|---------------|
| `quiz-attempt-score.ts` | Score = 0, 50%, 100%, weighted, empty |
| `flashcard-engine.ts` | SM-2: first review, correct, incorrect, interval calculation |
| `gemini-keys.ts` | Key rotation, quota tracking, round-robin |
| `rate-limit.ts` | Under limit, at limit, over limit, Redis failure |
| `sanitize.ts` | XSS tags stripped, safe HTML preserved |
| `auth.service.ts` | Registration happy path, duplicate email, invalid code |

**Integration test matrix:**

| Endpoint | Tests Required |
|----------|---------------|
| `POST /api/v1/auth/register` | Happy path, duplicate email, missing fields, invalid code |
| `GET /api/v1/auth/me` | Authenticated, unauthenticated, expired session |
| `POST /api/v1/quiz-attempts` | Valid attempt, invalid paper ID, unauthenticated |
| `POST /api/v1/posts` | Valid post, content too long, unauthenticated |
| `GET /api/v1/feed` | Returns posts for user's university |

---

## 15.4 — Phase 3 Testing (Service Layer)

For each extracted service:
1. Unit tests with mocked repositories
2. Integration tests with real database (test schema)
3. Verify identical behavior to old inline route handler code

---

## 15.5 — Phase 4 Testing (Performance)

**AI chat streaming:**
- Measure time to first byte (TTFB) → must be <2s
- Measure time to complete response → must not timeout at 10s
- Simulate provider failure mid-stream → client receives error event

**Cache testing:**
- Verify cache hit rate for universities endpoint > 95% after warm-up
- Verify stale data is not served after admin creates new module

---

## 15.6 — Phase 5 Testing (API Standardization)

**Regression test for every migrated endpoint:**
```typescript
// For each V1 route that gets envelope
describe("Registration response envelope", () => {
  it("success response has correct envelope shape", async () => {
    const res = await fetch("/api/v1/auth/register", { method: "POST", body: validBody });
    const data = await res.json();
    
    expect(data).toMatchObject({
      requestId: expect.any(String),
      tenantKey: expect.any(String),
      actor: null, // Not logged in during registration
      result: {
        id: expect.any(String),
        name: expect.any(String),
        studentCode: expect.any(String),
      },
      errors: [],
    });
  });
  
  it("error response has correct envelope shape", async () => {
    const res = await fetch("/api/v1/auth/register", { method: "POST", body: duplicateEmail });
    const data = await res.json();
    
    expect(res.status).toBe(409);
    expect(data.errors).toContain("Email already registered");
    expect(data.result).toBeNull();
  });
});
```

---

## 15.7 — Manual Verification Checklist

**Before every production deployment:**
- [ ] Login with email + password works
- [ ] Registration with Telegram code works
- [ ] Mobile app login returns JWT
- [ ] AI chat (Dr. Q) responds
- [ ] File upload (lecture PDF) works
- [ ] Leaderboard loads
- [ ] Post creation works
- [ ] Quiz attempt submission works
- [ ] Flashcard review works
- [ ] Telegram bot responds to /start
- [ ] Email verification arrives for new registration

---

# SECTION 16: REGRESSION PREVENTION

## 16.1 — Secret Rotation Risk

**What could break:** All external services
**Detection:** Monitor response codes from Supabase, Gemini, etc. within 5 minutes of rotation
**Prevention:** Rotate one service at a time. Test each before rotating next.
**Rollback:** Most platforms allow keeping old + new keys active simultaneously for a transition period

---

## 16.2 — JWT Secret Change Risk

**What could break:** All existing mobile JWT sessions become invalid
**Detection:** Mobile app returns 401 on all requests
**Prevention:** Communicate to mobile users that they need to re-login (in-app message)
**Rollback:** Accept old + new JWT secrets temporarily by trying both during verification

```typescript
// Temporary dual-secret verification during transition
async function verifyMobileToken(token: string) {
  const secrets = [
    process.env.MOBILE_AUTH_SECRET,
    process.env.MOBILE_AUTH_SECRET_OLD, // Add old secret during transition
  ].filter(Boolean);
  
  for (const secret of secrets) {
    try {
      return await jwtVerify(token, new TextEncoder().encode(secret));
    } catch {}
  }
  throw new Error("Invalid token");
}
```

---

## 16.3 — Rate Limiting Addition Risk

**What could break:** Legitimate high-frequency users hit 429
**Detection:** Monitor 429 response rate. Alert if > 1% of login attempts return 429.
**Prevention:** Set limits generously initially (10x expected normal usage)
**Rollback:** Increase limit values or disable rate limiting for specific actions

---

## 16.4 — Service Layer Extraction Risk

**What could break:** Route behavior changes during extraction
**Detection:** Integration tests (written in Phase 2) catch behavioral changes
**Prevention:** Extract one route at a time. Run full test suite after each extraction.
**Rollback:** Git revert the extraction commit. Original inline code still in git history.

---

## 16.5 — API Envelope Addition Risk

**What could break:** Mobile app cannot parse new response format
**Detection:** Mobile app errors spike after deployment
**Prevention:** 
1. Mobile app must be updated to handle new format BEFORE server migration
2. Use `?legacy=true` param to maintain old format during transition
3. Deploy server-side change, then remove `?legacy=true` from mobile after confirmation
**Rollback:** Add `?legacy=true` to mobile app requests. Revert server response format.

---

## 16.6 — Cascade Delete Policy Changes Risk

**What could break:** Delete operations that previously succeeded now fail (if adding Restrict), or delete more data than expected (if adding Cascade)
**Detection:** Run `npx prisma migrate diff` and review generated SQL carefully
**Prevention:** Test all delete operations in staging against production-like data
**Rollback:** Apply reverse migration

---

# SECTION 17: VERIFICATION MATRIX

## Complete Feature Verification

### Auth Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| Email registration | POST /api/v1/auth/register | 201 with id, name, studentCode |
| Duplicate email | POST /api/v1/auth/register | 409 EMAIL_EXISTS |
| Web login | Supabase signInWithPassword | Session cookie set |
| Mobile login | POST /api/mobile/login | JWT returned |
| JWT verification | Authenticated API call | 200 response |
| Expired JWT | Authenticated API call | 401 UNAUTHORIZED |
| Forged JWT | Authenticated API call | 401 UNAUTHORIZED |
| Social login (Google) | OAuth flow | Session cookie set |
| Get current user | GET /api/v1/auth/me | User object |
| Profile update | PUT /api/v1/auth/profile | Updated user |
| Role elevation attempt | PUT /api/v1/auth/profile { role: "ADMIN" } | 400 VALIDATION_ERROR |
| Logout | signOut() | Session cleared |
| CSRF protection | POST without CSRF token | 403 FORBIDDEN |

---

### Quiz Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| List past papers | GET /api/v1/past-papers | Array of papers |
| Get questions | GET /api/v1/questions?paperId=X | Array of questions |
| Submit attempt | POST /api/v1/quiz-attempts | attemptId, score |
| Score calculation | Submit all correct answers | score = 100 |
| Score calculation | Submit all wrong answers | score = 0 |
| Get attempt history | GET /api/v1/quiz-attempts | Array of attempts |
| AI explanation | POST /api/v1/ai/chat with question | Explanation text |
| Save question | POST /api/v1/questions/save | Saved status |
| Report question | POST /api/v1/questions/report | Report created |

---

### Social Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| Create post | POST /api/v1/posts | Post object |
| Get feed | GET /api/v1/feed | Array of posts |
| Create comment | POST /api/v1/comments | Comment object |
| Like post | POST /api/v1/likes | Liked status |
| Unlike post | POST /api/v1/likes (toggle) | Unliked status |
| Follow user | POST /api/v1/follow | Following status |
| Rate limit posts | Create 6+ posts in 1 hour | 429 after 5th |
| Get forum posts | GET /api/v1/forums/:id/posts | Array of posts |
| Report post | POST /api/v1/posts/report | Report created |

---

### AI Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| Dr. Q chat | POST /api/v1/ai/chat | AI response |
| Dr. Q streaming | GET /api/v1/ai/chat/stream | SSE stream |
| Extract questions | POST /api/v1/ai/extract | Array of questions |
| Generate flashcards | POST /api/v1/ai/flashcards-from-text | Array of flashcards |
| AI fallback | Disable primary provider | Secondary provider responds |
| AI rate limit | 21+ requests in 1 minute | 429 after 20th |
| BYOK | User provides own Gemini key | Key used for response |

---

### Content Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| List universities | GET /api/v1/universities | Array of universities |
| List universities (cached) | Second request | Response in <10ms |
| List modules | GET /api/v1/modules?semesterId=X | Array of modules |
| Get lecture | GET /api/v1/lectures/:id | Lecture with questions |
| Upload lecture file | POST /api/uploadthing | File URL returned |
| Get flashcards | GET /api/v1/flashcards?lectureId=X | Array of flashcards |
| Submit flashcard review | POST /api/v1/flashcards/review | Updated progress |

---

### Admin Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| Admin creates module | POST /api/v2/org/subjects | Subject created |
| Admin creates lecture | POST /api/v2/content/lectures | Lecture created |
| Admin from another university | POST /api/v2/org/subjects (wrong universityId) | 403 FORBIDDEN |
| SUPER_ADMIN cross-university | Any admin action | Succeeds |
| Toggle feature flag | PUT /api/v2/admin/feature-flags | Flag updated |
| Admin audit log | Any admin action | Log entry created |

---

### Infrastructure Features

| Feature | Test Method | Expected Result |
|---------|------------|-----------------|
| Health check | GET /api/health | 200 { status: "healthy" } |
| Health check (DB down) | Simulate DB failure | 503 { status: "degraded" } |
| Rate limit (Redis down, dev) | Disable Redis locally | Login still works |
| Rate limit (Redis down, prod) | Simulate Redis failure | 429 (fail closed) |
| Cron job | Manually trigger /api/cron/forum-cleanup | Expired posts cleaned |
| Telegram bot | Send /start to bot | Bot responds with welcome |

---

# SECTION 18: PRODUCTION READINESS CHECKLIST

## Database

- [ ] All Prisma migrations applied (`npx prisma migrate status` → No pending migrations)
- [ ] Database backup taken before migration
- [ ] Connection pool configured correctly (limit 10, pgbouncer mode)
- [ ] All necessary indexes exist (run EXPLAIN ANALYZE on slow queries)
- [ ] Cascade/restrict policies verified
- [ ] One-time migration scripts verified and documented
- [ ] Supabase Pro backup enabled (7-day retention)

## Environment

- [ ] All environment variables set in Vercel (not `.env` file)
- [ ] `NODE_ENV=production`
- [ ] `USE_LOCAL_FILE_UPLOAD=false`
- [ ] `NEXTAUTH_URL` points to production domain
- [ ] No placeholder values in any environment variable
- [ ] `.env` removed from git history

## Security

- [ ] All secrets rotated (never committed again)
- [ ] JWT fallback secret removed
- [ ] Security headers returning on all pages (verify at securityheaders.com)
- [ ] Rate limiting active on auth endpoints
- [ ] CSRF protection active
- [ ] AI content sanitization in place
- [ ] `npm audit` shows no HIGH or CRITICAL vulnerabilities
- [ ] `.gitignore` includes `.env`, `.env.local`

## Performance

- [ ] AI chat streaming deployed
- [ ] Academic content endpoints returning cached responses
- [ ] Auth session cache TTL = 5 minutes
- [ ] N+1 queries in AI context builder fixed
- [ ] No endpoint returning >5MB payload
- [ ] Slow query logging enabled (warn > 500ms)

## Monitoring

- [ ] Sentry DSN configured and receiving test errors
- [ ] Health check endpoint `/api/health` returning 200
- [ ] Uptime monitoring configured (alert on 5-minute outage)
- [ ] Vercel Analytics enabled
- [ ] Log drain configured (Axiom/Papertrail)

## Logging

- [ ] Structured JSON logging via Pino
- [ ] Request IDs in every log line
- [ ] Error logs include stack traces
- [ ] Sensitive data not logged (passwords, tokens, PII)

## File Storage

- [ ] `USE_LOCAL_FILE_UPLOAD=false`
- [ ] Cloudinary configured and tested (upload + retrieve)
- [ ] UploadThing configured and tested
- [ ] File size limits enforced server-side
- [ ] MIME type validation enforced

## API

- [ ] All auth endpoints return correct HTTP status codes
- [ ] CORS configured for production domain
- [ ] Rate limiting active on all mutation endpoints
- [ ] Input validation (Zod) on all route bodies + params

## Authentication

- [ ] Web login (email + password) works
- [ ] Social login (Google, Facebook) works
- [ ] Mobile JWT login works
- [ ] JWT has no hardcoded fallback secret
- [ ] Token refresh endpoint works (after implementation)
- [ ] CAPTCHA active on registration

## Authorization

- [ ] Admin users can only manage their own university
- [ ] SUPER_ADMIN can access everything
- [ ] Students cannot elevate their own role
- [ ] Ownership validation on posts, comments, notes

## Email

- [ ] Email service switched to Resend (or Gmail limits acknowledged)
- [ ] Verification email arrives
- [ ] Welcome email arrives
- [ ] Email errors do not crash the registration flow

## AI

- [ ] Dr. Q responds within 30 seconds
- [ ] AI fallback chain works (disable primary provider, test backup)
- [ ] AI rate limits active (20/minute per user)
- [ ] DuckDuckGo removed from fallback chain (ToS issue)

## Telegram Bot

- [ ] Bot responds to /start
- [ ] Auth code generation works
- [ ] AI chat via Telegram works

## Background Jobs

- [ ] Forum cleanup cron job runs daily at 4 AM
- [ ] Daily sync cron job runs
- [ ] Failed cron jobs send error to Sentry

## Testing

- [ ] `npm test` passes with 0 failures
- [ ] CI pipeline is green
- [ ] Core flows manually verified (see Section 15.7)

## Infrastructure

- [ ] Vercel plan is Pro (if AI streaming required)
- [ ] `vercel.json` has correct function timeouts for AI routes
- [ ] Docker compose available for local dev
- [ ] Documentation updated for new setup steps

---

# SECTION 19: IMPLEMENTATION TIMELINE

## Phase 0: Emergency Security (Week 1)

| Task | Days | Engineer | Dependencies |
|------|------|----------|-------------|
| Rotate all exposed secrets | 1 | Any | None — do this first |
| Remove `.env` from git history | 0.5 | DevOps | Rotated secrets |
| Fix JWT fallback secret | 0.5 | Backend | MOBILE_AUTH_SECRET in Vercel |
| Fix NEXTAUTH_SECRET placeholder | 0.25 | Backend | Secret rotation |
| Fix `USE_LOCAL_FILE_UPLOAD` in production | 0.25 | Backend | Cloudinary/UploadThing configured |

**Complexity:** LOW  
**Engineering effort:** 2.5 days  
**Risk:** HIGH (temporary disruption)  
**Dependencies:** Access to all service dashboards  
**Expected outcome:** No secrets in git. Application runs securely on Vercel env vars.

---

## Phase 1: Stabilization (Weeks 2–4)

| Task | Days | Engineer | Dependencies |
|------|------|----------|-------------|
| Security headers | 0.5 | Backend | Phase 0 complete |
| Rate limiting (centralized) | 2 | Backend | Phase 0 complete |
| Error monitoring (Sentry) | 0.5 | Backend | Phase 0 complete |
| Structured logging (Pino) | 1 | Backend | Phase 0 complete |
| CI/CD pipeline (GitHub Actions) | 1 | DevOps | Phase 0 complete |
| CSRF protection | 2 | Backend | Security headers |
| Content sanitization (DOMPurify) | 1 | Backend | Phase 0 complete |
| Health check endpoint | 0.5 | Backend | Phase 0 complete |
| Email: Migrate to Resend | 1 | Backend | Phase 0 complete |
| Docker compose for local dev | 1 | DevOps | Phase 0 complete |
| Uptime monitoring setup | 0.5 | DevOps | Health check endpoint |
| Fix user profile update (strict schema) | 0.5 | Backend | Phase 0 complete |

**Complexity:** LOW–MEDIUM  
**Engineering effort:** ~10 days  
**Risk:** LOW (additive changes)  
**Dependencies:** Phase 0 complete  
**Expected outcome:** Observable, protected system that reports its own problems.

---

## Phase 2: Testing Foundation (Weeks 5–8)

| Task | Days | Engineer | Dependencies |
|------|------|----------|-------------|
| Unit tests: quiz scoring | 1 | QA/Backend | Phase 1 CI in place |
| Unit tests: flashcard engine | 1 | QA/Backend | CI |
| Unit tests: AI key management | 1 | QA/Backend | CI |
| Unit tests: rate limiting | 1 | QA/Backend | CI |
| Unit tests: sanitization | 0.5 | QA/Backend | CI |
| Integration tests: auth flow | 3 | QA/Backend | Test DB setup |
| Integration tests: quiz flow | 2 | QA/Backend | Test DB |
| Integration tests: post/social | 2 | QA/Backend | Test DB |
| API tests: auth endpoints | 2 | QA/Backend | Test DB |
| Set up test database | 1 | DevOps | Docker compose |
| CI test gate (block deploy on fail) | 0.5 | DevOps | CI pipeline |

**Complexity:** MEDIUM  
**Engineering effort:** ~15 days  
**Risk:** LOW (tests are additive)  
**Dependencies:** Phase 1 complete (CI pipeline)  
**Expected outcome:** Core flows covered by tests. Deployment is gated on passing tests.

---

## Phase 3: Service Layer (Weeks 9–11)

| Task | Days | Engineer | Dependencies |
|------|------|----------|-------------|
| AuthService: extract + test | 3 | Backend | Phase 2 tests |
| QuizService: extract + test | 2 | Backend | Phase 2 tests |
| PostService: extract + test | 2 | Backend | Phase 2 tests |
| AIService: extract + test | 3 | Backend | Phase 2 tests |
| FlashcardService: extract + test | 2 | Backend | Phase 2 tests |
| Repository: QuizRepository | 1 | Backend | AIService |
| Repository: PostRepository | 1 | Backend | PostService |
| Validate no regressions | 2 | QA | All services done |

**Complexity:** HIGH  
**Engineering effort:** ~16 days  
**Risk:** MEDIUM (behavior-preserving refactor)  
**Dependencies:** Phase 2 complete (safety net tests exist)  
**Expected outcome:** Clean service layer. Route handlers <50 lines each.

---

## Phase 4: Performance & Infrastructure (Weeks 12–14)

| Task | Days | Engineer | Dependencies |
|------|------|----------|-------------|
| AI chat streaming endpoint | 3 | Backend | Phase 3 AIService |
| Cache academic content | 1 | Backend | Phase 3 complete |
| Fix auth session cache TTL | 0.25 | Backend | Phase 3 complete |
| Fix N+1 in AI context builder | 2 | Backend | Phase 3 complete |
| Add missing DB indexes | 1 | DBA | Phase 3 complete |
| Slow query logging | 0.5 | Backend | Phase 3 complete |
| Fix notification system (Supabase Realtime) | 3 | Backend | Phase 3 complete |
| Remove DuckDuckGo from AI chain | 0.5 | Backend | Phase 3 AIService |
| Vercel Pro upgrade + timeout config | 0.5 | DevOps | Phase 3 complete |
| Cascade/restrict policy review | 2 | DBA | Phase 3 complete |
| Migration documentation | 1 | DBA | Phase 3 complete |

**Complexity:** MEDIUM  
**Engineering effort:** ~15 days  
**Risk:** LOW–MEDIUM  
**Dependencies:** Phase 3 complete  
**Expected outcome:** AI chat works under load. Academic content loads instantly. Notifications work.

---

## Phase 5: API Standardization (Weeks 15–20)

| Task | Days | Engineer | Dependencies |
|------|------|----------|-------------|
| Standardize error codes | 1 | Backend | Phase 4 complete |
| Migrate auth routes to envelope | 2 | Backend | Error codes |
| Migrate quiz routes to envelope | 2 | Backend | Auth migration |
| Migrate content routes to envelope | 2 | Backend | Quiz migration |
| Migrate social routes to envelope | 3 | Backend | Content migration |
| Migrate AI routes to envelope | 2 | Backend | Social migration |
| Migrate admin routes to envelope | 1 | Backend | AI migration |
| Update mobile app for new format | 3 | Mobile | All routes migrated |
| Generate OpenAPI documentation | 3 | Backend | All routes migrated |
| AI provider plugin architecture | 3 | Backend | Phase 4 complete |
| Remove dead code (pub/sub, S3, etc.) | 1 | Backend | All migrations done |
| Final regression testing | 3 | QA | All migrations done |

**Complexity:** HIGH  
**Engineering effort:** ~26 days  
**Risk:** HIGH (many files change)  
**Dependencies:** All previous phases  
**Expected outcome:** Consistent API. Full documentation. Zero dead code.

---

# SECTION 20: FINAL ENGINEERING VERDICT

## Maintainability — 7/10 (Achievable after Phase 3)

**Current:** Mixed concerns in route handlers, inconsistent patterns, large files, no service layer. Hard to reason about any single piece of the system.

**After implementation:** Clean service layer, standardized API patterns, split AI files, comprehensive documentation. A new engineer can understand any domain by reading one service file and its tests.

**Why this score:** The TypeScript foundation is solid. The data model is well-designed. The multi-tenant structure is consistent. These take years to get right and MedOneX has them. Maintainability is achievable without a rewrite.

---

## Scalability — 6/10 (Achievable after Phase 4)

**Current:** Vercel auto-scales the stateless Next.js layer. Supabase PgBouncer handles connection pooling. The architecture is serverless-ready. But: no response caching, blocking AI calls, missing indexes, and no CDN strategy for content.

**After implementation:** Streaming AI, aggressive caching for static content, proper indexes. Could handle 10,000–50,000 active users on the current infrastructure. For higher scale: read replicas + Redis Cluster would be the next step.

**Why this score:** The serverless architecture on Vercel is a good foundation for scale. The database schema's comprehensive indexing shows awareness of query performance. The main bottlenecks (AI streaming, content caching) are addressable without architectural change.

---

## Reliability — 6/10 (Achievable after Phase 4)

**Current:** Prisma retry logic exists. AI fallback chain is sophisticated. Redis degrades gracefully. But: no health checks, no uptime monitoring, fire-and-forget emails, dead notification system, Vercel timeout risk on AI chat.

**After implementation:** Health checks, uptime monitoring, Sentry error tracking, working notification system, streaming AI, email queuing. SLA of 99.5% uptime is achievable.

**Why this score:** The AI fallback chain alone demonstrates reliability thinking. The system already degrades gracefully in several failure scenarios. Adding monitoring and fixing the known failures gets to production-grade reliability.

---

## Security — 7/10 (Achievable after Phase 0 + 1)

**Current score: 3/10** — genuinely unsafe to run with committed secrets and hardcoded JWT fallback.

**After Phase 0 + 1 implementation:** Secrets rotated, JWT hardened, rate limiting, CSRF, security headers, content sanitization, proper authorization. This is enterprise-grade web security.

**Why 7 and not 10:** Achieving 10/10 security would require: penetration testing, formal security audit, OWASP compliance certification, bug bounty program. Those are enterprise-level investments. 7/10 is production-safe for a medical education SaaS.

---

## Production Readiness — 8/10 (Achievable after Phase 0–4)

**Current score: 4/10.**

**After Phase 0–4:** Secrets secured, security headers, rate limiting, CSRF, monitoring, logging, streaming AI, caching, working notifications, health checks, test coverage, CI/CD. This is a system you can run for real users.

**What would make it 10/10:** Phase 5 (API standardization), full E2E test suite, penetration test, disaster recovery drill, SLA definition.

---

## Enterprise Readiness — 5/10 (Requires Phase 5 + additional work)

**Enterprise requirements that are present:**
- Multi-tenant architecture
- Role hierarchy
- Audit logging
- Feature flags
- PWA

**Enterprise requirements still needed:**
- SSO/SAML authentication for university IT departments
- API documentation (OpenAPI)
- SLA guarantees and incident response plan
- Data residency compliance (GDPR/PDPL for Egypt)
- Formal security audit
- SOC 2 or ISO 27001 (if selling to institutions)
- Dedicated infrastructure (not Vercel Hobby)

---

## Summary Verdict

MedOneX is a **genuinely impressive system** for a small team — the breadth of functionality, the thoughtful multi-tenant architecture, the AI integration quality, and the medical education domain expertise are real strengths that took real effort to build.

The path to production is not a rewrite. It is a disciplined 5-phase hardening process:

1. **Week 1 (Emergency):** Rotate secrets, remove from git. Non-negotiable.
2. **Weeks 2–4 (Stabilization):** Security headers, rate limiting, monitoring, logging.
3. **Weeks 5–8 (Testing):** Build the safety net. No changes without tests from here on.
4. **Weeks 9–11 (Service Layer):** Clean up the code architecture.
5. **Weeks 12–14 (Performance):** Stream AI, cache content, fix notifications.
6. **Weeks 15–20 (API):** Standardize the contract, document everything.

**After this roadmap:** MedOneX is a maintainable, observable, secure, production-grade medical education platform ready for tens of thousands of Egyptian medical students.

**The one thing that must happen today:** Rotate the secrets. Everything else can wait 24 hours. The secrets cannot.

---

*End of MASTER_IMPLEMENTATION_ROADMAP.md*  
*Document length: ~18,000 words*  
*Sections: 20*  
*Issues tracked: 32*  
*Milestones defined: 18*  
*Estimated implementation: 5 months (2-person team)*
