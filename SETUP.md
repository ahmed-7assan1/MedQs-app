# MedQs — Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- pnpm (recommended) or npm

---

## 1. Clone and Install

```bash
git clone <your-repo>
cd medqs-app
pnpm install
```

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

### Required variables:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for dev |
| `GOOGLE_CLIENT_ID/SECRET` | [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0 |
| `FACEBOOK_CLIENT_ID/SECRET` | [Facebook Developers](https://developers.facebook.com) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) — **free, no credit card** |

### Google OAuth Setup
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Facebook OAuth Setup
1. Go to Facebook Developers → Create App
2. Add Facebook Login product
3. Add Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`

---

## 3. Database Setup

```bash
# Push schema to database
pnpm db:push

# Or use migrations (production):
pnpm db:migrate

# Seed with demo data
pnpm db:seed
```

The seed creates:
- Cairo Medical University with 2 years, 3 semesters
- Anatomy module with a demo lecture, 2 questions, 3 flashcards
- A past paper (interactive, 60 min)
- 2 forums (Global + Semester)
- 5 rank tiers (Newbie → Elite)
- Default site config

---

## 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll be redirected to `/login`. Sign in with Google or Facebook.

---

## 5. Make Yourself Admin

After signing in, run this in psql or Prisma Studio:

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
```

Or via Prisma Studio:
```bash
pnpm db:studio
```

Then visit `/admin/dashboard`.

---

## 6. File Storage (Optional)

For lecture file uploads, configure Cloudflare R2 or AWS S3:

```env
S3_BUCKET=medqs-uploads
S3_REGION=auto
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

Upload endpoint pattern for lecture files:
`POST /api/v1/lectures/:id/files` (multipart/form-data)

---

## 7. Google Sheets Export (Optional)

1. Create a Google Cloud Service Account
2. Share your target spreadsheet with the service account email
3. Set env vars:
   ```env
   GOOGLE_SHEETS_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...",...}'
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   ```
4. Use admin export: `GET /api/v1/admin/export?type=quiz`

---

## 8. Production Deployment

### Vercel (recommended)

```bash
pnpm build
vercel deploy
```

Set all env vars in Vercel dashboard. Use:
- **Neon** or **Supabase** for PostgreSQL
- **Upstash** for Redis (serverless-compatible)

### Self-hosted (Docker)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 9. Project Structure

```
src/
├── app/
│   ├── (auth)/login          # Login page
│   ├── (student)/            # Student routes (auth-guarded)
│   │   ├── dashboard         # Overview + stats
│   │   ├── modules           # Content browser
│   │   ├── past-papers       # Paper list
│   │   ├── quiz/[paperId]    # Timed quiz engine
│   │   ├── forum             # Forums
│   │   ├── profile/[userId]  # User profile
│   │   ├── leaderboard       # Rankings
│   │   └── space             # Pomodoro + Spotify
│   ├── (admin)/admin/        # Admin routes (role-guarded)
│   │   ├── dashboard         # Stats overview
│   │   ├── content           # University/semester tree
│   │   ├── questions         # Question management
│   │   ├── ai-tools          # Manual + PDF AI tools
│   │   ├── forum             # Forum controls
│   │   ├── users             # User management
│   │   └── settings          # Site config + broadcast
│   └── api/v1/               # All API routes
├── components/               # Reusable React components
├── lib/                      # prisma, openai, redis, auth, engagement, sheets
└── types/                    # Shared TypeScript types
```

---

## 10. Key Architectural Decisions

### No-flicker theme
A `beforeInteractive` script in `<head>` reads `localStorage('medqs-theme')` and sets `data-theme` on `<html>` before first paint. Tailwind's `dark:` prefix handles the rest.

### AI explanation caching
`question.explanation` (admin-written) > `question.aiExplanation` (AI-generated, cached in DB) > fresh Gemini call. Redis caches for 1 hour per question.

### Engagement rate limiting
Redis counters with 1-hour TTL per user per action type. Limits: post=5, comment=10, like=20, share=5 per hour.

### Semester filtering
Every content query filters by `user.semesterId`. Students only see content from their semester. Changing semester updates the `User` record — no session change required.

### WebSocket alternative
The current implementation uses 30-second polling for notifications. For true real-time, add Pusher/Ably or a separate WebSocket server and update `NotificationsLoader.tsx`.

---

## API Reference Summary

| Area | Route | Notes |
|---|---|---|
| Auth | `PUT /api/v1/auth/profile` | Update name, bio, phone, semester |
| Auth | `POST /api/v1/auth/avatar` | Upload profile photo |
| Auth | `GET /api/v1/auth/me` | Current user data |
| Content | `GET /api/v1/universities` | List universities |
| Content | `GET /api/v1/semesters` | List semesters |
| Content | `GET /api/v1/modules-all` | All modules |
| Content | `GET /api/v1/subjects-all` | All subjects |
| Lectures | `GET/POST /api/v1/subjects/:id/lectures` | List / create |
| Lectures | `POST /api/v1/lectures/:id/files` | Upload lecture file |
| Questions | `GET/POST /api/v1/questions` | List / create |
| Questions | `GET /api/v1/questions/:id/explain` | AI explanation (cached) |
| Questions | `POST /api/v1/questions/bulk` | Bulk create |
| AI | `POST /api/v1/ai/suggest` | Manual question AI assist (20/hr) |
| AI | `POST /api/v1/ai/extract` | PDF → questions (5/hr) |
| Past Papers | `GET/POST /api/v1/past-papers` | List / create |
| Past Papers | `DELETE /api/v1/past-papers/:id` | Delete |
| Attempts | `POST /api/v1/past-papers/:id/attempt` | Submit quiz |
| Attempts | `GET /api/v1/quiz-attempts/:id` | Retrieve result |
| Forums | `GET/POST /api/v1/forums` | List / create |
| Posts | `GET/POST /api/v1/forums/:id/posts` | Validated, rate-limited |
| Posts | `DELETE /api/v1/posts/:id` | Owner or admin |
| Comments | `GET/POST /api/v1/posts/:id/comments` | Validated, rate-limited |
| Comments | `DELETE /api/v1/comments/:id` | Owner or admin |
| Notifications | `GET /api/v1/notifications` | All for current user |
| Notifications | `PUT /api/v1/notifications/mute` | Update mute settings |
| Engagement | `POST /api/v1/engagement` | Log action + points |
| Leaderboard | `GET /api/v1/leaderboard` | Top 50 by semester |
| Ads | `GET /api/v1/ads/active` | Active banner for session |
| Upload | `POST /api/v1/upload/presign` | Get S3 presigned URL |
| Admin | `GET /api/v1/admin/config` | Site config |
| Admin | `PUT /api/v1/admin/config` | Update branding/toggles |
| Admin | `GET /api/v1/admin/export` | Export to Google Sheets |
| Admin | `PUT /api/v1/admin/users/:id/role` | Change user role |
