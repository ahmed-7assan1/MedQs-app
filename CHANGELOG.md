# MedQs — Full Build Changelog

## Final Stats
- **122 source files** (TypeScript/TSX)
- **25 pages** (student + admin + auth)
- **50 API routes**
- **16 React components**
- **9 lib modules**
- **Zero OpenAI dependency** — 100% Gemini Flash (free)

---

## Session 1 — Architecture & Schema
- Prisma schema with 22 models
- API design document (60+ endpoints)
- Component structure document
- Tech stack: Next.js 14, Tailwind, Shadcn, Prisma, Redis, Gemini

## Session 2 — Core Application
- `lib/prisma.ts` — singleton client
- `lib/gemini.ts` — AI functions (explain, suggest, extract, validate)
- `lib/redis.ts` — rate limiting + pub/sub
- `lib/auth.ts` — NextAuth v5 with Google + Facebook
- `lib/engagement.ts` — points, ranks, anti-spam
- `lib/store.ts` — Zustand (theme, notifications, quiz state)
- `lib/utils.ts` — cn(), formatDistanceToNow(), formatScore()
- Root layout with no-flicker theme script
- Global CSS with DM Sans/Serif/Mono fonts
- Tailwind config with MedQs brand colors
- All 50 API routes scaffolded

## Session 3 — Student Pages
- `/login` — Google + Facebook OAuth
- `/register` — 3-step semester selector (new users)
- `/dashboard` — stats, rank progress, recent attempts, quick actions
- `/modules` — module/subject/lecture tree filtered by semester
- `/modules/[moduleId]/[lectureId]` — video + flashcards + questions
- `/past-papers` — paper list with attempt history + View Result links
- `/quiz/[paperId]` — timed quiz engine
- `/quiz/attempt/[attemptId]` — attempt result with full review
- `/forum` — tabbed forums with post/like/share
- `/leaderboard` — podium display + ranked list
- `/space` — Pomodoro timer + Spotify embed
- `/profile/[userId]` — profile with rank progress + Edit button
- `/profile/edit` — avatar upload, bio, phone, semester switch, theme

## Session 4 — Components
- `QuestionCard` — MCQ with explain button (AI on demand)
- `QuizClient` — timed quiz, redirects to attempt result on submit
- `FlashcardDeck` — 3D flip animation
- `PostCard` — likes, share, integrated CommentThread
- `CommentThread` — expandable inline thread with add/delete
- `ForumClient` — tabbed forums, compose, live post list
- `Navbar` — theme toggle, notification bell, user dropdown with all links
- `NotificationPanel` — mark read, mark all, channel icons
- `NotificationsLoader` — 30s polling, updates Zustand store
- `FileList` — lecture file display with MIME icons
- `FileUploader` — drag-drop, presigned URL upload, progress bar
- `AdBannerModal` — sessionStorage gate, one-time per session
- `GeminiBanner` — free tier info on AI tools page
- `ExportPanel` — Google Sheets export with live feedback
- `UsersTable` — paginated, searchable, role toggle, delete
- Skeletons: Dashboard, Modules, Forum, Quiz, Past Papers, Leaderboard, Space

## Session 5 — Admin Panel (10 pages)
- `/admin/dashboard` — platform stats + recent signups + quick nav
- `/admin/content` — university→year→semester→module→subject tree (inline add)
- `/admin/lectures` — create lectures with video + flashcards
- `/admin/past-papers` — create/upload/delete past papers with S3 PDF upload
- `/admin/questions` — searchable question table with expand/delete
- `/admin/ai-tools` — manual assist + PDF extractor with Gemini banner
- `/admin/forum` — create/status control/delete forums
- `/admin/users` — paginated users, role toggle, delete
- `/admin/ads` — create/toggle/delete ad banners with image upload
- `/admin/settings` — branding, feature toggles, broadcast, Google Sheets export

## Session 6 — Infrastructure & Polish
- `lib/storage.ts` — S3/R2 presigned uploads, direct server-side upload
- `lib/sheets.ts` — Google Sheets export via service account JWT
- `lib/gemini.ts` — replaced OpenAI with Google Gemini 2.0 Flash (free)
- `prisma/seed.ts` — 2 universities, 3 semesters, 2 modules, 4 questions, 5 flashcards
- Error pages: `not-found.tsx`, `global-error.tsx`, `(student)/error.tsx`, `(admin)/error.tsx`
- Loading pages for all major routes (7 skeletons)
- Middleware with new-user redirect to `/register`
- `.env.example` fully documented with setup instructions

## Session 7 — Final Features & Fixes
- Switched from OpenAI → **Google Gemini 2.0 Flash** (free, no billing)
- Forum comment thread fully wired (expand inline, add, delete)
- `DELETE /api/v1/comments/:commentId` with owner + admin guard
- Admin past papers CRUD page with S3 PDF upload
- `DELETE /api/v1/past-papers/:id`
- `GET /api/v1/quiz-attempts/:attemptId` — retrieve past result
- `/quiz/attempt/:id` — dedicated result page with full review
- Past papers page: shows attempt history chips with View Result links
- QuizClient: redirects to result page after submit (no inline)
- `/notifications/settings` — mute all / mute forum toggles
- Notification settings link in Navbar dropdown
- Rate limiting on AI routes (20 suggest/hr, 5 extract/hr)
- Zod validation on forum posts (max 5000 chars) + rate limit (10/hr)
- Zod validation on comments (max 1000 chars) + rate limit (20/hr)
- `GET /api/v1/ranks` — list all rank tiers
- `GET /api/v1/users/:userId/rank` — user rank info
- Admin sidebar: Past Papers link added (10 total nav items)
- Seed file: rank IDs fixed to match engagement service labels
- `SETUP.md` updated: Gemini setup instructions

---

## Quick Start
```bash
git clone <repo> && cd medqs-app
cp .env.example .env.local
# Fill: DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
# Fill: GOOGLE_CLIENT_ID/SECRET, FACEBOOK_CLIENT_ID/SECRET
# Fill: GEMINI_API_KEY  ← free at aistudio.google.com

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Then: open Prisma Studio → find your user → set `role` to `SUPER_ADMIN` → visit `/admin/dashboard`.

---

## Environment Variables Summary
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL |
| `REDIS_URL` | ✅ | Redis / Upstash |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | ✅ | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | ✅ | Facebook Developers |
| `FACEBOOK_CLIENT_SECRET` | ✅ | Facebook Developers |
| `GEMINI_API_KEY` | ✅ | aistudio.google.com — **free** |
| `S3_BUCKET` | Optional | File uploads (Cloudflare R2 or AWS S3) |
| `S3_REGION` | Optional | `auto` for R2 |
| `S3_ACCESS_KEY` | Optional | S3 credentials |
| `S3_SECRET_KEY` | Optional | S3 credentials |
| `S3_ENDPOINT` | Optional | R2 endpoint URL |
| `S3_PUBLIC_URL` | Optional | CDN/public base URL |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT` | Optional | JSON string |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Optional | For export feature |
