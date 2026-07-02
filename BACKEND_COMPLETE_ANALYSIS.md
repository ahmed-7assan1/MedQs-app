# MedOneX (MedQs) — Complete Backend Analysis

> **Generated:** 2026-06-29
> **Project:** medqs v0.1.0
> **Framework:** Next.js 14.2.5 (App Router)
> **Database:** PostgreSQL via Prisma ORM (Supabase)
> **Deployment:** Vercel + Supabase + Upstash Redis + Cloudflare Workers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Structure](#2-project-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Dependency Graph](#5-dependency-graph)
6. [Folder-by-Folder Analysis](#6-folder-by-folder-analysis)
7. [File-by-File Analysis — Core Files](#7-file-by-file-analysis--core-files)
8. [Database Analysis](#8-database-analysis)
9. [ORM Analysis](#9-orm-analysis)
10. [Authentication](#10-authentication)
11. [Authorization](#11-authorization)
12. [API Analysis](#12-api-analysis)
13. [Business Logic](#13-business-logic)
14. [Request Lifecycle](#14-request-lifecycle)
15. [Services](#15-services)
16. [Controllers](#16-controllers)
17. [Middleware](#17-middleware)
18. [Utilities](#18-utilities)
19. [Configuration](#19-configuration)
20. [Security Audit](#20-security-audit)
21. [Performance Audit](#21-performance-audit)
22. [Caching](#22-caching)
23. [Logging](#23-logging)
24. [Error Handling](#24-error-handling)
25. [Background Jobs](#25-background-jobs)
26. [Storage](#26-storage)
27. [Realtime](#27-realtime)
28. [Infrastructure](#28-infrastructure)
29. [Testing](#29-testing)
30. [Code Quality](#30-code-quality)
31. [Dependency Audit](#31-dependency-audit)
32. [Execution Flow](#32-execution-flow)
33. [Architecture Diagrams](#33-architecture-diagrams)
34. [Improvement Roadmap](#34-improvement-roadmap)
35. [Overall Engineering Score](#35-overall-engineering-score)

---

# 1. Executive Summary

## What This Backend Is

MedOneX (codename: MedQs) is a **full-stack medical education platform** — a monolithic Next.js application that serves as both a web application and an API backend for a mobile app. It is designed for medical students across Egypt and the Middle East.

## Main Purpose

Provide a comprehensive digital learning ecosystem for medical students including:
- AI-powered tutoring (Dr. Q, powered by Google Gemini with multi-provider fallback)
- Academic content management (lectures, modules, subjects, past papers, quizzes)
- Social/community features (Instagram-style feed, forums, groups, direct messaging)
- Gamification (points, ranks, leaderboard)
- Study tools (flashcards with spaced repetition, study rooms with Pomodoro timer, notebooks)
- Anatomy atlas with 3D models
- Telegram bot integration for AI, auth, and content delivery
- Multi-tenant architecture (per-university data scoping)
- 16 theme variants with light/dark mode
- PWA with full offline support
- Mobile API (separate Expo app consuming the same backend)

## Overall Architecture

**Pattern:** Monolithic Next.js App Router with a REST API layer (V1 and V2 API contracts)

The architecture follows a **layered monolith** pattern:
- **Presentation Layer:** Next.js pages and React Server Components
- **API Layer:** Route handlers under `/api/v1/` and `/api/v2/`
- **Auth Layer:** Supabase Auth + custom JWT middleware
- **Service Layer:** Business logic in `src/lib/` modules
- **Data Layer:** Prisma ORM → PostgreSQL (Supabase)

It is NOT a clean architecture or DDD — it is a pragmatic Next.js monolith with some V2 modules attempting to introduce cleaner patterns.

## Technology Stack (High-Level)

| Category | Choice |
|----------|--------|
| **Runtime** | Node.js 20+ (Next.js 14.2.5) |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | PostgreSQL 15 (Supabase) |
| **ORM** | Prisma 5.17.0 |
| **Auth** | Supabase Auth (SSR) + Custom JWT (mobile) |
| **Cache** | Upstash Redis (ioredis) |
| **AI** | Google Gemini, Groq, DeepSeek, OpenAI, Anthropic, DuckDuckGo, SiliconFlow |
| **File Storage** | Cloudinary (images) + UploadThing (PDFs) + Local disk (dev) |
| **Email** | Nodemailer + Gmail SMTP |
| **Push** | Web Push API + Firebase Cloud Messaging |
| **Realtime** | Redis Pub/Sub |
| **CI/CD** | Vercel |
| **Testing** | Vitest |
| **Container** | None (Vercel serverless) |

## Development Quality

**Strengths:**
- Feature-rich with practical, real-world medical education functionality
- Sophisticated AI routing with multi-provider fallback chain
- Well-designed telegram bot integration
- Multi-tenant awareness built into the data layer
- PWA with comprehensive service worker caching strategy
- 16-theme design system with CSS variables
- Good use of Prisma features (transactions, composite indexes, cascading deletes)
- Separation of repositories layer for data access

**Weaknesses:**
- No automated tests (only 3 unit test files found)
- V1 API has no standardized response envelope
- AI API keys hardcoded in `.env` file committed to repository
- No Docker containerization for local development
- Huge Prisma schema (2803 lines, ~95 models) — schema bloat
- V1 and V2 API patterns coexist inconsistently
- Some logic duplicated across route handlers
- No rate limiting on most endpoints
- Supabase service role key in `.env`
- Minimal monitoring and observability
- No database migration documentation beyond Prisma
- Mixed concerns in route handlers (business logic + data access + response formatting)

---

# 2. Project Structure

## Complete Tree

```
medqs-app/
├── prisma/
│   ├── schema.prisma              # 2803-line database schema (~95 models)
│   ├── schema.v2.core.prisma      # V2 core schema fragment
│   ├── schema.v2.university.prisma# V2 university schema fragment
│   ├── migrations/                # Prisma migration files
│   ├── seed.ts                    # Database seeding script
│   ├── append-models.js           # Utility script
│   ├── backfill-forum-university.ts
│   └── migrate-faculties.ts
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (site config, providers, SEO)
│   │   ├── page.tsx               # Landing page
│   │   ├── middleware.ts           # (at root, not inside src/)
│   │   ├── (admin)/               # Admin route group
│   │   ├── (auth)/                # Auth route group
│   │   ├── (chat)/                # AI chat route group
│   │   ├── (social)/              # Social route group
│   │   ├── (student)/             # Student route group
│   │   ├── (student-clean)/       # Clean student dash route group
│   │   ├── api/
│   │   │   ├── v1/                # 69 route groups (legacy API)
│   │   │   ├── v2/                # 9 route groups (new API contract)
│   │   │   ├── mobile/            # Mobile app API
│   │   │   ├── telegram/          # Telegram webhook
│   │   │   ├── cron/              # Cron job endpoints
│   │   │   ├── uploadthing/       # File upload endpoint
│   │   │   ├── tts/              # Text-to-speech
│   │   │   └── og/               # Open Graph generation
│   │   ├── auth/                  # Auth callback pages
│   │   └── ...                    # Other page routes
│   │
│   ├── lib/                       # Core libraries (94 files)
│   │   ├── prisma.ts              # Prisma singleton client
│   │   ├── auth.ts                # Auth session resolution
│   │   ├── auth-middleware.ts     # Route auth wrappers (withAuth, withAdmin, etc.)
│   │   ├── tenant.ts              # Multi-tenant scope resolution
│   │   ├── redis.ts               # Redis client + rate limiting + pub/sub
│   │   ├── ai-router.ts           # AI provider routing with fallback
│   │   ├── gemini.ts              # Gemini AI integration (question gen, grading)
│   │   ├── gemini-keys.ts         # Gemini API key management with quota tracking
│   │   ├── gemini-model-chain.ts  # Model fallback chain config
│   │   ├── storage.ts             # File storage abstraction (S3/Cloudinary/Local)
│   │   ├── email.ts               # Email service (Nodemailer + Gmail)
│   │   ├── uploadthing.ts         # UploadThing file router
│   │   ├── cloudinary.ts          # Cloudinary image upload
│   │   ├── themes.ts              # 16 theme variant definitions
│   │   ├── utils.ts               # Utility functions (cn, formatDistance, etc.)
│   │   ├── store.ts               # Zustand stores (theme, notif, quiz, audio, etc.)
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   ├── server.ts          # Server Supabase client
│   │   │   ├── middleware.ts      # Supabase SSR middleware for cookies
│   │   │   └── admin.ts           # Admin Supabase client (service role)
│   │   ├── firebase/
│   │   │   ├── config.ts          # Firebase config
│   │   │   ├── admin.ts           # Firebase Admin SDK
│   │   │   ├── messaging.ts       # Firebase Cloud Messaging
│   │   │   ├── firestore.ts       # Firestore integration
│   │   │   └── realtime-service.ts
│   │   ├── telegram-bot/
│   │   │   ├── index.ts           # Telegram bot (Telegraf)
│   │   │   ├── start.ts           # /start command
│   │   │   ├── auth.ts            # Auth handlers
│   │   │   ├── ai.ts              # AI chat handlers
│   │   │   ├── contact.ts         # Contact handlers
│   │   │   ├── group.ts           # Group handlers
│   │   │   └── modules.ts         # Module listing handlers
│   │   ├── repositories/
│   │   │   ├── auth.repository.ts # Auth data access
│   │   │   └── user.repository.ts # User data access
│   │   ├── validation/
│   │   │   ├── index.ts           # Barrel export
│   │   │   ├── schemas.ts         # Shared Zod schemas
│   │   │   ├── auth.ts            # Auth validation
│   │   │   ├── quiz.ts            # Quiz validation
│   │   │   ├── forum.ts           # Forum validation
│   │   │   ├── flashcard.ts       # Flashcard validation
│   │   │   ├── study.ts           # Study validation
│   │   │   ├── report.ts          # Report validation
│   │   │   └── admin.ts           # Admin validation
│   │   └── ... (60+ additional files)
│   │
│   ├── platform/                  # Platform-level infrastructure
│   │   ├── api/
│   │   │   ├── envelope.ts        # Standardized API response format
│   │   │   ├── guards.ts          # Tenant session guards
│   │   │   ├── idempotency.ts     # Idempotency support
│   │   │   └── v2-contract.ts     # V2 contract definitions
│   │   ├── dev-auth.ts            # Dev bypass for CLI testing
│   │   ├── events/
│   │   ├── flags.ts               # Feature flags
│   │   ├── policy/
│   │   ├── tenant/
│   │   │   └── tenant-resolver.ts # Tenant context resolver
│   │   └── v2-toggle.ts           # V2 version toggle
│   │
│   ├── components/                # React components (39 subdirectories)
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom hooks
│   ├── i18n/                      # Internationalization (en, ar)
│   ├── modules/                   # V2 domain modules
│   │   ├── ai/
│   │   ├── assessment/
│   │   ├── content/
│   │   ├── identity/
│   │   ├── marketplace/
│   │   ├── org/
│   │   ├── social/
│   │   └── study-space/
│   ├── styles/                    # CSS files
│   ├── types/                     # TypeScript type definitions
│   ├── ui/                        # Design system
│   └── vendor/                    # Third-party vendor assets
│
├── middleware.ts                  # Next.js middleware (auth routing)
├── next.config.js                 # Next.js config + PWA
├── tailwind.config.ts             # Tailwind config
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript config
├── .env                           # Environment variables (COMMITTED!)
├── .env.example                   # Environment template
├── .eslintrc.json                 # ESLint config
├── vitest.config.ts               # Vitest config
├── vercel.json                    # Vercel deployment + cron
├── app.json                       # Expo config
├── eas.json                       # Expo EAS config
├── capacitor.config.ts            # Capacitor config
│
├── public/                        # Static assets
│   ├── uploads/                   # Local file uploads
│   ├── sw.js / workbox-*.js       # PWA service worker
│   ├── firebase-messaging-sw.js   # Firebase messaging SW
│   └── templates/                 # Document templates
│
├── telegram-worker/               # Cloudflare Telegram Worker
├── temp-proxy/                    # Telegram Media Proxy
├── medqs-mobile/                  # Separate Expo mobile app
│
├── scripts/                       # Utility scripts
├── scratch/                       # Testing scripts
├── docs/                          # Documentation
└── tools/                         # Python Colab tools
```

## Folder Explanation

| Folder | Purpose | Dependencies | Criticality |
|--------|---------|-------------|-------------|
| `prisma/` | Database schema, migrations, and seed | Defines ALL data models | **CRITICAL** — used by every service |
| `src/app/` | Next.js App Router pages + API routes | Everything else | **CRITICAL** — entry point for all requests |
| `src/app/api/v1/` | Legacy REST API (69 route groups) | `src/lib/*`, `prisma` | **CRITICAL** — most endpoints here |
| `src/app/api/v2/` | New standardized API (9 route groups) | `src/platform/*`, `src/lib/*` | **GROWING** — V2 migration target |
| `src/lib/` | Core libraries and services | All application logic | **CRITICAL** — heart of the backend |
| `src/platform/` | Platform-level infrastructure | `src/lib/*` | **HIGH** — V2 patterns and guards |
| `src/modules/` | V2 domain modules (contracts only) | None yet (future) | **LOW** — mostly placeholder interfaces |
| `src/lib/repositories/` | Data access layer | `prisma` | **HIGH** — encapsulates DB queries |
| `src/lib/validation/` | Zod schemas | `zod` | **HIGH** — input validation |
| `src/lib/supabase/` | Supabase client config | `@supabase/ssr` | **CRITICAL** — auth foundation |
| `src/lib/telegram-bot/` | Telegram bot handlers | `telegraf` | **HIGH** — bot integration |
| `src/styles/` | Global CSS and themes | Tailwind | **MEDIUM** — UI only |
| `public/` | Static assets and uploads | N/A | **MEDIUM** — serves uploaded files |
| `scripts/` | Admin/utility scripts | Varies | **LOW** — one-time use |

---

# 3. Technology Stack

## Complete Inventory

| Category | Technology | Version | Purpose | Risk |
|----------|-----------|---------|---------|------|
| **Runtime** | Node.js | 20+ | JavaScript runtime | Low |
| **Framework** | Next.js | 14.2.5 | Web framework + API | Low |
| **Language** | TypeScript | 5.x | Type safety | Low |
| **UI** | React | 18.x | Frontend | Low |
| **Database** | PostgreSQL (Supabase) | 15 | Primary data store | Low |
| **ORM** | Prisma | 5.17.0 | Database ORM | Low |
| **Auth (Web)** | Supabase SSR Auth | 0.12.0 | Session management | Medium |
| **Auth (Mobile)** | Custom JWT (jose) | 6.2.3 | Mobile token auth | Low |
| **Auth (OAuth)** | Google, Facebook | — | Social login | Low |
| **Cache** | Upstash Redis (ioredis) | 5.4.1 | Rate limiting, session cache, pub/sub | Medium |
| **AI (Primary)** | Google Gemini | 0.21.0 | AI chat, question gen, grading | Medium |
| **AI (Fallback)** | Groq, DeepSeek, OpenAI, Anthropic, SiliconFlow, DuckDuckGo | Various | AI resilience | Medium |
| **File Storage (Images)** | Cloudinary | 2.9.0 | Image CDN | Low |
| **File Storage (Docs)** | UploadThing | 7.7.4 | PDF/document storage | Low |
| **File Storage (Local)** | Disk (public/uploads/) | — | Dev file storage | High (ephemeral on Vercel) |
| **Email** | Nodemailer + Gmail SMTP | 7.0.13 | Transactional emails | Low |
| **Push Notifications** | Web Push API + Firebase Cloud Messaging | 12.13.0 | Browser push | Low |
| **Realtime** | Redis Pub/Sub | — | Notification broadcasting | Low |
| **Telegram Bot** | Telegraf | 4.16.3 | Bot integration | Low |
| **Video Player** | Vidstack, Plyr, React Player | — | Video playback | Low |
| **Text Editor** | Tiptap | 3.23.6 | Rich text editing | Low |
| **State Management** | Zustand | 4.5.4 | Client state | Low |
| **Validation** | Zod | 3.25.76 | Schema validation | Low |
| **Styling** | Tailwind CSS | 3.4.19 | CSS framework | Low |
| **PWA** | @ducanh2912/next-pwa | 10.2.9 | PWA support | Low |
| **Animation** | Framer Motion | 11.18.2 | UI animations | Low |
| **Testing** | Vitest | 4.1.9 | Unit tests | **HIGH** (minimal coverage) |
| **CI/CD** | Vercel | — | Deployment | Low |
| **Icons** | Lucide, Phosphor, Heroicons | — | UI icons | Low |
| **OCR** | Tesseract.js | 7.0.0 | Image text extraction | Low |
| **PDF** | pdf-parse, pdfjs-dist | — | PDF parsing | Low |
| **Transcription** | AssemblyAI | 4.32.1 | Audio transcription | Low |
| **Text-to-Speech** | edge-tts-universal | 1.4.0 | TTS | Low |
| **AI Proxy** | Local Claude proxy | — | Claude AI access | Low |
| **Cron** | Vercel Cron Jobs | — | Scheduled tasks | Low |
| **Workers** | Cloudflare Workers | — | Telegram bot worker | Low |
| **Mobile Wrapper** | Capacitor | 8.3.0 | Native mobile wrapper | Low |
| **Separate Mobile App** | Expo | — | Standalone mobile app | Low |

---

# 4. Architecture

## Architecture Pattern: Layered Monolith

```mermaid
graph TD
    subgraph "Presentation Layer"
        RSC[React Server Components]
        Pages[Next.js Pages]
    end
    
    subgraph "API Layer v1"
        V1[API Routes /api/v1/]
        V1_MW[Middleware Auth]
        V1_VAL[Zod Validation]
    end
    
    subgraph "API Layer v2"
        V2[API Routes /api/v2/]
        V2_MW[Tenant Guards]
        V2_ENV[Envelope Format]
        V2_FF[Feature Flags]
    end
    
    subgraph "Auth Layer"
        SUPA[Supabase Auth]
        JWT[Custom JWT - Mobile]
        AUTH_MW[withAuth / withAdmin]
        SESSION[Session Resolution]
    end
    
    subgraph "Service Layer"
        AI[AI Router]
        EMAIL[Email Service]
        STORAGE[Storage Service]
        PUSH[Push Service]
        TELEGRAM[Telegram Bot]
        VALIDATION[Zod Schemas]
    end
    
    subgraph "Data Access Layer"
        REPO[Repository Layer]
        PRISMA[Prisma ORM]
        CACHE[Redis Cache]
    end
    
    subgraph "Data Store"
        PG[(PostgreSQL)]
        REDIS[(Upstash Redis)]
        CLD[Cloudinary]
        UT[UploadThing]
        FCM[Firebase]
    end
    
    V1 --> AUTH_MW
    V1 --> V1_VAL
    V1 --> REPO
    V2 --> V2_MW
    V2 --> V2_FF
    V2 --> REPO
    AUTH_MW --> SUPA
    AUTH_MW --> JWT
    REPO --> PRISMA
    PRISMA --> PG
    REPO --> CACHE
    CACHE --> REDIS
    SERVICE --> CLD
    SERVICE --> UT
    SERVICE --> FCM
```

**Why Layered Monolith:**
- All code runs in a single Next.js process
- No service boundaries, no message queues between services (Redis is used for caching/pubsub, not service communication)
- Shared database (PostgreSQL) accessed through Prisma
- Simple deployment model (one Vercel project)
- Good for a startup team size of 1-3 developers

**Rationale:** The architecture is appropriate for the current stage of the project. The V2 API attempts to introduce cleaner patterns (standardized envelopes, feature flags, tenant guards) but the V1 API still carries the bulk of the endpoints with inconsistent patterns.

## Multi-Tenant Architecture

Data is scoped by `universityId`. The tenant chain is:

```
University → AcademicYear → Semester → Module → Subject → Lecture
```

Key files:
- `src/lib/tenant.ts` — `getSessionScope()`, `isAdminRole()`, `isScopedAdmin()`
- `src/lib/admin-scope.ts` — `assertLecture()`, `assertSemester()`, `assertModule()`, `assertSubject()`
- `src/platform/api/guards.ts` — `requireTenantSession()`
- `src/platform/tenant/tenant-resolver.ts` — Resolves tenant context from session

## V1 vs V2 Coexistence

The project has two API versions running simultaneously:

| Aspect | V1 | V2 |
|--------|----|----|
| Response Format | Inconsistent (NextResponse.json) | Standard envelope (`ApiEnvelope<T>`) |
| Auth | `auth()` from lib/auth | `requireTenantSession()` |
| Feature Flags | None | `requireFeatureEnabled()` |
| Dev Bypass | None | `devBypassFromRequest()` |
| Tenant Scoping | Inline checks | Built into envelope |
| Route Count | ~69 route groups | 9 route groups |

---

# 5. Dependency Graph

## Module Dependency Map

```mermaid
graph TD
    subgraph "Entry Points"
        MW[middleware.ts]
        ROOT[src/app/layout.tsx]
        V1_API[/api/v1/*]
        V2_API[/api/v2/*]
        MOBILE_API[/api/mobile/*]
        TG_BOT[Telegram Bot]
    end
    
    subgraph "Auth Chain"
        SUPAMW[supabase/middleware.ts]
        SUPASRV[supabase/server.ts]
        SUPACLI[supabase/client.ts]
        SUPADMIN[supabase/admin.ts]
        AUTH[lib/auth.ts]
        AUTHMW[lib/auth-middleware.ts]
        TENANT[lib/tenant.ts]
        JWTHELP[supabase/auth-helpers.ts]
    end
    
    subgraph "Data Layer"
        PRISMA[lib/prisma.ts]
        REDIS[lib/redis.ts]
        REPOAUTH[repositories/auth.repository.ts]
        REPOUSER[repositories/user.repository.ts]
    end
    
    subgraph "Service Layer"
        AI_ROUTER[lib/ai-router.ts]
        GEMINI[lib/gemini.ts]
        GEMINI_KEYS[lib/gemini-keys.ts]
        GEMINI_CHAIN[lib/gemini-model-chain.ts]
        STORAGE[lib/storage.ts]
        CLOUDINARY[lib/cloudinary.ts]
        UPLOADTHING[lib/uploadthing.ts]
        EMAIL[lib/email.ts]
        CAPTCHA[lib/captcha.ts]
        SCOPES[lib/admin-scope.ts]
    end
    
    subgraph "Platform Layer"
        ENVELOPE[platform/api/envelope.ts]
        GUARDS[platform/api/guards.ts]
        FLAGS[platform/flags.ts]
        DEV_AUTH[platform/dev-auth.ts]
        TENANT_RESOLVER[platform/tenant/tenant-resolver.ts]
        V2_TOGGLE[platform/v2-toggle.ts]
    end
    
    subgraph "External"
        PG[(PostgreSQL)]
        UPSTASH[(Upstash Redis)]
        SUPABASE[Supabase Auth]
        GEMINI_API[Google Gemini API]
        GROQ[Groq API]
        DEEPSEEK[DeepSeek API]
        OPENAI[OpenAI API]
        ANTHROPIC[Anthropic API]
        CLD_API[Cloudinary API]
        UT_API[UploadThing API]
        GMAIL[Gmail SMTP]
        FCM[Firebase Cloud Messaging]
    end
    
    MW --> SUPAMW
    V1_API --> AUTHMW
    V1_API --> PRISMA
    V1_API --> REDIS
    V1_API --> AI_ROUTER
    V2_API --> GUARDS
    V2_API --> ENVELOPE
    V2_API --> FLAGS
    V2_API --> DEV_AUTH
    V2_API --> PRISMA
    MOBILE_API --> AUTHMW
    
    AUTHMW --> AUTH
    AUTH --> SUPASRV
    AUTH --> REDIS
    AUTHMW --> TENANT
    AUTHMW --> JWTHELP
    
    TENANT --> PRISMA
    GUARDS --> TENANT_RESOLVER
    TENANT_RESOLVER --> TENANT
    FLAGS --> PRISMA
    
    REPOAUTH --> PRISMA
    REPOUSER --> PRISMA
    
    AI_ROUTER --> GEMINI_KEYS
    AI_ROUTER --> GEMINI_CHAIN
    GEMINI --> AI_ROUTER
    GEMINI_KEYS --> GEMINI_CHAIN
    GEMINI_KEYS --> GEMINI
    
    STORAGE --> CLOUDINARY
    STORAGE --> UPLOADTHING
    
    EMAIL --> GMAIL
    CAPTCHA --> CLOUDFLARE_TURNSTILE
    
    AI_ROUTER --> GEMINI_API
    AI_ROUTER --> GROQ
    AI_ROUTER --> DEEPSEEK
    AI_ROUTER --> OPENAI
    AI_ROUTER --> ANTHROPIC
```

---

# 6. Folder-by-Folder Analysis

## `prisma/` — Database Layer

**Purpose:** Houses the complete database schema, migration history, seed data, and migration scripts.

**Dependencies:** Prisma CLI, PostgreSQL

**Contents:**

| File | Purpose |
|------|---------|
| `schema.prisma` | 2803-line master schema with ~95 models |
| `schema.v2.core.prisma` | V2 schema fragment (core entities) |
| `schema.v2.university.prisma` | V2 schema fragment (university entities) |
| `migrations/` | Prisma migration files |
| `seed.ts` | Database seed script (tsx prisma/seed.ts) |
| `backfill-forum-university.ts` | One-time data migration script |
| `migrate-faculties.ts` | Faculty migration script |

## `src/lib/` — Core Libraries

**Purpose:** All shared business logic, infrastructure clients, utilities, and service implementations.

**Dependencies:** Prisma client, Redis, Firebase, external APIs

### Key Files:

| File | Lines | Purpose |
|------|-------|---------|
| `prisma.ts` | 54 | Singleton Prisma client with retry logic |
| `redis.ts` | 96 | Redis client, rate limiting, pub/sub, cache |
| `auth.ts` | 66 | Auth session resolution from Supabase |
| `auth-middleware.ts` | 116 | Route-level auth wrappers |
| `tenant.ts` | 55 | Multi-tenant scope resolution |
| `ai-router.ts` | 649 | AI provider routing with fallback chain |
| `gemini.ts` | 939 | AI-powered features (question gen, grading, study plans) |
| `gemini-keys.ts` | ~100 | API key management with quota tracking |
| `storage.ts` | 134 | File storage abstraction |
| `email.ts` | 134 | Email service (Nodemailer) |
| `uploadthing.ts` | ~70 | UploadThing file router |
| `cloudinary.ts` | ~80 | Cloudinary image upload |
| `themes.ts` | 44 | 16 theme variant definitions |
| `admin-scope.ts` | — | University-scoped authorization guards |
| `ai-context-builder.ts` | ~250 | Builds student context for AI |

## `src/platform/` — Platform Infrastructure

**Purpose:** V2 platform-level patterns and infrastructure code.

**Contents:**

| File | Purpose |
|------|---------|
| `api/envelope.ts` | Standardized API response format (`ok()`, `fail()`) |
| `api/guards.ts` | Tenant session guards |
| `api/idempotency.ts` | Idempotency support |
| `api/v2-contract.ts` | V2 contract definitions |
| `dev-auth.ts` | Development admin bypass |
| `flags.ts` | Feature flag system |
| `v2-toggle.ts` | V2 version toggle |
| `tenant/tenant-resolver.ts` | Tenant context resolver |

## `src/modules/` — V2 Domain Modules

**Purpose:** Domain module contracts for V2 architecture.

**Contents (all mostly placeholder contracts):**

| Module | Purpose |
|--------|---------|
| `ai/contracts.ts` | AI module interfaces |
| `assessment/contracts.ts` | Assessment module |
| `content/contracts.ts` | Content management |
| `identity/contracts.ts` | Identity and auth |
| `marketplace/contracts.ts` | Marketplace |
| `org/contracts.ts` | Organization |
| `social/contracts.ts` | Social features |
| `study-space/contracts.ts` | Study space |

---

# 7. File-by-File Analysis — Core Files

## `src/lib/prisma.ts` — Prisma Client Singleton

```typescript
// Path: src/lib/prisma.ts
// Lines: 54
// Purpose: Singleton PrismaClient with connection pooling and retry logic
```

**Exports:**
- `prisma` — Singleton PrismaClient instance
- `withRetry<T>(fn, retries?)` — Retry helper for transient connection drops

**Logic:**
1. On import, checks for `DATABASE_URL` env var
2. If missing and on client-side (`typeof window !== "undefined"`), returns a Proxy that rejects all calls
3. If missing on server, throws error
4. Parses URL and appends `connection_limit` if not present
5. Creates PrismaClient with error-level logging in production, warn-level in dev
6. Stores on `globalThis` for hot-reload persistence
7. Registers `beforeExit` handler for graceful shutdown
8. `withRetry` retries up to 2 times on connection drop errors with exponential backoff

**Issues:**
- `globalForPrisma.prisma ?? createPrismaClient()` — race condition on first access
- The Proxy fallback for browser is a clever trick but could mask configuration errors

## `src/lib/auth.ts` — Auth Session Resolution

```typescript
// Path: src/lib/auth.ts
// Lines: 66
// Purpose: Resolves authenticated user session
```

**Exports:**
- `auth()` — Returns `AuthSession | null`
- `signOut()` — Signs out user from Supabase
- `AuthSession` type

**Logic:**
1. Creates Supabase server client
2. Calls `supabase.auth.getUser()`
3. Checks Redis cache for `auth:{userId}` (TTL: 30s)
4. On cache miss, builds session from `user.user_metadata`
5. Checks for SUPER_ADMIN by email or role
6. Caches session in Redis
7. Returns `null` on any error (silent fail)

**Issues:**
- Catches ALL errors silently — could mask auth provider outages
- `AuthSession` type has `user.role` as `string` — not using Prisma Role enum
- Caches for only 30s TTL, defeating much of the caching benefit

## `src/lib/auth-middleware.ts` — Route Auth Wrappers

```typescript
// Path: src/lib/auth-middleware.ts
// Lines: 116
// Purpose: Higher-order functions for route-level auth
```

**Exports:**
- `withAuth(handler, options?)` — Any authenticated user
- `withAdmin(handler)` — ADMIN/SUPER_ADMIN/LEADER
- `withSuperAdmin(handler)` — SUPER_ADMIN only
- `withTeacher(handler)` — TEACHER/ADMIN/SUPER_ADMIN/LEADER
- `withContentManager(handler)` — Same as Teacher
- `withOptionalAuth(handler)` — Auth optional (null if unauthenticated)

**Logic:**
1. Detects auth method: Bearer token (mobile JWT) or Supabase session (web)
2. For Bearer: verifies JWT via `getServerToken()`
3. For web: calls `auth()` then `getSessionScope()`
4. Validates role requirements if specified
5. Returns 401 or 403 on failure

**Issues:**
- `resolveAuth()` has branching logic for web vs mobile but `withOptionalAuth` doesn't support token-based auth properly
- No rate limiting at middleware level
- Error responses are simple strings, not standardized envelopes

## `src/lib/redis.ts` — Redis Client

```typescript
// Path: src/lib/redis.ts
// Lines: 96
// Purpose: Redis client, rate limiting, pub/sub, caching
```

**Exports:**
- `redis` — Singleton Redis instance (ioredis)
- `redisIncrWithExpire(key, ttl)` — Rate limiter counter
- `checkRateLimit(userId, action)` — Rate limit check
- `publishNotification(userId, payload)` — Push notification via Redis pub
- `broadcastNotification(userIds, payload)` — Batch notification broadcast
- `cacheSet(key, value, ttl?)` — Session cache write
- `cacheGet(key)` — Session cache read
- `cacheDel(key)` — Cache invalidation

**Rate Limits:**
| Action | Hourly Limit |
|--------|-------------|
| post | 5 |
| comment | 10 |
| like | 20 |
| share | 5 |

**Issues:**
- `lazyConnect: true` — Redis connection is deferred until first use
- All failures silently degrade in dev (returns 1 for rate limits)
- No connection pooling configuration
- `publishNotification` and `broadcastNotification` use Redis pub/sub but there's no subscriber listening for these in the main app

## `src/lib/ai-router.ts` — AI Provider Router

```typescript
// Path: src/lib/ai-router.ts
// Lines: 649
// Purpose: Routes AI requests to available providers with fallback chain
```

**Providers (in fallback order):**
1. **SiliconFlow** (DeepSeek-R1 via Chinese API) — FREE
2. **Proxy** (Local Claude proxy at ANTHROPIC_BASE_URL) — Requires local server
3. **HuggingFace** (Llama 3.3 70B) — Requires API key
4. **DuckDuckGo** (gpt-4o-mini via DuckDuckGo chat) — FREE, no API key needed
5. **Gemini** — Used for multimodal (images/PDFs) only

**BYOK (Bring Your Own Key) Support:**
- OpenAI, Anthropic, DeepSeek, Gemini, Groq, OpenRouter, xAI (Grok), SiliconFlow, HuggingFace, Mistral
- Users can store personal API keys in their profile
- Used when `useCustomKey` option is set

**Logic:**
1. If BYOK path: calls the specified provider with user's key
2. If multimodal (images/PDFs): forces Gemini (only provider that supports inline data)
3. Standard path: tries providers in order, falls through on failure
4. If all fail: throws error with list of tried providers

**Issues:**
- DuckDuckGo scrapes the duckchat API — fragile, violates ToS
- No streaming support (all requests are blocking)
- No caching of AI responses
- `FETCH_MS` timeout is 30s — may cause Vercel 10s timeout issues
- Claude proxy path assumes local server running on port 8082

## `src/lib/gemini.ts` — Gemini AI Integration (939 lines)

**Features:**
1. `generateExplanation()` — Explain an MCQ to a student
2. `suggestQuestionDetails()` — Admin: generate choices + answer from question body
3. `extractQuestionsFromText()` — Extract MCQs from raw text (PDF/notes)
4. `gradeEssayAnswer()` — Auto-grade essay answers against reference
5. `validateQuestions()` — Quality check questions
6. `generateLectureEnhancements()` — Generate notes + flashcards for lectures
7. `generateLectureExtras()` — Generate overview cards, mnemonics, cases, mind maps
8. `generateFlashcardsFromPastedText()` — Student: flashcards from notes
9. `generateWeeklyStudyPlan()` — Personal study assistant
10. `generateStudyNotes()` — Full study notes from source material

**Issues:**
- All functions use `generateAIReplyWithFallback()` or `generateJsonWithFallback()` — no direct Gemini SDK usage
- JSON parsing from AI responses is fragile (depends on proper markdown code block formatting)
- Text truncation at 15000/12000/30000 chars throughout — may lose context
- All error handling is generic (catch-all returns fallback values)
- No streaming for any feature

## `src/platform/api/envelope.ts` — API Response Envelope

```typescript
// Path: src/platform/api/envelope.ts
// Lines: 54
// Purpose: Standardized API response format for V2
```

**Types:**
```typescript
type ApiEnvelope<T> = {
  requestId: string;
  tenantKey: string | null;
  actor: ApiActor | null;
  result: T | null;
  errors: string[];
};
```

**Exports:**
- `ok(result, tenantKey?, actor?, status?, headers?)` — Success response
- `fail(error, tenantKey?, actor?, status?)` — Error response

**Issues:**
- `requestId` uses `Math.random()` — not cryptographically secure
- No timing/performance metadata in envelope
- V1 API does NOT use this envelope

---

# 8. Database Analysis

## Database Type

**PostgreSQL 15** hosted on **Supabase** (managed PostgreSQL service).

Connection details from `.env`:
- **Pooler URL (session):** `postgresql://postgres.egxvmkhynsaikucsucjs:Ahmed%26hassan3112006@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=60&pgbouncer=true&connection_limit=30&pool_timeout=30&statement_cache_size=0`
- **Direct URL:** `postgresql://postgres.egxvmkhynsaikucsucjs:Ahmed%26hassan3112006@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=60`
- **Connection Limit:** 15 (configurable via `DATABASE_CONNECTION_LIMIT`)

## Complete Model Inventory (~95 models)

### Core Academic Models

| Model | Table | Purpose | Key Fields |
|-------|-------|---------|------------|
| `University` | `University` | Medical university | id, name, abbr |
| `Faculty` | `Faculty` | Faculty within university | id, name, category |
| `AcademicYear` | `AcademicYear` | Year within university | yearNumber, universityId |
| `Semester` | `Semester` | Semester within academic year | name, academicYearId |
| `Module` | `Module` | Subject module | name, semesterId |
| `Subject` | `Subject` | Subject within module | name, moduleId, semesterId |
| `Lecture` | `Lecture` | Individual lecture | title, videoUrl, subjectId |
| `LectureFile` | `LectureFile` | Lecture file attachments | name, url, lectureId |
| `LectureVideo` | `LectureVideo` | Lecture video | title, url, lectureId |
| `LectureRecord` | `LectureRecord` | Lecture recording | title, url, lectureId |

### User Models

| Model | Purpose |
|-------|---------|
| `User` | Main user account (40+ fields) |
| `Account` | OAuth provider accounts |
| `Session` | Auth sessions |
| `BotUser` | Telegram bot users |
| `BotAuth` | Telegram auth codes |
| `GuestQuizUser` | Guest (unregistered) quiz users |

### Social Models

| Model | Purpose |
|-------|---------|
| `Post` | Social feed posts |
| `Comment` | Post comments (threaded) |
| `Like` | Post likes |
| `PostReaction` | Rich reactions (Love, Support, Smart, etc.) |
| `CommentLike` | Comment likes |
| `Forum` | Forum entity |
| `PrivateForumMember` | Private forum members |
| `PrivateForumInvite` | Private forum invites |
| `Group` | Social groups |
| `GroupMember` | Group memberships |
| `DirectMessage` | Direct messages |
| `UserFollow` | Follow relationships |
| `Hashtag` | Hashtags |
| `PostHashtag` | Post-to-hashtag mapping |
| `SavedPost` | Bookmarked posts |

### Quiz/Assessment Models

| Model | Purpose |
|-------|---------|
| `Question` | Quiz questions |
| `PastPaper` | Past paper/quiz container |
| `QuizAttempt` | User quiz attempt |
| `QuizAttemptItem` | Individual question result |
| `QuestionReport` | Question issue reports |
| `SavedQuestion` | Bookmarked questions |
| `SavedQuiz` | Saved/shared quizzes |
| `SharedQuizAttempt` | Shared quiz attempt |
| `V2Quiz` | V2 quiz |
| `V2Question` | V2 question |
| `V2QuizAttempt` | V2 quiz attempt |
| `QuizQuestion` | Quiz-question mapping |
| `QuizAttemptAnswer` | V2 answer record |
| `QuizAnalyticsSnapshot` | Analytics snapshots |
| `QuizRating` | Quiz ratings |
| `QuizComment` | Quiz comments |
| `QuestionBank` | V2 question bank |

### Study Tools

| Model | Purpose |
|-------|---------|
| `Flashcard` | Flashcards |
| `UserFlashcardProgress` | Spaced repetition progress (SM-2) |
| `Note` | User lecture notes |
| `SavedFlashcardSet` | Saved/shared flashcard sets |
| `StudyRoom` | Virtual study rooms |
| `StudyRoomMember` | Study room members |
| `StudyRoomPost` | Study room posts |
| `StudyRoomPostLike` | Post likes |
| `StudyRoomComment` | Study room comments |
| `StudyRoomTask` | Study room tasks |
| `StudyRoomTaskCompletion` | Task completions |
| `StudyRoomSchedule` | Room schedule |
| `StudySession` | Pomodoro study sessions |
| `StudySessionParticipant` | Session participants |
| `UserPointsTransaction` | Gamification points |
| `StudyAssistantProfile` | AI study assistant profile |
| `Workspace` | Study workspace |
| `WidgetInstance` | Workspace widgets |
| `PomodoroSession` | Pomodoro timer sessions |

### Content/Library

| Model | Purpose |
|-------|---------|
| `SourceBook` | Medical textbooks |
| `LibraryResource` | Shared learning resources |
| `DocumentTemplate` | Document templates |
| `MedicalTeam` | Medical teams |
| `TeamMember` | Team memberships |
| `TeamFollower` | Team followers |
| `TeamTask` | Team tasks |

### Admin/Analytics

| Model | Purpose |
|-------|---------|
| `SiteConfig` | Global site configuration |
| `FeatureFlag` | Feature flags |
| `AdBanner` | Advertisements |
| `PlatformMember` | Team members page |
| `AdminActionLog` | Admin audit log |
| `SecurityEvent` | Security events |
| `UserSessionLog` | User session analytics |
| `PageView` | Page view tracking |
| `AuditLog` | Audit trail |
| `Warning` | User warnings |
| `Testimonial` | User testimonials |
| `CustomAgent` | Custom AI agents |
| `CustomAgentRating` | Agent ratings |
| `CustomAgentComment` | Agent comments |

### Infrastructure

| Model | Purpose |
|-------|---------|
| `Notification` | User notifications |
| `NotificationMute` | Notification preferences |
| `PushSubscription` | Web push subscriptions |
| `Poll` | Polls for posts |
| `PollOption` | Poll options |
| `PollVote` | Poll votes |
| `VerificationToken` | Email verification |
| `TelegramConfig` | Telegram bot config |
| `AllowedChannel` | Allowed YouTube channels |
| `ChannelFollow` | Channel follows |
| `VideoViewTracking` | Video view tracking |
| `TelegramMigrationTask` | Telegram content migration |
| `AiResponseCache` | AI response caching |
| `EngagementLog` | Engagement tracking |
| `AIUsageLog` | AI usage tracking |

### V2 Academic Models

| Model | Purpose |
|-------|---------|
| `Term` | Academic term |
| `V2Faculty` | V2 faculty |
| `V2Subject` | V2 subject |
| `V2Lecture` | V2 lecture |
| `V2LectureComponent` | Lecture components |
| `V2LectureFile` | Lecture files |
| `V2LectureNote` | Lecture notes |
| `V2LectureVideo` | Lecture videos |
| `V2LectureFlashcardSet` | Flashcard sets |
| `StudentEnrollment` | Course enrollment |
| `StudentProgress` | Progress tracking |
| `V2StudySession` | Study sessions |
| `V2SavedLecture` | Saved lectures |
| `IdentityProvider` | Auth providers |
| `UserRoleAssignment` | Role assignments |
| `TeacherProfile` | Teacher profiles |
| `CourseEnrollment` | Course enrollment |
| `OutboxEvent` | Outbox pattern events |
| `V2AuditLog` | V2 audit logs |
| `V2Module` | V2 module |

### V2 Social Models

| Model | Purpose |
|-------|---------|
| `Community` | Communities |
| `V2Post` | V2 posts |
| `V2Comment` | V2 comments |
| `V2Reaction` | V2 reactions |
| `V2Group` | V2 groups |
| `V2GroupMembership` | Group memberships |
| `V2Message` | Group messages |

### Atlas (Anatomy) Models

| Model | Purpose |
|-------|---------|
| `AtlasSystem` | Body systems |
| `AtlasStructure` | Anatomical structures |
| `AtlasBookmark` | User bookmarks |
| `AtlasNote` | User notes on structures |

## Entity Relationship Diagram

```mermaid
erDiagram
    University ||--o{ Faculty : has
    University ||--o{ AcademicYear : has
    University ||--o{ User : enrolls
    University ||--o{ Forum : hosts
    
    Faculty ||--o{ AcademicYear : groups
    Faculty ||--o{ User : enrolls
    Faculty ||--o{ MedicalTeam : hosts
    
    AcademicYear ||--o{ Semester : contains
    
    Semester ||--o{ Module : has
    Semester ||--o{ PastPaper : contains
    Semester ||--o{ User : enrolls
    Semester ||--o{ Forum : hosts
    
    Module ||--o{ Subject : has
    
    Subject ||--o{ Lecture : has
    
    Lecture ||--o{ Question : has
    Lecture ||--o{ Flashcard : has
    Lecture ||--o{ Note : has
    Lecture ||--o{ LectureFile : has
    Lecture ||--o{ LectureVideo : has
    
    PastPaper ||--o{ QuizAttempt : has
    PastPaper ||--o{ QuestionReport : has
    
    QuizAttempt ||--o{ QuizAttemptItem : has
    
    Question ||--o{ QuizAttemptItem : answered-in
    Question ||--o{ SavedQuestion : saved-by
    Question ||--o{ QuestionReport : reported
    
    User ||--o{ Post : authors
    User ||--o{ Comment : authors
    User ||--o{ QuizAttempt : takes
    User ||--o{ Like : gives
    User ||--o{ Notification : receives
    User ||--o{ DirectMessage : sends
    User ||--o{ DirectMessage : receives
    User ||--o{ UserFlashcardProgress : has
    User ||--o{ UserLectureActivity : has
    User ||--o{ StudyRoomMember : joins
    
    Post ||--o{ Comment : has
    Post ||--o{ Like : has
    Post ||--o{ PostReaction : has
    Post }o--|| Forum : belongs-to
    
    Forum ||--o{ Post : contains
    Forum ||--o{ PrivateForumMember : has
    
    StudyRoom ||--o{ StudyRoomMember : has
    StudyRoom ||--o{ StudyRoomPost : has
    StudyRoom ||--o{ StudySession : hosts
    StudyRoom ||--o{ StudyRoomTask : has
```

## Key Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `User` | `email` | Unique | Login lookup |
| `User` | `handle` | Unique | Profile lookup |
| `User` | `telegramId` | Unique | Telegram linking |
| `User` | `studentCode` | Unique | Student ID lookup |
| `User` | `universityId` | Index | Tenant scoping |
| `User` | `points` | Index | Leaderboard |
| `Post` | `(universityId, createdAt)` | Composite | Feed queries |
| `Post` | `(forumId, createdAt)` | Composite | Forum feed |
| `QuizAttempt` | `(userId, pastPaperId)` | Composite | User attempts |
| `QuizAttemptItem` | `(attemptId, questionId)` | Composite | Answer lookup |
| `Flashcard` | `lectureId` | Index | Lecture cards |
| `UserFlashcardProgress` | `(userId, nextReviewAt)` | Composite | Spaced repetition |
| `Lecture` | `subjectId` | Index | Module content |
| `Question` | `lectureId` | Index | Quiz questions |
| `Notification` | `(userId, read)` | Composite | Unread count |

---

# 9. ORM Analysis

## Prisma Usage Patterns

### Singleton Pattern (`src/lib/prisma.ts`)
```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

**Key Config:**
- Binary targets: `native`, `rhel-openssl-1.0.x`, `rhel-openssl-3.0.x`
- Connection limit: 15 (configurable)
- Logging: `["error"]` in production, `["error", "warn"]` in dev
- Retry: 2 retries with exponential backoff (200ms, 400ms)

### Transaction Patterns

**Isolated Transactions** (in register route):
```typescript
const user = await prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({ ... });
  await tx.botAuth.delete({ where: { telegramId: botUser.telegramId } });
  return newUser;
});
```

### Raw SQL Queries

In `ai-context-builder.ts`:
```typescript
const lastActivity = await prisma.$queryRaw<Array<{...}>>(
  Prisma.sql`
    SELECT l."title" as "lectureTitle", ...
    FROM "UserLectureActivity" a
    JOIN "Lecture" l ON l."id" = a."lectureId"
    ...
  `
);
```

### Repository Pattern

`repositories/auth.repository.ts`:
```typescript
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id, name, email, image, role, password, universityId, semesterId, facultyId },
  });
}
```

`repositories/user.repository.ts`:
```typescript
const publicProfileSelect = { /* 20+ fields */ } as const;
export async function findUserById(id: string) {
  return withRetry(() => prisma.user.findUnique({ where: { id }, select: publicProfileSelect }));
}
```

### N+1 Query Risks

1. **AI Context Builder (`ai-context-builder.ts`):** Multiple sequential queries for syllabus, quiz, and leaderboard data
2. **Feed queries:** When loading posts, comments are loaded separately
3. **Module/Lecture tree:** Loading academic hierarchy requires multiple queries

### Query Optimization Observations

- Well-indexed tables with composite indexes for common query patterns
- `withRetry()` wrapper handles transient PostgreSQL connection drops
- No `include` chaining that would cause N+1 — relations are loaded via separate queries or `select`
- Raw SQL used for complex joins (ai-context-builder.ts)

---

# 10. Authentication

## Authentication Architecture

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant Supabase
    participant Redis
    participant DB
    
    Note over User,DB: Web Authentication (Supabase SSR)
    
    User->>Browser: Click Login
    Browser->>NextJS: POST /api/v1/auth/register
    NextJS->>Supabase: supabase.auth.admin.createUser()
    Supabase-->>NextJS: User created
    NextJS->>DB: prisma.user.create()
    NextJS->>DB: prisma.botAuth.delete()
    NextJS-->>Browser: 201 { id, name, studentCode }
    
    Note over User,DB: Mobile Authentication (Custom JWT)
    
    User->>MobileApp: Login
    MobileApp->>NextJS: POST /api/mobile/login + credentials
    NextJS->>Supabase: supabase.auth.signInWithPassword()
    Supabase-->>NextJS: User verified
    NextJS->>NextJS: createMobileToken(user)
    NextJS-->>MobileApp: { token: "eyJ..." }
    
    Note over User,DB: Session Resolution
    
    User->>NextJS: Request with cookie
    NextJS->>Supabase: supabase.auth.getUser()
    Supabase-->>NextJS: User data
    NextJS->>Redis: cacheGet(auth:{userId})
    alt Cache Hit
        Redis-->>NextJS: Cached session
    else Cache Miss
        NextJS->>DB: prisma.user.findUnique()
        DB-->>NextJS: User data
        NextJS->>Redis: cacheSet(auth:{userId})
    end
```

## Auth Methods

### 1. Supabase SSR Auth (Web)

**Files:**
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/server.ts` — Server client (cookie-based)
- `src/lib/supabase/middleware.ts` — SSR middleware for cookie refresh

**Flow:**
1. User registers via `/register` page
2. Supabase handles password hashing and storage
3. Server creates user via `supabase.auth.admin.createUser()`
4. Also hashes password with bcrypt and stores in `User.password` field (dual storage!)
5. Login: post to auth endpoint → Supabase validates → session cookie set
6. Session refreshed automatically by Supabase SSR middleware

### 2. Custom JWT (Mobile App)

**File:** `src/lib/supabase/auth-helpers.ts`

**Flow:**
1. Mobile app sends `Authorization: Bearer <token>` header
2. Server verifies JWT using `jose` library
3. JWT contains: `{ id, sub, role, semesterId, universityId, nickname, studentId }`
4. Token expires in 30 days
5. Secret: `MOBILE_AUTH_SECRET || AUTH_SECRET || NEXTAUTH_SECRET || "fallback-secret-change-in-production"`

**Critical Security Issue:** The fallback secret is hardcoded in the source code!

### 3. OAuth (Google, Facebook)

- Google OAuth via `@react-oauth/google` + NextAuth callbacks
- Facebook OAuth via Facebook Login + NextAuth callbacks
- OAuth accounts stored in `Account` table (provider + providerAccountId)

### 4. Telegram Auth (Bot-Based)

**Flow:**
1. User interacts with Telegram bot
2. Bot creates a `BotUser` record with phone number
3. Bot creates a `BotAuth` record with 6-digit code
4. User enters code on website during registration
5. Registration verifies code, deletes `BotAuth`, creates `User` linked to `BotUser.telegramId`

### 5. Password Handling

- Passwords hashed with **bcryptjs** (10 rounds)
- Dual storage: Both Supabase Auth and local `User.password` field
- This is a design concern — passwords are stored in two places

### 6. CAPTCHA

- Cloudflare Turnstile (free CAPTCHA alternative)
- Used during registration
- Implementation in `src/lib/captcha.ts`

## Auth Lifecycle

| Event | Action |
|-------|--------|
| Registration | Create Supabase user + hashed password + User record + delete BotAuth |
| Login (Web) | Supabase validates credentials, sets session cookie |
| Login (Mobile) | Verify credentials, issue custom JWT (30d expiry) |
| Session Check | `auth()` → Supabase getUser → Redis cache (30s TTL) |
| Logout | `signOut()` → `supabase.auth.signOut()` |
| Password Reset | Supabase handles via email link |
| Token Refresh | Supabase SSR automatically refreshes cookies |

---

# 11. Authorization

## Role Hierarchy

```mermaid
graph TD
    SUPER_ADMIN --> ADMIN
    ADMIN --> LEADER
    LEADER --> TEACHER
    TEACHER --> STUDENT
    STUDENT --> GUEST
```

## Roles

| Role | Access Level |
|------|-------------|
| `SUPER_ADMIN` | Full platform access, all universities, all data |
| `ADMIN` | University-scoped management |
| `LEADER` | Student leader with moderation capabilities |
| `TEACHER` | Content creation and management |
| `STUDENT` | General platform access |
| (no role) | Guest/unauthenticated |

## Authorization Guards

### Web Auth Wrappers (`src/lib/auth-middleware.ts`)

| Wrapper | Roles Allowed |
|---------|---------------|
| `withAuth()` | Any authenticated user |
| `withAdmin()` | ADMIN, SUPER_ADMIN, LEADER |
| `withSuperAdmin()` | SUPER_ADMIN only |
| `withTeacher()` | TEACHER, ADMIN, SUPER_ADMIN, LEADER |
| `withContentManager()` | Same as Teacher |
| `withOptionalAuth()` | Any (user may be null) |

### Tenant Scope Guards (`src/lib/admin-scope.ts`)

| Guard | Purpose |
|-------|---------|
| `assertLecture(scope, lectureId)` | Validates lecture belongs to admin's university |
| `assertSemester(scope, semesterId)` | Validates semester belongs to admin's university |
| `assertModule(scope, moduleId)` | Validates module belongs to admin's university |
| `assertSubject(scope, subjectId)` | Validates subject belongs to admin's university |
| `assertPastPaper(scope, paperId)` | Validates past paper belongs to admin's university |

### V2 Guards (`src/platform/api/guards.ts`)

| Guard | Purpose |
|-------|---------|
| `requireTenantSession(session)` | Resolves tenant context, returns 401 if unauthorized |
| `requireTenantKey(tenantKey)` | Validates tenant key is not null |

### Super Admin Bypass

- SUPER_ADMIN bypasses all tenant scope checks
- Also bypasses middleware redirect (see `middleware.ts`)
- Detection: `user.user_metadata?.role === "SUPER_ADMIN" || user.email === SUPER_ADMIN_EMAIL`

### Ownership Validation

- Posts: authorId must match userId for editing
- Comments: authorId must match userId for editing
- Quiz attempts: userId must match
- Notifications: userId scope enforced via Prisma queries

---

# 12. API Analysis

## API Surface Overview

| Version | Root | Route Groups | Response Format | Auth |
|---------|------|-------------|-----------------|------|
| V1 | `/api/v1/` | 69 | Inconsistent | `withAuth()` / inline |
| V2 | `/api/v2/` | 9 | Standard envelope | `requireTenantSession()` |
| Mobile | `/api/mobile/` | 22 | Custom | JWT Bearer |
| Admin | `/api/admin/` | 2 | Inconsistent | Admin auth |
| Cron | `/api/cron/` | 1 | N/A | Vercel cron |
| Telegram | `/api/telegram/` | 1 | N/A | Bot token |

## Key API Endpoints (V1)

### Auth Endpoints

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| POST | `/api/v1/auth/register` | None | User registration |
| GET | `/api/v1/auth/me` | Required | Current user profile |
| PUT | `/api/v1/auth/profile` | Required | Update profile |
| GET | `/api/v1/auth/check-email` | None | Email availability |
| POST | `/api/v1/auth/sync` | None | Telegram auth sync |
| POST | `/api/v1/auth/avatar` | Required | Upload avatar |
| GET | `/api/v1/auth/avatar-url` | Required | Get avatar URL |
| POST | `/api/v1/auth/confirm` | None | Email confirm |
| POST | `/api/v1/auth/sync-password` | Required | Password sync |
| POST | `/api/v1/auth/link-telegram` | Required | Link Telegram |
| POST | `/api/v1/auth/telegram/request-code` | None | Request TG code |
| POST | `/api/v1/auth/telegram/verify-code` | None | Verify TG code |
| GET | `/api/v1/auth/telegram/callback` | None | TG callback |

### Content Endpoints

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| GET | `/api/v1/universities` | Optional | List universities |
| GET | `/api/v1/faculties` | Optional | List faculties |
| GET | `/api/v1/academic-years` | Optional | List academic years |
| GET | `/api/v1/semesters` | Optional | List semesters |
| GET | `/api/v1/modules` | Optional | List modules |
| GET | `/api/v1/subjects` | Optional | List subjects |
| GET | `/api/v1/lectures` | Optional | List lectures |
| GET | `/api/v1/questions` | Optional | List questions |
| GET | `/api/v1/past-papers` | Optional | List past papers |

### Quiz Endpoints

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| GET | `/api/v1/quiz` | Optional | Get shared quiz |
| POST | `/api/v1/quiz-attempts` | Required | Submit quiz attempt |
| GET | `/api/v1/quiz-attempts` | Required | Get attempts |

### Social Endpoints

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| GET | `/api/v1/feed` | Required | Social feed |
| POST | `/api/v1/posts` | Required | Create post |
| GET | `/api/v1/posts` | Required | Get posts |
| POST | `/api/v1/comments` | Required | Create comment |
| POST | `/api/v1/likes` | Required | Like/unlike post |
| POST | `/api/v1/follow` | Required | Follow user |
| GET | `/api/v1/forums` | Required | List forums |

### AI Endpoints

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| POST | `/api/v1/ai/chat` | Required | Dr. Q AI chat |
| POST | `/api/v1/ai/extract` | Required | Extract questions |
| POST | `/api/v1/ai/suggest` | Required | Suggest question details |
| POST | `/api/v1/ai/enhance-post` | Required | AI post enhancement |
| POST | `/api/v1/ai/flashcards-from-text` | Required | Generate flashcards |
| POST | `/api/v1/ai/web-search` | Required | AI web search |
| GET | `/api/v1/ai/context` | Required | Get student context |

## Key API Endpoints (V2)

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| GET | `/api/v2/quiz` | Required | V2 quiz module status |
| GET | `/api/v2/org` | Required | V2 org module status |
| POST | `/api/v2/org/subjects` | Admin | Create subject |
| POST | `/api/v2/content/lectures` | Admin | Create lecture |
| POST | `/api/v2/assessment/quizzes` | Admin | Create quiz |
| POST | `/api/v2/assessment/quizzes/:id/attempt` | Required | Submit attempt |
| POST | `/api/v2/assessment/quizzes/:id/questions` | Admin | Add question |
| PUT | `/api/v2/admin/feature-flags` | Admin | Toggle feature flags |
| GET | `/api/v2/ai` | Required | V2 AI module status |
| GET | `/api/v2/study-space` | Required | V2 study space status |
| GET | `/api/v2/social` | Required | V2 social module status |
| GET | `/api/v2/content` | Required | V2 content module status |

## API Response Patterns

### V1 (Inconsistent — multiple formats)
```typescript
// Success (direct)
NextResponse.json({ id: user.id, name: user.name, message: "Registration successful!" }, { status: 201 })

// Error (direct)
NextResponse.json({ error: "Email already registered" }, { status: 409 })

// With auth middleware
NextResponse.json({ error: "Unauthorized" }, { status: 401 })
```

### V2 (Standardized Envelope)
```typescript
// Success
ok({
  tenantKey: scope.universityId,
  actor: { id: scope.userId, role: scope.role },
  result: { ... },
  status: 201
})
// → { requestId: "req_...", tenantKey: "...", actor: {...}, result: {...}, errors: [] }

// Failure
fail({ error: "Validation failed", status: 400 })
// → { requestId: "req_...", tenantKey: null, actor: null, result: null, errors: ["Validation failed"] }
```

---

# 13. Business Logic

## Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant TG as Telegram Bot
    participant API as /api/v1/auth/register
    participant Redis
    participant Supabase
    participant DB
    
    User->>TG: /start
    TG->>TG: Send phone request
    User->>TG: Share phone number
    TG->>DB: Create BotUser(phoneNumber)
    TG->>DB: Create BotAuth(code)
    TG->>User: Send 6-digit code
    
    User->>API: POST /register { name, email, password, code, ... }
    
    API->>API: Validate CAPTCHA (Turnstile)
    API->>Redis: incr(register:{ip})
    alt Rate limit exceeded (>5/hour)
        API-->>User: 429 Too Many Attempts
    end
    
    API->>DB: Find BotUser by phone
    API->>DB: Find BotAuth by telegramId
    alt Invalid code
        API-->>User: 400 Invalid code
    end
    
    API->>DB: Check duplicate email/nickname/phone
    
    API->>Supabase: admin.createUser(email, password, metadata)
    alt Supabase error
        API-->>User: 400 Supabase error
    end
    
    API->>API: bcrypt.hash(password)
    API->>DB: $transaction { user.create + botAuth.delete }
    API->>Supabase: Generate confirmation link
    API->>Gmail: sendVerificationEmail() [fire-and-forget]
    
    API-->>User: 201 { id, name, studentCode }
```

## Key Business Rules

### Registration
- CAPTCHA required (Turnstile)
- Rate limit: 5 registrations per IP per hour
- Student code format: `{uniAbbr}{facultyPrefix}{yearSuffix}-{studentId}-{phone}`
  - Example: `mnum26-24010511-201093510425`
- Email must be unique
- Nickname must be unique (case-insensitive)
- Telegram phone cannot be linked to another account
- 6-digit Telegram verification code required (expires)
- Password minimum 8 characters

### Gamification
- Users earn points via `UserPointsTransaction`
- Points determine rank (via `Rank` model with min/max thresholds)
- Leaderboard is semester-scoped
- Engagement limits per hour: posts(5), comments(10), likes(20), shares(5)

### Quiz Attempts
- Score calculated as weighted percentage
- Attempt items track `isCorrect` for each question
- Essay questions graded by AI (stages-based rubric)
- Focus loss tracking for exam integrity
- Guest quiz users allowed (no registration required)

### Spaced Repetition (Flashcards)
- SM-2 algorithm implementation
- Tracks: `interval`, `repetitions`, `easeFactor`, `nextReviewAt`
- User progress per flashcard

### Community/Social
- Most social features scoped by `universityId`
- Posts can be: public (university scope), team-scoped, or private
- Private forums require invites
- Rich reactions: LIKE, LOVE, SUPPORT, SMART, CONFUSED, IDEA
- Reporting system with admin moderation

---

# 14. Request Lifecycle

## Complete Trace: POST /api/v1/quiz-attempts

```mermaid
sequenceDiagram
    participant Client
    participant MW as middleware.ts
    participant Router as Next.js Router
    participant AuthMW as auth-middleware.ts
    participant Auth as lib/auth.ts
    participant Tenant as lib/tenant.ts
    participant Handler as Route Handler
    participant Prisma
    participant Redis
    participant DB as PostgreSQL
    
    Client->>MW: POST /api/v1/quiz-attempts
    MW->>MW: Supabase SSR: refresh session cookie
    MW-->>Client: Continue (or redirect)
    
    Client->>Router: Next.js route handler
    Router->>AuthMW: wrap handler
    
    AuthMW->>Auth: auth()
    Auth->>Supabase: supabase.auth.getUser()
    Supabase-->>Auth: User data
    Auth->>Redis: cacheGet(auth:{userId})
    alt Cache Hit
        Redis-->>Auth: Cached Session
    else Cache Miss
        Auth->>Auth: Build session from metadata
        Auth->>Redis: cacheSet(auth:{userId})
    end
    Auth-->>AuthMW: AuthSession
    
    AuthMW->>Tenant: getSessionScope(session)
    Tenant->>DB: prisma.user.findUnique(id)
    DB-->>Tenant: User with role, universityId
    Tenant-->>AuthMW: SessionScope
    
    AuthMW->>AuthMW: Validate role if required
    
    AuthMW->>Handler: Pass { userId, session, scope }
    
    Handler->>Handler: Parse request body (JSON)
    Handler->>Handler: Zod validation
    
    Handler->>Prisma: prisma.pastPaper.findUnique(id)
    DB-->>Prisma: PastPaper with lecture
    
    Handler->>Prisma: Load question answer keys
    DB-->>Prisma: Questions with correct answers
    
    Handler->>Handler: Compare user answers with correct
    Handler->>Handler: Compute score
    
    Handler->>Prisma: prisma.quizAttempt.create()
    Handler->>Prisma: prisma.quizAttemptItem.createMany()
    DB-->>Prisma: Attempt created
    
    Handler-->>Client: 200 { attemptId, score, total }
```

---

# 15. Services

## AI Service (`src/lib/ai-router.ts`)

**Responsibilities:**
- Route AI requests to available providers
- Handle fallback chain when providers fail
- Support BYOK (personal API keys)
- Multimodal support (images/PDFs)

**Dependencies:** `gemini-keys.ts`, `gemini-model-chain.ts`

**Algorithms:**
- Fallback chain: SiliconFlow → Proxy (Claude) → HuggingFace → DuckDuckGo
- For multimodal: Force Gemini (only provider supporting inline data)
- For BYOK: Call specified provider directly, no fallback

## Email Service (`src/lib/email.ts`)

**Responsibilities:**
- Send verification emails
- Send password reset emails
- Send magic link emails
- Send welcome emails

**Dependencies:** Nodemailer + Gmail SMTP

**Constraints:**
- Gmail SMTP limits: 500 emails/day for free accounts
- Uses Gmail App Password
- Send on module load (verify connection)

## Storage Service (`src/lib/storage.ts`)

**Responsibilities:**
- Abstract file storage (local, Cloudinary, UploadThing)
- File type and size validation
- File deletion

**Routing logic:**
1. If `USE_LOCAL_FILE_UPLOAD=true`: Save to `public/uploads/`
2. If image MIME type: Upload to Cloudinary
3. Otherwise: Upload to UploadThing

**Complexities:**
- `O(1)` for all storage operations
- Local disk upload does NOT work on Vercel (ephemeral filesystem)

## Telegram Bot Service (`src/lib/telegram-bot/`)

**Responsibilities:**
- Handle Telegram bot commands
- Auth via phone number and verification codes
- AI chat via Telegram
- Module/content listing

**Dependencies:** Telegraf framework, Gemini AI

## Rate Limiting Service (`src/lib/redis.ts`)

**Pattern:** Sliding window per hour using Redis INCR with TTL

**Limits:**
| Action | Per Hour |
|--------|----------|
| Registration (per IP) | 5 |
| Posts | 5 |
| Comments | 10 |
| Likes | 20 |
| Shares | 5 |
| Default | 100 |

---

# 16. Controllers

The project uses **Next.js Route Handlers** rather than traditional controllers. Each file under `src/app/api/` is a route handler (equivalent to a controller in MVC).

## Route Handler Pattern

```typescript
// src/app/api/v1/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... business logic
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // ... validation, logic, response
}
```

## Common patterns used:

1. **Direct auth + business logic** — Most V1 handlers
2. **`withAuth()` wrapper** — Some V1 handlers
3. **`requireTenantSession()` + envelope** — V2 handlers
4. **No auth** — Public endpoints (universities list, etc.)

---

# 17. Middleware

## Next.js Middleware (`/middleware.ts`)

**Execution Order:** First, before any route handler

**Purpose:**
1. Supabase SSR session refresh (via `updateSession()`)
2. SUPER_ADMIN bypass (skips all redirects)
3. Last-page tracking (cookie for non-public paths)
4. Redirect logged-in users away from public pages
5. Redirect unauthenticated users from dashboard

**Matcher:**
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

## Auth Middleware (`src/lib/auth-middleware.ts`)

**Execution Order:** Inside route handlers (as wrapper)

**Purpose:**
- Resolve auth session (web cookies or mobile JWT)
- Validate role requirements
- Return 401/403 on failure

---

# 18. Utilities

## Key Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `utils.ts` | `cn()`, `formatDistanceToNow()`, `formatScore()`, `truncate()` | Shared utilities |
| `pagination.ts` | — | Cursor-based pagination |
| `logger.ts` | — | Logging |
| `admin-logger.ts` | — | Admin audit logging |
| `markdown-helpers.ts` | — | Markdown processing |
| `captcha.ts` | — | Turnstile CAPTCHA verification |
| `env.ts` | — | Environment variable access |
| `cache-config.ts` | — | Cache configuration |
| `broadcast.ts` | — | Broadcast utilities |
| `platform-copy.ts` | — | Platform copy/text |
| `site-ai-options.ts` | — | AI options from site config |
| `essay-grade.ts` | — | Essay grading utilities |
| `api-config.ts` | — | API configuration |
| `engagement.ts` | — | Engagement tracking |
| `badges.ts` | — | Badge definitions |
| `bot-commander.ts` | — | Bot command handler |
| `branding-extract-color.ts` | — | Color extraction |
| `chat-cache.ts` | — | AI chat caching |
| `dashboard-queries.ts` | — | Dashboard data queries |
| `dashboard-stats.ts` | — | Dashboard statistics |
| `download-helper.ts` | — | Download utilities |
| `fetch-user-for-profile.ts` | — | User profile data |
| `flashcard-engine.ts` | — | SM-2 spaced repetition |
| `forum-posts.ts` | — | Forum post helpers |
| `guest-quiz.ts` | — | Guest quiz logic |
| `lecture-activity.ts` | — | Lecture activity tracking |
| `lecture-navigation.ts` | — | Lecture navigation |
| `normalize-question.ts` | — | Question normalization |
| `ocr.ts` | — | OCR via Tesseract |
| `quiz-attempt-items.ts` | — | Quiz attempt item builder |
| `quiz-attempt-score.ts` | — | Score computation |
| `rate-limits.ts` | — | Rate limiting config |
| `security-monitor.ts` | — | Security monitoring |
| `student-onboarding.ts` | — | Student onboarding |
| `telegram-auth.ts` | — | Telegram auth helpers |
| `telegram-client.ts` | — | Telegram MTProto client |
| `telegram-storage.ts` | — | Telegram storage |
| `tma-auth.ts` | — | Telegram Mini App auth |
| `tts.ts` | — | Text-to-speech |
| `video-utils.ts` | — | Video processing |
| `redis.ts` | — | Redis client + rate limiting |
| `store.ts` | — | Zustand stores |

---

# 19. Configuration

## Environment Variables

The project uses a `.env` file at root. **This file is committed to git!**

### Database
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooler connection string (with `pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection string |

### Supabase Auth
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (SECRET — committed!) |
| `NEXTAUTH_SECRET` | Session secret (placeholder value) |
| `NEXTAUTH_URL` | `http://localhost:3000` |

### AI Providers
| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` through `GEMINI_API_KEY_5` | 5 Google Gemini keys |
| `DEEPSEEK_API_KEY` | DeepSeek key |
| `GROQ_API_KEY` | Groq key |
| `OPENAI_API_KEY` | OpenAI key |
| `MANUS_API_KEY` | Manus AI key |
| `SILICONFLOW_API_KEY` | SiliconFlow key |
| `SILICON_FLOW_API_KEY` | Duplicate of above |

### Social Auth
| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `FACEBOOK_CLIENT_ID` | Facebook app ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook app secret |

### Telegram
| Variable | Value |
|----------|-------|
| `TELEGRAM_BOT_TOKEN` | Bot token |
| `TELEGRAM_STORAGE_GROUP_ID` | Storage group |
| `TELEGRAM_API_ID` | MTProto API ID |
| `TELEGRAM_API_HASH` | MTProto API hash |
| `TELEGRAM_STRING_SESSION` | Session string |

### File Storage
| Variable | Value |
|----------|-------|
| `S3_BUCKET` | `medqs-uploads` |
| `S3_REGION` | `auto` |
| `S3_ACCESS_KEY` | Empty |
| `S3_SECRET_KEY` | Empty |
| `S3_ENDPOINT` | Empty |
| `UPLOADTHING_TOKEN` | UploadThing v7 token |
| `USE_LOCAL_FILE_UPLOAD` | `true` (dev) |

### Payment/Captcha
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key |

### Google Sheets
| Variable | Value |
|----------|-------|
| `GOOGLE_SHEETS_SERVICE_ACCOUNT` | Full service account JSON (committed!) |

### Email
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `medonex.official1@gmail.com` |
| `SMTP_PASS` | Gmail App Password |

### Push Notifications
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key |
| `VAPID_PRIVATE_KEY` | VAPID private key |

## Production vs Development

| Setting | Development | Production |
|---------|-------------|-----------|
| `NODE_ENV` | development | production |
| `USE_LOCAL_FILE_UPLOAD` | true | false (not supported) |
| `NEXTAUTH_URL` | `http://localhost:3000` | Production URL |
| Redis | Local or Upstash | Upstash |
| Deployment | next dev | Vercel |

## Feature Flags

Stored in `FeatureFlag` model with university-scoped toggles.

Current flags:
- `v2_org_content_assessment` — Controls V2 org/content/assessment features

---

# 20. Security Audit

## CRITICAL ISSUES

### 1. Secrets Committed to Git

**Severity:** CRITICAL
**Affected:** `.env` file (committed)
**Issues:**
- 5 Google Gemini API keys
- Supabase service role key (full database access)
- Google OAuth client secret
- Facebook OAuth app secret
- Gmail SMTP password
- SendGrid API key
- Google Sheets service account JSON (with private key)
- UploadThing token
- OpenAI API key
- DeepSeek API key
- Groq API key
- Turnstile secret key
- VAPID private key
- Firebase Admin SDK private key
- Telegram bot token
- Telegram API hash + string session
- All AI provider keys

**Mitigation:** Rotate ALL keys immediately. Remove `.env` from git. Add to `.gitignore`. Use Vercel environment variables for production.

### 2. JWT Fallback Secret in Source Code

**Severity:** CRITICAL
**File:** `src/lib/supabase/auth-helpers.ts:6`
**Code:**
```javascript
process.env.MOBILE_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
```
**Issue:** Hardcoded fallback JWT secret. If all env vars are unset, the JWT signing key is a public string.

**Attack Scenario:** An attacker can forge JWTs using the fallback secret, impersonating any user.

**Mitigation:** Require at least one auth secret env var. Remove the fallback.

### 3. Supabase Service Role Key Exposed

**Severity:** CRITICAL
**File:** `.env` (committed)
**Issue:** The `SUPABASE_SERVICE_ROLE_KEY` provides full admin access to the Supabase project, including user management, database operations, and auth overrides.

**Mitigation:** Rotate key. Restrict service role key usage. Use RLS policies.

### 4. No CSRF Protection

**Severity:** HIGH
**Issue:** API endpoints accept requests with no CSRF token validation. CORS headers allow any origin (`Access-Control-Allow-Origin: *`).

**Attack Scenario:** Cross-site request forgery on authenticated endpoints.

**Mitigation:** Implement CSRF tokens or SameSite cookies.

## HIGH SEVERITY

### 5. No Rate Limiting on Most Endpoints

**Severity:** HIGH
**Issue:** Only registration has IP-based rate limiting. Login, password reset, and all other endpoints are unprotected.

**Attack Scenario:** Brute-force login, API abuse, DDoS.

**Mitigation:** Implement rate limiting on all auth endpoints and sensitive operations.

### 6. Mass Assignment Risk in User Updates

**Severity:** HIGH
**Issue:** Generic user update endpoints may allow updating sensitive fields (role, points, isLeader).

**Mitigation:** Whitelist allowed fields for user updates.

### 7. Weak NEXTAUTH_SECRET

**Severity:** HIGH
**File:** `.env`
**Value:** `"your-super-secret-key-change-this-in-production"`
**Issue:** The NextAuth secret is a placeholder value. If used in production, it's easily guessable.

**Mitigation:** Generate a cryptographically random secret.

### 8. File Upload Path Traversal (Local Storage)

**Severity:** HIGH
**File:** `src/lib/storage.ts:82-88`
**Issue:** When `USE_LOCAL_FILE_UPLOAD=true`, the `folder` parameter is used in file path construction. If the folder name is user-controlled, path traversal is possible.

**Mitigation:** Validate/sanitize folder parameters.

## MEDIUM SEVERITY

### 9. No Input Sanitization for AI-Generated Content

**Issue:** AI-generated content (markdown, flashcards, notes) is stored and rendered without sanitization.

**Mitigation:** Sanitize AI output before rendering, especially if displayed to other users.

### 10. SQL Injection Risk in Raw Queries

**File:** `src/lib/ai-context-builder.ts`
**Issue:** Uses `Prisma.sql` tagged template with interpolated value. While Prisma's SQL tag is safe, the raw SQL approach increases risk surface.

**Mitigation:** Use Prisma's type-safe query builder where possible.

### 11. Weak Password Reset Flow

**Issue:** Password reset appears to delegate to Supabase, but the local `User.password` field is also stored. The project needs to ensure both are updated.

### 12. No Security Headers

**Issue:** No explicit Content-Security-Policy, X-Frame-Options, X-Content-Type-Options headers.

**Mitigation:** Add security headers via Next.js config or middleware.

## LOW SEVERITY

### 13. Information Disclosure in Error Messages

**Issue:** Detailed error messages are returned to clients (e.g., "Gemini error (403) [KEY_1/gemini-2.0-flash]: ...").

### 14. Redis No Authentication

**Issue:** Redis connection URL in local dev would be unauthenticated if using local redis.

### 15. Math.random() for Request IDs

**File:** `src/platform/api/envelope.ts:17`
**Issue:** `Math.random()` is not cryptographically secure.

---

# 21. Performance Audit

## Critical Issues

### 1. No Database Connection Pool Limits

**Issue:** `connection_limit` is appended to the connection URL but Prisma manages its own pool. With Vercel's serverless architecture, each invocation may create a new connection.

**Mitigation:** Configure Prisma's connection pool properly. Use Supabase's built-in PgBouncer (already configured via `pgbouncer=true` in URL).

### 2. N+1 Query Pattern in AI Context Builder

**File:** `src/lib/ai-context-builder.ts`
**Issue:** Multiple sequential queries for syllabus, quiz, and leaderboard data.

**Impact:** High latency for AI chat context building (3+ sequential DB queries + raw SQL joins).

### 3. Large Payload in Question Extraction

**File:** `src/lib/gemini.ts:216`
**Issue:** Text truncated at 15,000 chars. If source text is larger, context is lost.

## Medium Issues

### 4. No Response Caching on Most Endpoints

**Issue:** Only the root layout caches site config via `unstable_cache`. Most API endpoints have `Cache-Control: no-store`.

### 5. AI Chat is Blocking

**Issue:** AI chat requests are synchronous (no streaming). Vercel has a 10-second timeout for serverless functions. AI responses often exceed this.

**Mitigation:** Implement streaming for AI chat. Use Edge functions or longer timeouts.

### 6. Redis Cache TTL Too Short (30s)

**File:** `src/lib/auth.ts:21`
**Issue:** Auth session cached for only 30 seconds, defeating most caching benefit.

**Mitigation:** Increase to 5-15 minutes with background refresh.

### 7. Email Verification Sent After Response (Fire-and-Forget)

**File:** `src/app/api/v1/auth/register/route.ts` 
**Issue:** Email is sent as fire-and-forget after the HTTP response. If the email fails, the user is not notified.

## Low Issues

### 8. Duplicate Redis Connections

**Issue:** Multiple imports of `redis.ts` could create multiple connections (though the singleton pattern should prevent this).

### 9. No Query Result Limits on Some Endpoints

**Issue:** Some endpoints may return large result sets without pagination.

### 10. Large Prisma Schema Impacts Cold Start

**Issue:** With ~95 models, Prisma client generation is large. This impacts Vercel cold start times.

---

# 22. Caching

## Current Caching Strategy

| Cache | Technology | Usage | TTL | Invalidation |
|-------|-----------|-------|-----|-------------|
| Auth Session | Redis | `cacheGet('auth:{userId}')` | 30s | Inline write |
| Rate Limits | Redis | `INCR` with `EXPIRE` | 3600s | Auto-expire |
| Site Config | Next.js `unstable_cache` | `getCachedSiteConfig()` | 3600s | Tag-based (`site-config`) |
| AI Response | PostgreSQL (`AiResponseCache`) | `questionHash` lookup | Permanent | Update on read |
| PWA Resources | Service Worker | 6-tier runtime caching | 7d-365d | Workbox |

## Missing Caches

| What Should Be Cached | Why |
|-----------------------|-----|
| User profiles | Frequently accessed on every page load |
| Module/Lecture tree | Static academic structure |
| Quiz question lists | Read-heavy, write-rare |
| University/Faculty lists | Almost static |
| AI chat responses (for identical prompts) | Reduces API costs |

---

# 23. Logging

## Current Logging

| Log Type | Implementation | Persistence |
|----------|---------------|-------------|
| Console | `console.log()`, `console.warn()`, `console.error()` | Vercel logs |
| Admin Audit | `AdminActionLog` model | Database |
| Security Events | `SecurityEvent` model | Database |
| AI Usage | `AIUsageLog` model | Database |
| Engagement | `EngagementLog` model | Database |
| Page Views | `PageView` model | Database |
| User Sessions | `UserSessionLog` model | Database |
| Video Views | `VideoViewTracking` model | Database |

## Missing Logging

- No structured logging (JSON format)
- No log levels (debug, info, warn, error)
- No centralized log aggregation
- No error tracking integration (Sentry, Datadog)
- No request/response logging for debugging
- No performance/APM monitoring

---

# 24. Error Handling

## Patterns

### V1 API
```typescript
try {
  // logic
  return NextResponse.json({ data });
} catch (error) {
  console.error("[ROUTE] Error:", error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
```

### V2 API
```typescript
try {
  const result = await someOperation();
  return ok({ result });
} catch (error) {
  return fail({ error: "Operation failed", status: 500 });
}
```

### Auth Middleware
```typescript
function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}
function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}
```

## Error Handling Gaps

| Gap | Impact |
|-----|--------|
| No global error boundary for API routes | Unhandled errors may crash the Vercel function |
| No error classification | All errors result in 500 |
| No error codes | Clients cannot programmatically handle errors |
| No retry logic for external services (except Prisma) | Transient failures propagate to user |
| Mixed error formats across V1 endpoints | Client needs to handle multiple error shapes |

---

# 25. Background Jobs

## Current Jobs

| Job | Schedule | Implementation | Purpose |
|-----|----------|---------------|---------|
| Forum Cleanup | Daily at 4 AM | Vercel Cron (`/api/cron/forum-cleanup`) | Clean up expired forum posts |
| YouTube Playlist Sync | On-demand | `PlaylistSyncTask` | Sync YouTube playlists |
| Telegram Migration | On-demand | `TelegramMigrationTask` | Migrate content to Telegram |
| Daily Study Sync | Cron | `/api/v1/cron/daily-sync` | Daily sync tasks |

## Missing Background Jobs

| Job Needed | Reason |
|------------|--------|
| Quiz attempt recalculation | For fixing scores after question changes |
| Flashcard due notification | Notify users of due flashcards |
| Leaderboard recalculation | Periodic point recalculation |
| Email queue | Transactional emails should be queued |
| Stale session cleanup | Remove expired sessions |
| AI usage quota tracking | Reset daily counters |

---

# 26. Storage

## File Storage Architecture

```mermaid
graph TD
    subgraph "Upload Flow"
        Client -->|upload| API
        API -->|local?| Local[public/uploads/]
        API -->|image?| Cloudinary
        API -->|pdf/doc?| UploadThing
    end
    
    subgraph "Storage Backends"
        Local
        Cloudinary
        UploadThing
        R2[AWS S3 / Cloudflare R2]
    end
    
    subgraph "Not Used"
        R2
    end
```

## File Types and Limits

| Type | Allowed MIME Types | Max Size | Storage |
|------|-------------------|----------|---------|
| Lecture | video/mp4, video/webm, video/ogg, application/pdf, images | 100 MB | Cloudinary/UploadThing |
| Past Paper | application/pdf | 50 MB | UploadThing |
| Avatar | image/jpeg, image/png, image/webp, image/gif | 5 MB | Cloudinary |
| Ad | image/jpeg, image/png, image/webp | 10 MB | Cloudinary |
| Forum | image/jpeg, image/png, image/webp, image/gif | 8 MB | Cloudinary |
| Question | image/jpeg, image/png, image/webp | 8 MB | Cloudinary |
| Site Logo | images + SVG + AVIF + BMP | 10 MB | Cloudinary |
| AI Chat | images only | 2 MB | Cloudinary |
| Template | .docx, .doc | 32 MB | UploadThing |

---

# 27. Realtime

## Current Realtime Features

| Feature | Technology | Implementation |
|---------|-----------|---------------|
| Notifications | Redis Pub/Sub | `publishNotification()`, `broadcastNotification()` |
| Study Room Chat | StudyRoomPost model | Polling or reload |
| Presence | Redis + API | `useRoomPresence` hook |

## Limitations

- No WebSocket support (no Socket.io, no WebSocket server)
- Redis pub/sub has no subscriber in the main app — mentioned in code but no consumer
- Study room realtime features rely on polling
- Notification delivery depends on client-side polling

---

# 28. Infrastructure

## Deployment Architecture

```mermaid
graph TD
    subgraph "Vercel"
        NextJS[Next.js App]
        API[API Routes]
        Cron[Cron Jobs]
        PWA[Service Worker]
    end
    
    subgraph "Supabase"
        PG[(PostgreSQL)]
        Auth[Auth Service]
        Storage[Storage]
    end
    
    subgraph "Upstash"
        Redis[(Redis)]
    end
    
    subgraph "Cloudflare"
        Worker[Telegram Worker]
        Turnstile[Turnstile CAPTCHA]
        R2[S3-compatible Storage]
    end
    
    subgraph "External Services"
        Google[Google Gemini AI]
        Groq[Groq AI]
        OpenAI[OpenAI]
        Anthropic[Anthropic Claude]
        Cloudinary[Cloudinary CDN]
        UT[UploadThing]
        Gmail[Gmail SMTP]
        Firebase[Firebase FCM]
    end
    
    NextJS --> PG
    NextJS --> Auth
    NextJS --> Redis
    NextJS --> Worker
    NextJS --> Google
    NextJS --> Groq
    NextJS --> Cloudinary
    NextJS --> UT
    NextJS --> Gmail
    NextJS --> Firebase
    Worker --> TG[Telegram API]
```

## Deployment Configuration

| Service | Provider | Region | Plan |
|---------|----------|--------|------|
| Web App | Vercel | auto (default) | Hobby/Pro |
| Database | Supabase | EU Central 1 (aws-1-eu-central-1) | Free/Pro |
| Redis | Upstash | Global | Free/Pro |
| Telegram Worker | Cloudflare Workers | Global | Free |
| File Storage | Cloudinary + UploadThing | Various | Free tier |
| Email | Gmail SMTP | — | Free (500/day limit) |

## CI/CD

- **Platform:** Vercel
- **Build:** `next build`
- **Deploy:** Auto-deploy on git push to main branch
- **Preview:** Vercel preview deployments for PRs
- **Cron:** Vercel Cron Jobs (`vercel.json`)

## Scaling

| Component | Scaling Strategy | Limit |
|-----------|-----------------|-------|
| Web App | Vercel auto-scaling (serverless) | Max 10 concurrent functions (Hobby) |
| Database | Supabase connection pooling (PgBouncer) | 15 connections (configurable) |
| Redis | Upstash auto-scaling | Varies by plan |
| File Uploads | UploadThing CDN | 2GB free |

---

# 29. Testing

## Current Test Coverage

**Extremely low.** Only 3 test files found:

| File | Type | Coverage |
|------|------|----------|
| `src/lib/__tests__/ai.test.ts` | Unit | AI router |
| `src/lib/__tests__/quiz.test.ts` | Unit | Quiz logic |
| `src/lib/__tests__/auth.test.ts` | Unit | Auth logic |

**Configuration:** Vitest with `vite-tsconfig-paths` plugin
```
Pattern: src/**/*.test.ts
Environment: node
```

## Missing Tests

| Area | Impact |
|------|--------|
| API routes | No integration tests for any endpoint |
| Auth flow | No tests for auth middleware, JWT, Supabase integration |
| Database queries | No tests for repository layer |
| Business logic | No tests for registration, quiz scoring, gamification |
| AI integration | No tests for AI provider fallback, JSON parsing |
| Validation | No tests for Zod schemas |
| Edge cases | Rate limiting, error handling, race conditions |
| E2E | No Playwright/Cypress tests |

---

# 30. Code Quality

## Strengths

1. **TypeScript strict mode** enabled throughout
2. **Singleton patterns** for Prisma, Redis — prevents connection leaks
3. **Repository layer** for data access (though minimal)
4. **Consistent error handling** within V2 API
5. **Feature flags** for gradual rollout
6. **Multi-tenant awareness** built into data layer
7. **ADRs** documenting key architectural decisions
8. **Comprehensive Prisma schema** with proper indexes and relations
9. **Graceful degradation** for Redis failures in dev
10. **Retry logic** for transient DB connection drops

## Weaknesses

1. **Dead code:** Redis pub/sub has publishers but no subscribers
2. **Duplicate Prisma queries** in some route handlers
3. **Inconsistent patterns** between V1 and V2 API
4. **Business logic in route handlers** — no service layer separation
5. **No dependency injection** — hard imports everywhere
6. **Circular import risk** with barrel exports and cross-references
7. **Large file sizes:** `schema.prisma` (2803 lines), `gemini.ts` (939 lines), `ai-router.ts` (649 lines)
8. **No input sanitization** for AI-generated content
9. **Mixed concerns** in route handlers (auth + validation + business logic + DB access + response)
10. **No API versioning strategy** beyond the folder structure

## SOLID Violations

| Principle | Violation | File |
|-----------|-----------|------|
| **S**ingle Responsibility | Route handlers do too much | Most V1 routes |
| **O**pen/Closed | Adding a new provider requires modifying ai-router.ts | `ai-router.ts` |
| **L**iskov Substitution | DevBypass returns different shape than auth session | `dev-auth.ts` |
| **I**nterface Segregation | AuthMiddleware returns too many optional fields | `auth-middleware.ts` |
| **D**ependency Inversion | Direct Prisma imports throughout codebase | Multiple files |

---

# 31. Dependency Audit

| Dependency | Version | Purpose | Necessity | Replacement Suggestion |
|-----------|---------|---------|-----------|----------------------|
| next | 14.2.5 | Web framework | **Critical** | — |
| react / react-dom | 18 | UI framework | **Critical** | — |
| @prisma/client / prisma | 5.17.0 | ORM | **Critical** | Drizzle ORM (lighter) |
| @supabase/ssr | 0.12.0 | Auth | **Critical** | — |
| @supabase/supabase-js | 2.105.4 | Auth | **Critical** | — |
| ioredis | 5.4.1 | Redis client | **High** | — |
| zod | 3.25.76 | Validation | **Critical** | — |
| bcryptjs | 2.4.3 | Password hashing | **High** | — |
| jose | 6.2.3 | JWT | **High** | jsonwebtoken (more common) |
| @google/generative-ai | 0.21.0 | Gemini AI | **High** | — |
| openai | 6.37.0 | OpenAI API | **Medium** | Remove if not used directly |
| groq-sdk | 1.1.2 | Groq API | **Medium** | Use REST API directly |
| telegraf | 4.16.3 | Telegram bot | **High** | — |
| nodemailer | 7.0.13 | Email | **High** | Resend (already in deps!) |
| resend | 6.12.3 | Email | **Low** | Duplicate with nodemailer |
| uploadthing | 7.7.4 | File uploads | **High** | — |
| cloudinary | 2.9.0 | Image CDN | **High** | — |
| firebase / firebase-admin | 12/13 | Push, config | **Medium** | Consider removing Firestore |
| framer-motion | 11.18.2 | Animations | **Medium** | — |
| @tiptap/* | 3.23.6 | Rich text | **High** | — |
| @aws-sdk/client-s3 | 3.614.0 | S3 storage | **Low** | Not used (no keys configured) |
| puppeteer | 24.42.0 | PDF generation | **Low** | Heavy dependency |
| assemblyai | 4.32.1 | Transcription | **Low** | — |
| tesseract.js | 7.0.0 | OCR | **Low** | — |
| @excalidraw/excalidraw | 0.18.1 | Whiteboard | **Low** | Large bundle |
| @capacitor/* | 8.3.0 | Native wrapper | **Medium** | — |
| @tanstack/react-virtual | 3.13.26 | Virtual lists | **Low** | — |

---

# 32. Execution Flow

## Server Startup Sequence

```mermaid
sequenceDiagram
    participant Vercel as Vercel Platform
    participant Next as Next.js Server
    participant Prisma
    participant Redis
    participant Supabase
    participant DB as PostgreSQL
    
    Note over Vercel,DB: BUILD TIME
    
    Vercel->>Next: npm run postinstall
    Next->>Prisma: prisma generate
    Prisma-->>Next: Client generated
    
    Vercel->>Next: next build
    Note over Next: Build all pages and API routes
    
    Note over Vercel,DB: RUNTIME (First Request)
    
    Vercel->>Next: Lambda invocation
    Next->>Next: Initialize module scope
    
    Note over Next: Module init order:
    Note over Next: 1. prisma.ts - Create PrismaClient singleton
    Note over Next: 2. redis.ts - Create Redis singleton (lazy)
    Note over Next: 3. email.ts - Create Nodemailer transport, verify connection
    Note over Next: 4. cloudinary.ts - Configure Cloudinary SDK
    Note over Next: 5. Other lib modules
    
    Next->>Middleware: Execute middleware.ts
    Middleware->>Supabase: updateSession() - refresh cookies
    
    Next->>Route: Execute route handler
    
    Route->>Prisma: First query
    Prisma->>DB: Connect via Supabase pooler
    DB-->>Prisma: Connection established
    
    Route->>Redis: First operation (if needed)
    Redis->>Redis: Lazy connect
    
    Route-->>Client: Response
    
    Note over Vercel: Lambda stays warm for ~15-30 min
    Note over Vercel: After idle → cold start next request
```

## Server Hot Path

```mermaid
flowchart LR
    A[HTTP Request] --> B[Vercel Edge/Lambda]
    B --> C[Next.js Router]
    C --> D[Middleware]
    D --> E{Route Type?}
    E -->|Page| F[React Server Component]
    E -->|API| G[Route Handler]
    E -->|Static| H[CDN Cache]
    F --> I[Response HTML]
    G --> J[Response JSON]
    H --> K[Cached Response]
```

---

# 33. Architecture Diagrams

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Users"
        WEB[Web Browser]
        MOBILE[Mobile App]
        TG[Telegram]
    end
    
    subgraph "Vercel (Serverless)"
        NEXT[Next.js App]
        API_V1[API V1 Routes]
        API_V2[API V2 Routes]
        API_MOBILE[Mobile Routes]
        MW[Middleware]
        PWA[Service Worker]
    end
    
    subgraph "Data Layer"
        SUPABASE[Supabase]
        PG[(PostgreSQL)]
        REDIS[Upstash Redis]
    end
    
    subgraph "Storage"
        CLD[Cloudinary]
        UT[UploadThing]
    end
    
    subgraph "AI Providers"
        GEMINI[Google Gemini]
        GROQ[Groq AI]
        PROXY[Claude Proxy]
        DDG[DuckDuckGo]
        SF[SiliconFlow]
        HF[HuggingFace]
    end
    
    subgraph "External"
        GMAIL[Gmail SMTP]
        FCM[Firebase]
        CF[Cloudflare]
        YT[YouTube API]
        SPOTIFY[Spotify API]
    end
    
    WEB --> NEXT
    MOBILE --> API_MOBILE
    TG --> CF
    CF --> API_V1
    
    NEXT --> API_V1
    NEXT --> API_V2
    
    API_V1 --> SUPABASE
    API_V1 --> PG
    API_V1 --> REDIS
    
    API_V2 --> PG
    API_V2 --> REDIS
    
    API_MOBILE --> SUPABASE
    API_MOBILE --> PG
    
    API_V1 --> CLD
    API_V1 --> UT
    API_V2 --> CLD
    API_V2 --> UT
    
    API_V1 --> GEMINI
    API_V1 --> GROQ
    API_V1 --> PROXY
    API_V1 --> DDG
    API_V1 --> SF
    API_V1 --> HF
    
    API_V1 --> GMAIL
    API_V1 --> FCM
    API_V1 --> YT
    API_V1 --> SPOTIFY
```

## Auth Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant MW as Middleware
    participant API
    participant Supabase
    participant DB
    participant Redis
    
    Note over User,Redis: WEB AUTH FLOW
    
    User->>Client: Login form submit
    Client->>Supabase: supabase.auth.signInWithPassword()
    Supabase-->>Client: Session cookies set
    Client->>API: Request + cookies
    API->>Supabase: supabase.auth.getUser()
    Supabase-->>API: User object
    API->>Redis: cacheGet(auth:{id})
    alt Cache Miss
        API->>DB: Fetch user role + scope
        API->>Redis: cacheSet(auth:{id})
    end
    API-->>Client: Response
    
    Note over User,Redis: MOBILE AUTH FLOW
    
    User->>Client: Login
    Client->>API: POST /api/mobile/login { email, password }
    API->>DB: findUserByEmail(email)
    API->>API: bcrypt.compare(password, hash)
    API->>API: createMobileToken(user)
    API-->>Client: { token: "eyJ..." }
    Client->>API: Request + Bearer token
    API->>API: verifyMobileToken(token)
    API->>API: Extract user info from JWT
    API-->>Client: Response
    
    Note over User,Redis: REGISTRATION FLOW
    
    User->>Client: Register form
    Client->>API: POST /api/v1/auth/register
    API->>API: Validate CAPTCHA
    API->>API: Validate input (Zod)
    API->>Redis: Rate limit check
    API->>DB: Verify Telegram code
    API->>DB: Check uniqueness
    API->>Supabase: admin.createUser()
    API->>DB: Create User + cleanup BotAuth
    API-->>Client: 201 Created
```

## Database ER Diagram (Core Models)

```mermaid
erDiagram
    User {
        string id PK
        string name
        string email UK
        string nickname UK
        string password
        string role
        int points
        string studentCode UK
        string universityId FK
        string semesterId FK
        string facultyId FK
        string telegramId UK
        boolean isLeader
    }
    
    University {
        string id PK
        string name
        string abbr
    }
    
    Faculty {
        string id PK
        string name
        string universityId FK
        string category
    }
    
    AcademicYear {
        string id PK
        int yearNumber
        string universityId FK
        string facultyId FK
    }
    
    Semester {
        string id PK
        string name
        string academicYearId FK
    }
    
    Module {
        string id PK
        string name
        string semesterId FK
    }
    
    Subject {
        string id PK
        string name
        string moduleId FK
        string semesterId FK
    }
    
    Lecture {
        string id PK
        string title
        string subjectId FK
        string videoUrl
        int order
    }
    
    Question {
        string id PK
        string body
        Json choices
        string answer
        string lectureId FK
        string difficulty
        string questionType
    }
    
    PastPaper {
        string id PK
        string title
        string semesterId FK
        string moduleId FK
        boolean isInteractive
    }
    
    QuizAttempt {
        string id PK
        int score
        string userId FK
        string pastPaperId FK
        int timeTaken
    }
    
    Post {
        string id PK
        string content
        string authorId FK
        string forumId FK
        string universityId FK
        datetime createdAt
    }
    
    Forum {
        string id PK
        string name
        string type
        string universityId FK
        string semesterId FK
    }
    
    Comment {
        string id PK
        string content
        string authorId FK
        string postId FK
        string parentId FK
    }
    
    User ||--o{ Post : authors
    User ||--o{ Comment : authors
    User ||--o{ QuizAttempt : takes
    User }o--|| University : belongs-to
    User }o--|| Semester : enrolled-in
    
    University ||--o{ Faculty : has
    University ||--o{ AcademicYear : has
    University ||--o{ Forum : hosts
    
    AcademicYear ||--o{ Semester : contains
    
    Semester ||--o{ Module : contains
    Semester ||--o{ PastPaper : has
    
    Module ||--o{ Subject : has
    
    Subject ||--o{ Lecture : contains
    
    Lecture ||--o{ Question : has
    
    PastPaper ||--o{ QuizAttempt : has
    
    Forum ||--o{ Post : contains
    
    Post ||--o{ Comment : has
    Post }o--|| User : authored-by
```

# 34. Improvement Roadmap

## Critical (Do Immediately)

| # | Improvement | Effort | Impact | Files Affected |
|---|-------------|--------|--------|---------------|
| 1 | Rotate ALL exposed secrets in `.env` | 2 hours | **CRITICAL** | `.env`, all external services |
| 2 | Remove `.env` from git, add to `.gitignore` | 10 min | **CRITICAL** | `.gitignore` |
| 3 | Remove JWT fallback secret in source code | 30 min | **CRITICAL** | `src/lib/supabase/auth-helpers.ts` |
| 4 | Implement rate limiting on all auth endpoints | 4 hours | **HIGH** | Auth route handlers |
| 5 | Add CSRF protection | 8 hours | **HIGH** | Middleware, all POST routes |
| 6 | Restrict Supabase service role key usage | 2 hours | **CRITICAL** | `supabase/admin.ts` |

## High (Within 1 Week)

| # | Improvement | Effort | Impact | Files Affected |
|---|-------------|--------|--------|---------------|
| 7 | Add basic unit tests for auth/quiz/user flows | 16 hours | **HIGH** | `src/lib/__tests__/` |
| 8 | Standardize all V1 API responses to envelope format | 16 hours | **HIGH** | All V1 route handlers |
| 9 | Implement API key rotation for all third-party services | 4 hours | **HIGH** | Multiple env vars |
| 10 | Add security headers (CSP, X-Frame-Options, etc.) | 2 hours | **HIGH** | `next.config.js` or middleware |
| 11 | Implement request logging with correlation IDs | 8 hours | **HIGH** | Middleware, route handlers |
| 12 | Sanitize AI-generated content before storage/display | 4 hours | **HIGH** | AI route handlers |
| 13 | Add input validation for ALL route parameters (not just body) | 8 hours | **HIGH** | All route handlers |

## Medium (Within 1 Month)

| # | Improvement | Effort | Impact | Files Affected |
|---|-------------|--------|--------|---------------|
| 14 | Implement AI chat streaming | 16 hours | **HIGH** | `ai-router.ts`, chat routes |
| 15 | Separate business logic from route handlers into service layer | 40 hours | **HIGH** | All route handlers |
| 16 | Add comprehensive E2E tests for core flows | 40 hours | **HIGH** | New test files |
| 17 | Add database migration documentation and verification | 8 hours | **MEDIUM** | `prisma/migrations/` |
| 18 | Implement proper logging (Pino/Winston) | 8 hours | **MEDIUM** | New logger module |
| 19 | Add error monitoring (Sentry) | 4 hours | **MEDIUM** | `src/lib/` |
| 20 | Containerize with Docker for local development | 8 hours | **MEDIUM** | `Dockerfile`, `docker-compose.yml` |
| 21 | Increase auth session cache TTL (30s → 5min+) | 30 min | **MEDIUM** | `src/lib/auth.ts` |
| 22 | Add API documentation (OpenAPI/Swagger) | 24 hours | **MEDIUM** | New docs |

## Low (Within 3 Months)

| # | Improvement | Effort | Impact |
|---|-------------|--------|--------|
| 23 | Migrate from Prisma to Drizzle ORM (lighter, faster) | 40 hours | **LOW** |
| 24 | Implement GraphQL for complex queries | 80 hours | **LOW** |
| 25 | Add WebSocket support for realtime features | 40 hours | **LOW** |
| 26 | Implement SSO/SAML for enterprise universities | 40 hours | **LOW** |
| 27 | Add CI/CD pipeline with automated testing gate | 16 hours | **MEDIUM** |
| 28 | Implement database read replicas for scaling | 16 hours | **LOW** |
| 29 | Add performance monitoring (DataDog/NewRelic) | 8 hours | **LOW** |
| 30 | Refactor AI provider system to plugin architecture | 24 hours | **LOW** |
| 31 | Add Redis cache warming on deploy | 4 hours | **LOW** |
| 32 | Implement proper session management (server-side sessions) | 16 hours | **LOW** |

---

# 35. Overall Engineering Score

| Category | Score (out of 10) | Justification |
|----------|------------------|---------------|
| **Architecture** | **6.5** | Layered monolith is appropriate for this stage. V2 patterns show improvement. However, V1 routes lack structure, concerns are mixed, and there's no clear service boundary. Better than average for a Next.js monolith. |
| **Security** | **3.0** | **CRITICAL FAILURE.** Secrets committed to git, hardcoded JWT fallback, Supabase service role exposed, no CSRF, minimal rate limiting, weak NEXTAUTH_SECRET. Requires immediate remediation before production use. |
| **Performance** | **5.0** | No streaming for AI (Vercel timeout risk), N+1 queries in context builder, short cache TTLs, no query result limits on some endpoints. Basic performance patterns are in place (indexes, connection pooling) but no optimization effort evident. |
| **Maintainability** | **5.5** | Good use of TypeScript, singletons, and repositories. But large files (2800+ line schema, 900+ line Gemini), inconsistent patterns between V1/V2, no dependency injection, business logic in route handlers. |
| **Scalability** | **4.5** | Vercel serverless auto-scales, but Prisma connection pool limits, no read replicas, no message queues, no caching layer for most endpoints. Could handle moderate load but would struggle with growth. |
| **Documentation** | **6.0** | ADRs exist, ARCHITECTURE.md, CHANGELOG.md, detailed setup guide. However, no API docs (OpenAPI), no JSDoc, no architecture diagrams in code. Above average but significant gaps. |
| **Readability** | **6.5** | Clear naming conventions, consistent code style, TypeScript strict mode. Some overly complex functions (AI router, context builder) could be simplified. Good use of comments explaining WHY in addition to WHAT. |
| **Reliability** | **5.5** | Graceful degradation for Redis failures, Prisma retry logic, AI provider fallback chain. But no error monitoring, no health checks on most routes, fire-and-forget email, no circuit breakers for external services. |
| **Testing** | **1.5** | Only 3 unit test files found for a 2800+ line schema and 69 API route groups. Virtually no test coverage. This is the single biggest technical debt item. No CI gate enforcing tests. |
| **Production Readiness** | **4.0** | PWA works, Vercel deployment is solid, but the security issues (especially committed secrets) make this not production-ready. No monitoring, no proper logging, minimal error tracking. The feature set is production-worthy but the infrastructure is not. |

## Overall Score: **4.9/10**

### Summary

MedOneX is an **ambitious and feature-rich** medical education platform with impressive breadth of functionality. The AI integration, multi-provider fallback, Telegram bot, PWA support, and comprehensive academic content management show strong engineering capability.

However, the project suffers from **critical security vulnerabilities** (committed secrets, hardcoded JWT fallback) and **near-zero test coverage** that prevent it from being production-ready. The V2 architecture shows promising patterns for improvement, but the legacy V1 API carries significant technical debt.

**Top 3 Immediate Actions:**
1. Rotate ALL exposed secrets and remove `.env` from git
2. Remove hardcoded JWT fallback secret
3. Implement rate limiting and CSRF protection

**Top 3 Strategic Actions:**
1. Build comprehensive test suite (unit + integration)
2. Standardize API responses (envelope format for V1)
3. Separate business logic into service layer
