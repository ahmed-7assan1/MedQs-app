# خطة PLATFORM Admin Hub — التفصيلية الكاملة

> **شرط أساسي:** أثناء تنفيذ هذه الخطة، يجب الالتزام بالمهارات التالية وتطبيق مبادئها في كل جزء من العمل:
> 1. **Clean Code** — إبقاء الكود نظيفًا، readable، maintainable مع أسماء معبرة، دوال صغيرة، separation of concerns
> 2. **Senior Backend** — API design متين، validation, error handling, database optimization, security hardening
> 3. **Frontend Design** — واجهات متميزة غير مكررة، typography, color, motion, spatial composition, backgrounds
> 4. **Database Designer** — normalisation, indexing strategy, migration management, query performance
> 5. **SQL Database Assistant** — query optimisation, N+1 detection, EXPLAIN analysis, ORM patterns
> 6. **API Design Reviewer** — REST conventions, consistent response format, proper HTTP status codes, versioning
> 7. **Database Schema Designer** — ERD generation, constraints, multi-tenancy, audit trails, RLS
> 8. **Senior Fullstack** — architecture patterns, scaffold consistency, code quality analysis
> 9. **Supabase** — RLS policies, security checklist, auth patterns, schema management
> 10. **الـ UI design system الموجود** (`src/ui/design-system/`) — استخدام `V2Card`, `V2Kpi`, `V2Shell` و `v2Tokens`
>
> كل recommendation أو code output لازم يكون معاه:
> - Latency targets (p50, p95, p99)
> - Uptime / SLO target
> - Database indexing strategy
> - API response format
> - RLS policy
> - Migration rollback plan

---

## المحتويات

1. [الموديلات الجديدة في Prisma](#1-الموديلات-الجديدة-في-prisma)
2. [لوحة التحكم الرئيسية — Dashboard](#2-لوحة-التحكم-الرئيسية--dashboard)
3. [إدارة المستخدمين — Users Hub](#3-إدارة-المستخدمين--users-hub)
4. [نظام الإنذارات — Warnings](#4-نظام-الإنذارات--warnings)
5. [مراقبة الأدمنز — Admin Monitoring](#5-مراقبة-الأدمنز--admin-monitoring)
6. [لوحة الأمان — Security Dashboard](#6-لوحة-الأمان--security-dashboard)
7. [تحليلات الفيديو — Video Analytics](#7-تحليلات-الفيديو--video-analytics)
8. [لوحة المتصدرين — Leaderboard](#8-لوحة-المتصدرين--leaderboard)
9. [تحليلات الاختبارات — Quiz Analytics](#9-تحليلات-الاختبارات--quiz-analytics)
10. [متصفح المحتوى — Content Browser & Editor](#10-متصفح-المحتوى--content-browser--editor)
11. [الإعدادات المتقدمة — PLATFORM Settings](#11-الإعدادات-المتقدمة--platform-settings)
12. [الـ Audit Logs المحسّن](#12-الـ-audit-logs-المحسّن)
13. [صفحة ملف المستخدم التفصيلي](#13-صفحة-ملف-المستخدم-التفصيلي)
14. [الـ Sidebar الجديد](#14-الـ-sidebar-الجديد)
15. [تحليلات إضافية — Extra Analytics](#15-تحليلات-إضافية--extra-analytics)
16. [API Routes Summary](#16-api-routes-summary)
17. [تسلسل التنفيذ (Phases)](#17-تسلسل-التنفيذ-phases)

---

> **ملاحظة:** عدد المستخدمين المتوقع خلال 12 شهرًا: 50,000+ طالب. الـ read/write ratio: 80/20 (قراءة كثيفة). النظام multi-tenant بالجامعات والكليات والسنين والسمسترات. البيانات sensitivity tier: PII (إيميلات، أسماء). الـ SLO target: 99.5% uptime, p95 API latency < 500ms, p99 < 1200ms. RPO: 1 hour, RTO: 4 hours.

---

## 1. الموديلات الجديدة في Prisma

### 1.1 Warning (نظام الإنذارات)

```prisma
enum WarningSeverity {
  MILD
  MODERATE
  SEVERE
  CRITICAL
}

enum WarningStatus {
  ACTIVE
  EXPIRED
  REVOKED
  SERVED
}

model Warning {
  id           String          @id @default(uuid())
  userId       String
  issuedById   String
  severity     WarningSeverity @default(MODERATE)
  status       WarningStatus   @default(ACTIVE)
  reason       String
  description  String?
  notes        String?
  expiresAt    DateTime?
  revokedAt    DateTime?
  revokedById  String?
  revokeReason String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  issuedBy     User    @relation("IssuedWarnings", fields: [issuedById], references: [id])
  revokedBy    User?   @relation("RevokedWarnings", fields: [revokedById], references: [id])

  @@index([userId, status])
  @@index([issuedById])
  @@index([createdAt])
  @@index([severity])
}
```

**Migration strategy (zero-downtime):**
```sql
-- Step 1: Create table (expand)
CREATE TABLE "Warning" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "issuedById" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'MODERATE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "notes" TEXT,
  "expiresAt" TIMESTAMPTZ,
  "revokedAt" TIMESTAMPTZ,
  "revokedById" TEXT,
  "revokeReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add indexes (concurrently for production)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Warning_userId_status_idx" ON "Warning" ("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Warning_createdAt_idx" ON "Warning" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Warning_severity_idx" ON "Warning" ("severity");

-- Step 3: Add foreign keys (contract)
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id");
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id");

-- Rollback:
-- DROP TABLE "Warning";
```

### 1.2 AdminActionLog (مراقبة الأدمنز)

```prisma
model AdminActionLog {
  id           String   @id @default(uuid())
  adminId      String
  action       String   // CREATE | UPDATE | DELETE | BULK_DELETE | EXPORT | LOGIN
  entityType   String   // USER | QUESTION | LECTURE | PAST_PAPER | POST | COMMENT | SETTING | FILE | AD | FORUM | WARNING | REPORT | QUIZ | FLASHCARD | NOTE | SITE_CONFIG
  entityId     String?
  previousState Json?   // قبل التعديل
  newState     Json?    // بعد التعديل
  description  String?
  ipAddress    String?
  userAgent    String?
  metadata     Json?    // HTTP method, path, duration, etc.
  createdAt    DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId, createdAt])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}
```

**Index strategy:**
- `[adminId, createdAt]` — لجلب نشاط أدمن معين (أكثر Query شيوعًا)
- `[entityType, entityId]` — للبحث عن تغييرات على entity معينة
- `[action]` — لفلترة حسب نوع الإجراء
- `[createdAt]` — للترتيب الزمني

**Performance target:** p95 < 100ms للاستعلامات الأساسية, p99 < 300ms.

### 1.3 SecurityEvent (أحداث أمنية)

```prisma
enum SecurityEventType {
  LOGIN_FAILURE
  LOGIN_SUCCESS_UNUSUAL_LOCATION
  BRUTE_FORCE_ATTEMPT
  SPAM_DETECTED
  SQL_INJECTION_ATTEMPT
  XSS_ATTEMPT
  RATE_LIMIT_EXCEEDED
  SUSPICIOUS_ACTIVITY
  API_ABUSE
  INVALID_TOKEN_USAGE
  UNAUTHORIZED_ACCESS
  DATA_SCRAPING_ATTEMPT
  FILE_UPLOAD_ABUSE
  AI_ABUSE_ATTEMPT
  ACCOUNT_TAKEOVER_ATTEMPT
}

enum SecurityEventSeverity {
  INFO
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SecurityEventStatus {
  NEW
  INVESTIGATING
  RESOLVED
  FALSE_POSITIVE
  IGNORED
}

model SecurityEvent {
  id             String               @id @default(uuid())
  type           SecurityEventType
  severity       SecurityEventSeverity
  status         SecurityEventStatus  @default(NEW)
  userId         String?              // المستخدم المشبوه (إن وجد)
  ipAddress      String?
  userAgent      String?
  endpoint       String?              // API endpoint اللي حصل عنده الحدث
  requestMethod  String?
  requestPayload Json?                //原始的 request body/params للتشخيص
  headers        Json?                // الـ headers كلها
  location       Json?                // geolocation (مدينة، بلد)
  description    String?
  resolvedById   String?
  resolvedAt     DateTime?
  resolution     String?              // ملاحظات عن الحل
  createdAt      DateTime             @default(now())

  user         User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  resolvedBy   User? @relation("SecurityResolution", fields: [resolvedById], references: [id])

  @@index([type, status])
  @@index([severity])
  @@index([userId])
  @@index([createdAt])
  @@index([ipAddress])
  @@index([status, severity, createdAt])
}
```

**RLS Policy (لما نستخدم Supabase):**
```sql
-- Only PLATFORM admins can read security events
CREATE POLICY "security_events_platform_only" ON "SecurityEvent"
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM "User" WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );
```

### 1.4 UserSessionLog (تتبع وقت المستخدم)

```prisma
model UserSessionLog {
  id             String    @id @default(uuid())
  userId         String
  startedAt      DateTime  @default(now())
  endedAt        DateTime?
  lastHeartbeatAt DateTime?
  durationSeconds Int?     // محسوب: endedAt - startedAt
  ipAddress      String?
  userAgent      String?
  deviceType     String?   // mobile | desktop | tablet
  platform       String?   // web | android | ios
  country        String?
  city           String?
  isActive       Boolean   @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startedAt])
  @@index([isActive])
  @@index([startedAt])
  @@index([deviceType])
}
```

**Backfill strategy:**
- من أول deployment، كل heartbeat من `/api/v1/presence` يبدأ session جديدة أو يمد الحالية
- لا يوجد backfill للماضي — البيانات تبدأ من لحظة التفعيل

### 1.5 PageView (تحليلات الصفحات)

```prisma
model PageView {
  id          String   @id @default(uuid())
  userId      String?
  path        String   // URL path
  title       String?  // page title
  referrer    String?  //从哪里 جاء
  durationMs  Int?     // كم ثانية قضاها
  deviceType  String?
  platform    String?
  ipAddress   String?
  sessionId   String?  // ربط بجلسة المستخدم
  createdAt   DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([path, createdAt])
  @@index([createdAt])
  @@index([sessionId])
}
```

### 1.6 VideoViewTracking (مشاهدات الفيديو)

```prisma
model VideoViewTracking {
  id             String   @id @default(uuid())
  videoId        String
  userId         String?
  lectureId      String?  // الربط مع المحاضرة
  watchDurationSeconds Int?
  watchPercentage Float?  // 0.0 to 1.0
  completed      Boolean  @default(false)
  ipAddress      String?
  createdAt      DateTime @default(now())

  lectureVideo LectureVideo @relation(fields: [videoId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([videoId, createdAt])
  @@index([userId])
  @@index([lectureId])
}
```

### 1.7 تعديل على LectureVideo (إضافة viewCount)

إضافة حقل `viewCount Int @default(0)` لموديل `LectureVideo` الموجود.

### 1.8 إضافة new fields على User

للـ time tracking online:
```prisma
// في موديل User الموجود:
lastLoginAt         DateTime?
lastActivityAt      DateTime?  // آخر نشاط (يختلف عن lastSeenAt)
totalSessionSeconds Int @default(0)  // إجمالي الوقت على المنصة
warningCount        Int @default(0)  // عدد الإنذارات النشطة
isBanned            Boolean @default(false)
bannedAt            DateTime?
banReason           String?
```

---

## 2. لوحة التحكم الرئيسية — Dashboard

**الملف:** `src/app/(admin)/admin/dashboard/page.tsx`
**التغيير:** Server component محسّن مع PLATFORM-only sections

### 2.1 الـ Layout العام

```
┌────────────────────────────────────────────────────────────┐
│  🟢 Platform Admin                                         │
│  📅 Mon, 15 June 2026                                      │
│  ┌────────────────────────────────────────────────────────┐│
│  │ [System Health Bar]  API ✅  DB ✅  Cache ✅  Storage ││
│  │                        68% ████████░░                  ││
│  └────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────┤
│  [Mobile Responsive Stats Grid — 3 cols → 2 cols → 1 col] │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐              │
│  │Users │Active│New   │Q's   │Quiz  │Vids  │              │
│  │12.4K │ 892  │+124  │45K   │89K   │2.1K  │              │
│  │+8%   │🔥    │📈    │📚    │📝    │🎬   │              │
│  └──────┴──────┴──────┴──────┴──────┴──────┘              │
├────────────────────────────────────────────────────────────┤
│  [Security Alert Bar — يظهر بس لو في CRITICAL events]       │
│  ⚠️ 12 failed logins in last hour | 3 spam attempts        │
│  🔍 [View Security Dashboard →]                            │
├────────────────────────────────────────────────────────────┤
│  [User Growth Chart]  [Top Universities]  [Content Stats]   │
│  ┌──────────────────┐ ┌────────────────┐ ┌───────────────┐ │
│  │  📈 7-day       │ │ 🏆 Uni Ranking │ │ 📊 Content    │ │
│  │  ▄▃▅▇▆▄▅       │ │ 1. Cairo ████  │ │ Q's: +234     │ │
│  │  ↑ 12% week     │ │ 2. Alex ███   │ │ Lec: +12      │ │
│  └──────────────────┘ └────────────────┘ └───────────────┘ │
├────────────────────────────────────────────────────────────┤
│  [PLATFORM-only section]                                   │
│  System Health Details:                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Database │ Cache    │ Queue    │ Storage  │             │
│  │ 🟢 12ms  │ 🟢 2ms   │ 🟢 0 msg │ 68% used │             │
│  │ 98.7%   │ 100%     │          │ 45GB/68G│             │
│  └──────────┴──────────┴──────────┴──────────┘             │
├────────────────────────────────────────────────────────────┤
│  [Recent Sign-ups Table] — الموجود حاليًا                   │
└────────────────────────────────────────────────────────────┘
```

### 2.2 المكونات الجديدة

- **`SystemHealthBar`** — client component يعرض API/DB/Cache status مع auto-refresh كل 30s
- **`PlatformStatsGrid`** — إحصائيات موسعة (أكثر من الموجودة)
- **`SecurityAlertBanner`** — يظهر لو في SECURITY events critical/open
- **`UserGrowthChart`** — شارت (recharts أو simple CSS bars) لنمو المستخدمين 7 أيام + 30 يوم
- **`UniversityRankingCard`** — ترتيب الجامعات حسب النشاط
- **`ContentStatsCard`** — إحصائيات المحتوى (new questions, lectures, papers per day)
- **`SystemHealthDetails`** — تفاصيل صحة النظام (DB latency, cache hit ratio, error rates)

### 2.3 API Routes الجديدة للـ Dashboard

```
GET /api/v1/admin/platform/dashboard
  → { systemHealth, platformStats, securityAlerts, growthData, uniRanking, contentStats }

GET /api/v1/admin/platform/health
  → { db: { status, latency, connections }, cache: { status, hitRate, memory }, api: { uptime, errorRate, avgLatency }, storage: { used, total, percentage } }
```

**Response format (API Design Reviewer — REST conventions):**
```json
{
  "data": {
    "systemHealth": {
      "db": { "status": "healthy", "latencyMs": 12, "connections": 23, "maxConnections": 100 },
      "cache": { "status": "healthy", "hitRate": 0.97, "memoryUsedMb": 156 },
      "api": { "uptime": 99.87, "errorRate24h": 0.02, "avgLatencyMs": 87 }
    },
    "platformStats": {
      "totalUsers": 12400,
      "activeToday": 892,
      "newThisWeek": 124,
      "totalQuestions": 45000,
      "totalQuizAttempts": 89000,
      "totalVideos": 2100
    },
    "securityAlerts": [
      { "type": "LOGIN_FAILURE", "count": 12, "severity": "LOW" }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-06-15T10:00:00Z",
    "version": "1.0"
  }
}
```

### 2.4 Performance targets

| Metric | Target |
|--------|--------|
| Dashboard page load | p95 < 800ms |
| Health API response | p95 < 200ms |
| Dashboard data API | p95 < 500ms |
| DB queries per request | < 15 queries (بعد التحسين) |
| N+1 queries | 0 (zero tolerance) |

**Index strategy:**
- `User.createdAt` — لنمو المستخدمين
- `User.role` — للتصنيف
- `University.name` — لترتيب الجامعات
- `QuizAttempt.createdAt` — لنشاط الاختبارات
- `EngagementLog.createdAt` — لحساب النشاط

---

## 3. إدارة المستخدمين — Users Hub

**الملفات:**
- `src/app/(admin)/admin/users/page.tsx` — القائمة الرئيسية (محسّن)
- `src/app/(admin)/admin/users/[id]/page.tsx` — **صفحة جديدة** (ملف المستخدم التفصيلي)

### 3.1 تحسينات صفحة Users

**PLATFORM-only features:**
- **DataTable متقدمة** مع:
  - Search (اسم، إيميل، ID)
  - فلاتر: الجامعة، الكلية، السنة، السمستر، الدور، حالة (نشط/محظور/منذَر)
  - Sort: تاريخ التسجيل، آخر نشاط، النقاط، عدد الإنذارات
  - Columns قابلة للتخصيص
  - Pagination (cursor-based)
  - Export selected (CSV, JSON)
- **Bulk actions** (تظهر لـ PLATFORM بس):
  - تغيير Role لمجموعة (طريقة آمنة مع confirm modal)
  - إرسال إنذار جماعي
  - حظر/إلغاء حظر
  - إضافة نقاط
  - إرسال إشعار
- **Quick Stats Bar** فوق الجدول:
  - إجمالي المستخدمين
  - Online now (آخر 5 دقائق)
  - Active today
  - New today
  - Banned

### 3.2 فلاتر الـ Users

```typescript
interface UserFilters {
  search: string;
  universityId: string | null;
  facultyId: string | null;
  academicYearId: string | null;
  semesterId: string | null;
  role: Role | null;
  status: 'active' | 'banned' | 'warned' | 'all';
  dateRange: { from: Date; to: Date } | null;
  sortBy: 'createdAt' | 'lastSeenAt' | 'points' | 'name';
  sortOrder: 'asc' | 'desc';
}
```

### 3.3 API Routes

```
GET  /api/v1/admin/platform/users
  → { data: User[], meta: { total, page, hasMore, nextCursor } }
  Query params: search, universityId, facultyId, yearId, semesterId, role, status, sortBy, sortOrder, cursor, limit

PATCH  /api/v1/admin/platform/users/bulk
  → { action: 'changeRole' | 'ban' | 'unban' | 'warn' | 'addPoints' | 'notify', userIds: string[], payload: any }

PATCH  /api/v1/admin/platform/users/[id]
  → تغيير بيانات المستخدم (name, email, role, etc.)

DELETE  /api/v1/admin/platform/users/[id]
  → حذف مستخدم (soft delete + audit log)
```

**Security (Senior Backend):**
- كل الـ endpoints دي لازم require `isSuperAdmin`
- استخدام Zod validation لكل inputs
- Rate limiting: max 10 bulk actions per minute
- Audit log لكل عملية

### 3.4 Bulk Actions Logic

```typescript
// src/lib/platform-users.ts
export async function bulkActionUsers(params: {
  action: string;
  userIds: string[];
  payload: any;
  adminId: string;
}) {
  // 1. Validate all users exist
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  if (users.length !== userIds.length) throw new Error("Some users not found");

  // 2. Execute action in transaction
  return prisma.$transaction(async (tx) => {
    switch (params.action) {
      case 'changeRole': {
        const { role } = params.payload;
        await tx.user.updateMany({ where: { id: { in: userIds } }, data: { role } });
        break;
      }
      case 'ban': {
        const { reason } = params.payload;
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { isBanned: true, bannedAt: new Date(), banReason: reason }
        });
        break;
      }
      case 'warn': {
        const { severity, reason, expiresAt } = params.payload;
        await tx.warning.createMany({
          data: userIds.map(userId => ({
            userId, issuedById: params.adminId,
            severity, reason, expiresAt
          }))
        });
        // Update warning count on user
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { warningCount: { increment: 1 } }
        });
        break;
      }
      case 'addPoints': {
        const { points, reason } = params.payload;
        await tx.userPointsTransaction.createMany({
          data: userIds.map(userId => ({
            userId, points, reason,
            reference: `bulk_${params.action}_${Date.now()}`
          }))
        });
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { points: { increment: points } }
        });
        break;
      }
    }
    // 3. Log to AdminActionLog
    await tx.adminActionLog.create({
      data: {
        adminId: params.adminId,
        action: 'BULK_' + params.action.toUpperCase(),
        entityType: 'USER',
        description: `Bulk ${params.action} on ${userIds.length} users`,
        metadata: { userIds, payload: params.payload }
      }
    });
  });
}
```

---

## 4. نظام الإنذارات — Warnings

**الملف:** `src/app/(admin)/admin/warnings/page.tsx` **(جديد)**

### 4.1 واجهة المستخدم

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Warning System  [PLATFORM ONLY]                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Tabs: [All] [Active] [Expired] [Revoked] [+Issue New]  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Filters: severity, user, date range, issued by          ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Data Table:                                             ││
│  │ ┌───┬──────────┬──────────┬──────┬──────────┬─────────┐││
│  │ │ # │ User     │ Severity │ Reas │ Issued   │ Status  │││
│  │ │ 1 │ John Doe │ 🔴 HIGH  │ Spam │ Admin X  │ ACTIVE  │││
│  │ │ 2 │ Sarah    │ 🟡 MED   │ Abus │ Admin Y  │ ACTIVE  │││
│  │ └───┴──────────┴──────────┴──────┴──────────┴─────────┘││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  [Issue New Warning Modal]                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ User: [__________________]                               ││
│  │ Severity: [MILD] [MODERATE] [SEVERE] [CRITICAL]         ││
│  │ Reason: [________________________________]               ││
│  │ Description: [________________________________]         ││
│  │ Expires: [📅 Date picker] [ ] Never expires             ││
│  │ [🔔 Notify user via notification]                       ││
│  │ [Cancel] [Issue Warning]                                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 المكونات

- **`WarningsDataTable`** — جدول الإنذارات مع فلاتر
- **`IssueWarningModal`** — مودال إصدار إنذار جديد
- **`WarningDetailPanel`** — تفاصيل الإنذار (مع timeline للإجراءات)
- **`WarningBadge`** — Badge حسب severity

### 4.3 الـ Logic

- 3 إنذارات ACTIVE → automatic ban (configurable threshold)
- الإنذار بيتبعت للمستخدم كـ Notification
- PLATFORM admin يقدر يعمل Revoke + سبب
- Expired warnings بتتغير تلقائيًا (cron job أو عند query)

### 4.4 API Routes

```
GET    /api/v1/admin/platform/warnings
       → { data: Warning[], meta: { total, active, expired } }

POST   /api/v1/admin/platform/warnings
       → { userId, severity, reason, description, expiresAt }

PATCH  /api/v1/admin/platform/warnings/[id]/revoke
       → { revokeReason }

POST   /api/v1/admin/platform/warnings/auto-expire
       → Expire all overdue warnings (cron)
```

### 4.5 Auto-ban Logic

```typescript
async function checkWarningThreshold(userId: string): Promise<void> {
  const activeWarnings = await prisma.warning.count({
    where: { userId, status: 'ACTIVE' }
  });
  const threshold = 3; // configurable عبر settings

  if (activeWarnings >= threshold) {
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, bannedAt: new Date(), banReason: `Auto-ban: ${activeWarnings} active warnings` }
    });
    await prisma.warning.create({
      data: {
        userId, issuedById: userId, // system
        severity: 'CRITICAL',
        reason: 'Automatic ban due to warning threshold exceeded',
        notes: `User had ${activeWarnings} active warnings`
      }
    });
  }
}
```

---

## 5. مراقبة الأدمنز — Admin Monitoring

**الملف:** `src/app/(admin)/admin/admin-monitoring/page.tsx` **(جديد)**

### 5.1 واجهة المستخدم

```
┌──────────────────────────────────────────────────────────────┐
│  👁️ Admin Monitoring  [PLATFORM ONLY]                        │
├──────────────────────────────────────────────────────────────┤
│  📊 Today's Summary                                          │
│  ┌──────┬──────┬──────┬──────┬──────┐                        │
│  │Active│Actions│Upload│Edits │Login │                        │
│  │  5   │ 234   │ 45   │ 89   │ 12   │                        │
│  └──────┴──────┴──────┴──────┴──────┘                        │
├──────────────────────────────────────────────────────────────┤
│  👤 Per-Admin Cards (Top 5 active today)                     │
│  ┌────────────┬──────┬────────┬───────┬─────────┐           │
│  │ Admin      │ Act. │Create  │Delete │ Upload  │           │
│  │ Ahmed (SA) │ 89   │ 23     │ 2     │ 1.2GB   │           │
│  │ Sarah (A)  │ 45   │ 12     │ 0     │ 340MB   │           │
│  └────────────┴──────┴────────┴───────┴─────────┘           │
├──────────────────────────────────────────────────────────────┤
│  📋 Live Feed (آخر الإجراءات)                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🔵 10:32 Ahmed deleted question Q-4521                   ││
│  │ 🟢 10:30 Sarah created lecture "Anatomy 3"               ││
│  │ 🟡 10:28 AdminX changed site settings: primaryColor      ││
│  │ 📎 10:25 Ahmed uploaded "Midterm.pdf" (4.2MB) → Lec 5   ││
│  │ 🔵 10:22 Sarah banned user "spammer123"                  ││
│  └──────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────┤
│  📎 Upload Tracking Tab                                      │
│  ┌──────┬────────┬────────┬────────┬─────────┬──────────┐   │
│  │ File │ Admin  │ Size   │ Type   │ Dest.   │ Date     │   │
│  │ .pdf │ Ahmed  │ 4.2MB  │ Past   │ Sem 2   │ 10:25    │   │
│  │ .jpg │ Sarah  │ 1.1MB  │ Quest  │ Lec 3   │ 10:20    │   │
│  └──────┴────────┴────────┴────────┴─────────┴──────────┘   │
│  📊 Storage: 45.2GB / 68GB used  ████████░░ 68%             │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 المكونات

- **`AdminActivitySummary`** — summary cards
- **`PerAdminActivityCards`** — كروت لكل أدمن
- **`AdminActivityFeed`** — live feed (SSE أو auto-refresh)
- **`UploadTrackingTab`** — جدول الملفات المرفوعة مع search/filters
- **`StorageUsageBar`** — شريط استهلاك التخزين

### 5.3 API Routes

```
GET  /api/v1/admin/platform/admin-monitoring
     → { summary, perAdmin, recentActions, uploadStats }

GET  /api/v1/admin/platform/admin-monitoring/uploads
     → { data: UploadRecord[], meta: { total, totalSize, storageUsed } }
     Query params: adminId, entityType, dateFrom, dateTo, fileType, search

GET  /api/v1/admin/platform/admin-monitoring/feed
     → Server-Sent Events للـ live feed (أو poll كل 5s)
```

### 5.4 Upload Tracking

نستفيد من الـ `uploadthing.ts` اللي موجودة ونضيف logging لكل upload:

```typescript
// في src/lib/storage.ts أو middleware
export async function logFileUpload(params: {
  adminId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  entityType: string;
  entityId?: string;
}) {
  await prisma.adminActionLog.create({
    data: {
      adminId: params.adminId,
      action: 'CREATE',
      entityType: params.entityType || 'FILE',
      description: `Uploaded ${params.fileName} (${formatBytes(params.fileSize)})`,
      metadata: {
        fileName: params.fileName,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        url: params.url,
        entityId: params.entityId
      }
    }
  });
}
```

Hooking into UploadThing's `onUploadComplete` callback في `src/lib/uploadthing.ts`:

```typescript
// داخل الـ fileRouter
lectureFile: f({ image: { maxFileSize: "64MB" }, pdf: true, video: true })
  .middleware(async ({ req }) => {
    const session = await auth();
    return { userId: session?.user?.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    await logFileUpload({
      adminId: metadata.userId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: file.url,
      entityType: 'LECTURE_FILE'
    });
  }),
```

---

## 6. لوحة الأمان — Security Dashboard

**الملف:** `src/app/(admin)/admin/security/page.tsx` **(جديد)**

### 6.1 واجهة المستخدم

```
┌──────────────────────────────────────────────────────────────────┐
│  🔒 Security Dashboard  [PLATFORM ONLY]                          │
├──────────────────────────────────────────────────────────────────┤
│  🚨 Active Alerts (open CRITICAL/HIGH events)                    │
│  ┌──────────┬────────┬─────────┬────────┬──────────┬──────────┐ │
│  │ Time     │ Type   │ Severity│ User   │ IP       │ Status   │ │
│  │ 10:32    │ BRUTE  │ 🔴 CRIT │ john@  │ 192.x    │ NEW      │ │
│  │ 10:15    │ SPAM   │ 🟡 HIGH  │ sarah@ │ 10.x     │ INVEST   │ │
│  │ 09:45    │ LOGIN  │ 🟢 LOW   │ ?      │ 45.x     │ NEW      │ │
│  └──────────┴────────┴─────────┴────────┴──────────┴──────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  📊 Charts                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │ Events by Type (24h) │  │ Events Timeline     │                │
│  │ 🟦 Failed Login 67% │  │ ▄▃▅▇▆▄▅▃           │                │
│  │ 🟧 Spam         18% │  │                    │                │
│  │ 🟥 Rate Limit    8% │  │                    │                │
│  │ 🟨 AI Abuse      7% │  │                    │                │
│  └─────────────────────┘  └─────────────────────┘                │
├──────────────────────────────────────────────────────────────────┤
│  ⚡ Rate Limiting Status                                          │
│  ┌──────────┬────────┬──────────┬────────┬─────────────────────┐ │
│  │ Endpoint │ Limit  │ Current  │ Status │ Actions              │ │
│  │ /login   │ 10/min │ 8/min    │ 🟢 OK  │ [Adjust] [Block IPs] │ │
│  │ /register│ 5/min  │ 12/min   │ 🔥 HIT │ [Adjust] [Block IPs] │ │
│  └──────────┴────────┴──────────┴────────┴─────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  📋 Full Security Log — كل الأحداث بالتفصيل                       │
│  [Filters: type, severity, status, date, user, IP] [Export CSV]  │
│  Paginated table مع search                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 المكونات

- **`ActiveAlertsTable`** — الأحداث المفتوحة (HIGH/CRITICAL, NEW/INVESTIGATING)
- **`SecurityCharts`** — donut chart للأنواع + line chart للـ timeline
- **`RateLimitStatus`** — حالة rate limiting لكل endpoint
- **`SecurityLogTable`** — كل الأحداث مع فلاتر كاملة
- **`SecurityEventDetail`** — تفاصيل حدث (request payload, headers, IP info)

### 6.3 API Routes

```
GET  /api/v1/admin/platform/security
     → { activeAlerts, summaries, rateLimitStatus }

GET  /api/v1/admin/platform/security/events
     → { data: SecurityEvent[], meta: { total, page } }
     Query params: type, severity, status, userId, ip, dateFrom, dateTo

PATCH /api/v1/admin/platform/security/events/[id]
     → { status, resolution }

POST /api/v1/admin/platform/security/block-ip
     → { ipAddress, reason }
```

### 6.4 Middleware للأمان (جديد)

```typescript
// src/middleware/security-monitor.ts
export async function securityMonitor(request: NextRequest): Promise<void> {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || request.ip;

  // 1. Rate limiting check
  const rateKey = `ratelimit:${ip}:${path}`;
  const current = await redis.incr(rateKey);
  if (current === 1) await redis.expire(rateKey, 60);

  const limit = getRateLimitForPath(path);
  if (current > limit) {
    await prisma.securityEvent.create({
      data: {
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        ipAddress: ip,
        endpoint: path,
        description: `Rate limit exceeded: ${current}/${limit} per minute`
      }
    });
    throw new RateLimitError();
  }

  // 2. Suspicious patterns
  if (await detectSuspiciousPattern(request)) {
    await prisma.securityEvent.create({
      data: {
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        ipAddress: ip,
        endpoint: path,
        headers: Object.fromEntries(request.headers),
        description: 'Suspicious request pattern detected'
      }
    });
  }
}
```

---

## 7. تحليلات الفيديو — Video Analytics

**الملف:** `src/app/(admin)/admin/video-analytics/page.tsx` **(جديد)**

### 7.1 واجهة المستخدم

```
┌─────────────────────────────────────────────────────────────┐
│  📹 Video Analytics  [PLATFORM ONLY]                        │
├─────────────────────────────────────────────────────────────┤
│  📊 Summary Cards                                           │
│  ┌──────┬──────┬──────┬──────┬───────┐                      │
│  │Total │Total │Avg   │Compl │Unique │                      │
│  │Videos│Views │Views │Rate  │Viewers│                      │
│  │ 2,104│ 89K  │ 42.3 │ 67%  │ 12.4K │                      │
│  └──────┴──────┴──────┴──────┴───────┘                      │
├─────────────────────────────────────────────────────────────┤
│  🏆 Top 10 Videos (by views, completion rate, engagement)   │
│  like a leaderboard                                         │
│  ┌───┬────────────┬────────┬────────┬────────┬────────┐    │
│  │ # │ Title      │ Views  │ Compl.%│ Likes  │ Lec    │    │
│  │ 1 │ Anatomy 1  │ 12,340 │ 78%    │ 234    │ Lec 5  │    │
│  │ 2 │ Cardiology │ 8,901  │ 72%    │ 189    │ Lec 3  │    │
│  └───┴────────────┴────────┴────────┴────────┴────────┘    │
├─────────────────────────────────────────────────────────────┤
│  📈 Per-Video Detail (click on row)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Video: "Anatomy of the Heart" — Dr. Ahmed               ││
│  │ Views Trend (7 days): ▄▃▅▇▆▄▅                         ││
│  │ ┌──────────┬──────────┬────────┬────────┐               ││
│  │ │ Total    │ Unique   │ Avg    │ Drop-off│               ││
│  │ │ Views    │ Viewers  │ Watch  │ at 5:23 │               ││
│  │ │ 12,340   │ 8,234    │ 4:12   │ 32%     │               ││
│  │ └──────────┴──────────┴────────┴────────┘               ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  📊 Breakdown by: [University ▼] [Faculty ▼] [Year ▼]       │
│  ┌──────────────┬────────┬────────┬────────┐                │
│  │ Cairo Univ   │ 45,321 │ 67%    │ 12:34  │                │
│  │ Alex Univ    │ 23,109 │ 71%    │ 10:20  │                │
│  └──────────────┴────────┴────────┴────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 API Routes

```
GET  /api/v1/admin/platform/video-analytics
     → { summary, topVideos, breakdown }

GET  /api/v1/admin/platform/video-analytics/[videoId]
     → { video, viewsTrend, engagement, dropoffPoints, demography }

GET  /api/v1/admin/platform/video-analytics/export
     → Export CSV
```

**SQL Queries (SQL Database Assistant):**

```sql
-- Top videos by views (optimized with index)
SELECT
  lv.id,
  l.title AS lectureTitle,
  lv."likesCount",
  lv."commentsCount",
  COUNT(vvt.id) AS views,
  COUNT(DISTINCT vvt."userId") AS uniqueViewers,
  AVG(vvt."watchPercentage")::float AS avgCompletionRate
FROM "LectureVideo" lv
JOIN "Lecture" l ON l.id = lv."lectureId"
LEFT JOIN "VideoViewTracking" vvt ON vvt."videoId" = lv.id
GROUP BY lv.id, l.title, lv."likesCount", lv."commentsCount"
ORDER BY views DESC
LIMIT 50;
```

### 7.3 الـ Video View Tracking

نضيف tracking في `LectureVideo` component أو صفحة الفيديو:

```typescript
// في مشغل الفيديو
useEffect(() => {
  const interval = setInterval(async () => {
    // كل 15 ثانية نحدث tracking
    await fetch('/api/v1/video/track', {
      method: 'POST',
      body: JSON.stringify({
        videoId,
        watchDurationSeconds: player.getCurrentTime(),
        watchPercentage: player.getCurrentTime() / player.getDuration(),
        completed: player.getCurrentTime() >= player.getDuration() * 0.9
      })
    });
  }, 15000);
  return () => clearInterval(interval);
}, []);
```

---

## 8. لوحة المتصدرين — Leaderboard

**الملف:** `src/app/(admin)/admin/leaderboard/page.tsx` **(جديد)**

### 8.1 واجهة المستخدم

```
┌─────────────────────────────────────────────────────────────────┐
│  🏆 Platform Leaderboard  [PLATFORM ONLY]                       │
├─────────────────────────────────────────────────────────────────┤
│  📊 Leaderboard Types: [Points] [Quiz Score] [Study Time] [Community]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌────┬───────────┬────────┬────────┬──────────┬────────────┐  │
│  │Rank│ User      │ Points │ Level  │ Badges   │ Actions     │  │
│  │ 🥇 │ Ahmed K.  │ 15,340 │ 14 ⭐  │ 🎖️🎖️🎖️ │  🎁🏅🔍   │  │
│  │ 🥈 │ Sara M.   │ 12,801 │ 12 ⭐  │ 🎖️🎖️    │  🎁🏅🔍   │  │
│  │ 🥉 │ Omar H.   │ 11,234 │ 11 ⭐  │ 🎖️🎖️🎖️ │  🎁🏅🔍   │  │
│  └────┴───────────┴────────┴────────┴──────────┴────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  🎁 Reward Actions (Modal)                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ User: Ahmed K.  Current Points: 15,340                      ││
│  │                                                             ││
│  │ [➕ Add Points]  [🏅 Assign Badge]  [📨 Send Message]      ││
│  │                                                             ││
│  │ Add Points: [_________] Reason: [________________]          ││
│  │ Badge: [Select Badge ▼]                                     ││
│  │ Message: "Congratulations on reaching top of the leaderboard││
│  │ for this month!"                                            ││
│  │                                                             ││
│  │ [Cancel] [Apply Reward]                                     ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  📈 Stats: Distribution of points, levels, and engagement       │
│  Chart: عدد المستخدمين حسب النقاط (Histogram)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 API Routes

```
GET  /api/v1/admin/platform/leaderboard
     → { data: LeaderboardEntry[], meta: { total } }
     Query params: type (points|quiz|study|community), universityId, semesterId, limit, offset

POST /api/v1/admin/platform/leaderboard/reward
     → { userId, type: 'points' | 'badge' | 'message', payload }
```

### 8.3 Leaderboard Logic

```typescript
async function getLeaderboard(type: string, filters: any) {
  const where: any = {};

  if (filters.universityId) where.universityId = filters.universityId;
  if (filters.semesterId) where.semesterId = filters.semesterId;

  switch (type) {
    case 'points':
      return prisma.user.findMany({
        where, orderBy: { points: 'desc' }, take: 100,
        select: { id: true, name: true, points: true, ... }
      });
    case 'quiz':
      return prisma.$queryRaw`
        SELECT u.id, u.name, AVG(qa.score) as avgScore, COUNT(qa.id) as attempts
        FROM "User" u JOIN "QuizAttempt" qa ON qa."userId" = u.id
        GROUP BY u.id ORDER BY avgScore DESC LIMIT 100
      `;
    case 'study':
      return prisma.$queryRaw`
        SELECT u.id, u.name, SUM(ssp."focusSeconds") as totalFocus
        FROM "User" u JOIN "StudySessionParticipant" ssp ON ssp."userId" = u.id
        GROUP BY u.id ORDER BY totalFocus DESC LIMIT 100
      `;
    case 'community':
      return prisma.$queryRaw`
        SELECT u.id, u.name,
          (COUNT(DISTINCT p.id) + COUNT(DISTINCT c.id) + COUNT(DISTINCT l.id)) as engagement
        FROM "User" u
        LEFT JOIN "Post" p ON p."authorId" = u.id
        LEFT JOIN "Comment" c ON c."authorId" = u.id
        LEFT JOIN "Like" l ON l."userId" = u.id
        GROUP BY u.id ORDER BY engagement DESC LIMIT 100
      `;
  }
}
```

---

## 9. تحليلات الاختبارات — Quiz Analytics

**الملف:** `src/app/(admin)/admin/quiz-analytics/page.tsx` **(جديد)**

### 9.1 واجهة المستخدم

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Quiz Analytics  [PLATFORM ONLY]                              │
├──────────────────────────────────────────────────────────────────┤
│  📈 Overall Stats                                                │
│  ┌──────────┬──────────┬────────┬────────┬────────┬──────────┐  │
│  │ Attempts │ Avg      │ Pass   │ Fail   │ Avg    │ Total    │  │
│  │ 89,234   │ Score    │ Rate   │ Rate   │ Time   │ Students │  │
│  │          │ 67.3%    │ 73%    │ 27%    │ 24:15  │ 8,901    │  │
│  └──────────┴──────────┴────────┴────────┴────────┴──────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  📉 Performance Breakdown                                        │
│  [By University ▾] [By Faculty ▾] [By Semester ▾] [By Paper ▾]  │
│  ┌──────────────┬──────────┬─────────┬────────┬────────┐       │
│  │ University   │ Attempts │ Avg %   │ Pass % │ Trend  │       │
│  │ Cairo        │ 23,401   │ 71.2%   │ 84.3%  │ 📈 +3% │       │
│  │ Alexandria   │ 15,203   │ 65.8%   │ 78.1%  │ 📉 -2% │       │
│  │ Mansoura     │ 12,890   │ 69.1%   │ 81.2%  │ 📈 +5% │       │
│  └──────────────┴──────────┴─────────┴────────┴────────┘       │
├──────────────────────────────────────────────────────────────────┤
│  🔥 Top 5 Most Attempted Papers                                  │
│  ┌───┬──────────────┬──────────┬────────┬───────────┐          │
│  │ # │ Paper Title  │ Attempts │ Avg %  │ Difficulty│          │
│  │ 1 │ Anatomy Mid  │ 12,340   │ 61%    │ 🔴 HARD   │          │
│  │ 2 │ Physiology   │ 10,201   │ 73%    │ 🟢 EASY   │          │
│  └───┴──────────────┴──────────┴────────┴───────────┘          │
├──────────────────────────────────────────────────────────────────┤
│  ❌ Top 10 Most Missed Questions                                 │
│  ┌───┬────────────────────────────────────┬────────┬──────────┐ │
│  │ # │ Question                           │ Wrong  │ Paper    │ │
│  │ 1 │ "What is the main function of..."  │ 78%    │ Anatomy  │ │
│  └───┴────────────────────────────────────┴────────┴──────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  📊 Score Distribution Histogram                                 │
│  ██ 0-10%                                                        │
│  ████████ 10-20%                                                 │
│  ██████████████ 20-30%                                           │
│  ████████████████████ 30-40%                                     │
│  ████████████████████████████████████████ 40-50%                 │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 API Routes

```
GET  /api/v1/admin/platform/quiz-analytics
     → { summary, performanceBreakdown, topPapers, missedQuestions, scoreDistribution }

GET  /api/v1/admin/platform/quiz-analytics/export
     → CSV export
```

### 9.3 SQL Queries المحسّنة

```sql
-- Top missed questions (optimized with index on QuizAttemptItem)
SELECT
  q.id AS questionId,
  SUBSTRING(q.body, 1, 100) AS questionPreview,
  COUNT(qai.id) AS totalAttempts,
  SUM(CASE WHEN qai."isCorrect" = false THEN 1 ELSE 0 END)::float / COUNT(qai.id) * 100 AS wrongRate,
  pp.title AS paperTitle
FROM "Question" q
JOIN "QuizAttemptItem" qai ON qai."questionId" = q.id
JOIN "QuizAttempt" qa ON qa.id = qai."attemptId"
JOIN "PastPaper" pp ON pp.id = qa."pastPaperId"
GROUP BY q.id, q.body, pp.title
HAVING COUNT(qai.id) >= 50  -- minimum sample
ORDER BY wrongRate DESC
LIMIT 10;

-- Index needed: QuizAttemptItem.questionId + isCorrect
-- CREATE INDEX CONCURRENTLY "QuizAttemptItem_questionId_isCorrect_idx"
-- ON "QuizAttemptItem" ("questionId", "isCorrect");
```

---

## 10. متصفح المحتوى — Content Browser & Editor

**الملف:** `src/app/(admin)/admin/content-browser/page.tsx` **(جديد)**

### 10.1 واجهة المستخدم

```
┌──────────────────────────────────────────────────────────────────────┐
│  📁 Content Browser  [PLATFORM ONLY]                                 │
├──────────────────────────────────────────────────────────────────────┤
│  [University ▾] → [Faculty ▾] → [Year ▾] → [Semester ▾]            │
├──────────────────────────────────────────────────────────────────────┤
│  عند اختيار سمستر:                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ 📊 Semester Stats                                                ││
│  │ Lectures: 45  |  Videos: 89  |  Files: 234  |  Quizzes: 23     ││
│  │ Questions: 2,340  |  Past Papers: 12                            ││
│  │ Total Storage: 4.2GB                                            ││
│  └──────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│  📂 Content Tree (expandable)                                       │
│  📦 Semester 1 (2025-2026)                                         │
│  ├─ 📚 Module: Anatomy                                              │
│  │  ├─ 📖 Subject: Upper Limb                                       │
│  │  │  ├─ ▶️ Lecture 1: Introduction to Anatomy [Edit] [Delete]    │
│  │  │  ├─ ▶️ Lecture 2: Bones of Upper Limb [Edit] [Delete]        │
│  │  │  ├─ 📝 Quiz: Upper Limb MCQs [Edit] [Delete]                 │
│  │  │  └─ 📎 Attachments: 5 files [Browse]                         │
│  │  └─ 📖 Subject: Lower Limb                                       │
│  │     └─ ...                                                       │
│  └─ 📚 Module: Physiology                                           │
│     └─ ...                                                          │
├──────────────────────────────────────────────────────────────────────┤
│  🔍 [Search across all content] [Advanced Filters]                  │
│  [Edit Any Item → Opens Modal/Page with full form]                  │
│  [Export Stats as CSV]                                              │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.2 المكونات

- **`UniversityFacultyYearSemesterSelector`** — سلسلة اختيار هرمية
- **`ContentTreeView`** — عرض الشجرة مع expand/collapse
- **`ContentEditModal`** — مودال تعديل لأي entity (Lecture, Question, Paper, etc.)
- **`SemesterStatsCard`** — إحصائيات السمستر
- **`ContentSearchBar`** — بحث متقدم مع فلاتر

### 10.3 الـ "Edit Anything" Logic

```typescript
// Generic Content Editor
async function editEntity(params: {
  entityType: 'lecture' | 'question' | 'pastPaper' | 'subject' | 'module';
  entityId: string;
  changes: Record<string, any>;
  adminId: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Get previous state
    const prev = await tx[entityType].findUnique({ where: { id: params.entityId } });

    // 2. Apply changes
    const updated = await tx[entityType].update({
      where: { id: params.entityId },
      data: params.changes
    });

    // 3. Log to AdminActionLog
    await tx.adminActionLog.create({
      data: {
        adminId: params.adminId,
        action: 'UPDATE',
        entityType: params.entityType.toUpperCase(),
        entityId: params.entityId,
        previousState: prev,
        newState: updated,
        description: `Edited ${params.entityType}: ${JSON.stringify(Object.keys(params.changes))}`
      }
    });

    return updated;
  });
}
```

### 10.4 API Routes

```
GET    /api/v1/admin/platform/content-browser
       → { tree: ContentNode[] }
       Query params: universityId, facultyId, yearId, semesterId

GET    /api/v1/admin/platform/content-browser/search
       → { data: SearchResult[] }
       Query params: q, entityType, universityId, semesterId

GET    /api/v1/admin/platform/content-browser/stats
       → { semesterStats }

PUT    /api/v1/admin/platform/content-browser/[entityType]/[entityId]
       → Update entity (generic)

DELETE /api/v1/admin/platform/content-browser/[entityType]/[entityId]
       → Delete entity (soft delete)
```

---

## 11. الإعدادات المتقدمة — PLATFORM Settings

**الملف:** `src/app/(admin)/admin/settings/page.tsx`
**التغيير:** إضافة تبويبات PLATFORM-only

### 11.1 التبويبات الجديدة

#### 11.1.1 System Tab

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️ System Configuration  [PLATFORM ONLY]                    │
├──────────────────────────────────────────────────────────────┤
│  🛠 Maintenance Mode                                         │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ [🔴 Enable Maintenance Mode]                             ││
│  │ Message: [_____________________________]                 ││
│  │ Whitelisted IPs: [192.168.1.1, 10.0.0.1]                 ││
│  │ Whitlelisted Roles: [SUPER_ADMIN, ADMIN]                 ││
│  └──────────────────────────────────────────────────────────┘│
│  🧹 Cache Management                                         │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Redis Status: 🟢 Connected                               ││
│  │ Memory Used: 156MB / 512MB                               ││
│  │ Hit Rate: 97.2%                                          ││
│  │ [Clear All Cache] [Clear User Cache] [Clear API Cache]  ││
│  └──────────────────────────────────────────────────────────┘│
│  ⚡ Rate Limiting Configuration                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ┌───────────┬──────────┬──────────┐                     ││
│  │ │ Endpoint  │ Limit    │ Window   │                     ││
│  │ │ /api/*    │ 100      │ 1 min    │ [Edit]              ││
│  │ │ /login    │ 10       │ 1 min    │ [Edit]              ││
│  │ │ /register │ 5        │ 1 min    │ [Edit]              ││
│  │ └───────────┴──────────┴──────────┘                     ││
│  └──────────────────────────────────────────────────────────┘│
│  🌐 CORS Settings                                            │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Allowed Origins: [https://medonex.com, https://*.vercel] ││
│  │ Allowed Methods: GET, POST, PUT, PATCH, DELETE           ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### 11.1.2 Security Tab

```
┌──────────────────────────────────────────────────────────────┐
│  🔐 Security Configuration  [PLATFORM ONLY]                  │
├──────────────────────────────────────────────────────────────┤
│  🔑 Password Policy                                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Min Length: [8]   Require Uppercase: [✅]               ││
│  │ Require Numbers: [✅]  Require Special: [✅]            ││
│  │ Password Expiry: [90 days]                              ││
│  └──────────────────────────────────────────────────────────┘│
│  🔒 Session Management                                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Session Timeout: [60 minutes]                            ││
│  │ Max Concurrent Sessions: [5]                             ││
│  │ Force Re-login on IP Change: [✅]                       ││
│  │ [Force Logout All Users] [Force Logout User ▲]          ││
│  └──────────────────────────────────────────────────────────┘│
│  🛡 2FA Enforcement                                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Require 2FA for: [None] [Admins] [All Users]            ││
│  │ Allowed 2FA Methods: [Authenticator App] [SMS] [Email]  ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### 11.1.3 Notifications Tab

```
┌──────────────────────────────────────────────────────────────┐
│  📨 Notifications Configuration  [PLATFORM ONLY]             │
├──────────────────────────────────────────────────────────────┤
│  📣 Global Broadcast (موجود حاليًا)                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Title: [________________]  Body: [______________]       ││
│  │ [Send to All Users] [Send to Role ▾] [Schedule ▾]       ││
│  └──────────────────────────────────────────────────────────┘│
│  📧 Email Templates                                         │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ┌──────────────┬────────────┬───────────┐               ││
│  │ │ Template     │ Subject    │ Active    │               ││
│  │ │ Welcome      │ Welcome!   │ ✅        │ [Edit] [Test]││
│  │ │ Reset Pass   │ Reset      │ ✅        │ [Edit] [Test]││
│  │ │ Warning      │ Warning    │ ✅        │ [Edit] [Test]││
│  │ └──────────────┴────────────┴───────────┘               ││
│  └──────────────────────────────────────────────────────────┘│
│  🔔 Push Notification Config                                 │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ VAPID Public Key: ___________________________________   ││
│  │ VAPID Private Key: [••••••••••••••••]                   ││
│  │ [Test Push Notification]                                 ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### 11.1.4 Backup Tab

```
┌──────────────────────────────────────────────────────────────┐
│  💾 Backup & Restore  [PLATFORM ONLY]                        │
├──────────────────────────────────────────────────────────────┤
│  📦 Database Backup                                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Last Backup: 15 Jun 2026, 04:00 UTC (2.3GB)             ││
│  │ Backup Size: 2.3GB                                       ││
│  │ Status: 🟢 Healthy                                       ││
│  │ [Backup Now] [Schedule ▾]                                ││
│  │ Schedule: [Daily at 04:00] [Weekly] [Manual Only]       ││
│  │ Retention: Keep last [7] daily, [4] weekly, [12] monthly││
│  └──────────────────────────────────────────────────────────┘│
│  📤 Export Tools                                             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ [Export Full Platform Data (JSON)]                       ││
│  │ [Export Users (CSV)] [Export Questions (CSV)]            ││
│  │ [Export Quiz Analytics (CSV)]                            ││
│  └──────────────────────────────────────────────────────────┘│
│  🔄 Restore                                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ⚠️ Restoring will overwrite current data                 ││
│  │ Available Backups: [Date ▾]                               ││
│  │ [Restore from Backup]                                    ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### 11.1.5 AI Tab

```
┌──────────────────────────────────────────────────────────────┐
│  🤖 AI Configuration  [PLATFORM ONLY]                        │
├──────────────────────────────────────────────────────────────┤
│  🧠 Provider Configuration                                   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Primary Provider: [Gemini ▾]                              ││
│  │ Fallback Provider: [OpenAI ▾]                             ││
│  │ API Keys: Gemini [•••••] OpenAI [•••••] Claude [•••••]  ││
│  └──────────────────────────────────────────────────────────┘│
│  📊 Daily Usage Quotas                                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ┌───────────┬─────────────┬────────────┐                ││
│  │ │ Tier      │ Daily Limit │ Per Minute  │                ││
│  │ │ Student   │ 50          │ 10          │ [Edit]         ││
│  │ │ Teacher   │ 200         │ 30          │ [Edit]         ││
│  │ │ Admin     │ 500         │ 60          │ [Edit]         ││
│  │ └───────────┴─────────────┴────────────┘                ││
│  └──────────────────────────────────────────────────────────┘│
│  🚨 Abuse Detection                                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Auto-detect abuse: [✅]                                  ││
│  │ Threshold: [50] requests in [5] minutes                 ││
│  │ Action on abuse: [Warn User] [Block Temporarily]        ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### 11.1.6 Storage Tab

```
┌──────────────────────────────────────────────────────────────┐
│  💿 Storage Configuration  [PLATFORM ONLY]                   │
├──────────────────────────────────────────────────────────────┤
│  📊 Storage Overview                                         │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Total: 68 GB  Used: 45.2 GB (68%)  Free: 22.8 GB (32%) ││
│  │ ████████████████████████████████░░░░░░░░░░░░░░░░░░░    ││
│  │ Files Count: 12,340                                     ││
│  └──────────────────────────────────────────────────────────┘│
│  📂 Storage By Type                                          │
│  ┌─────────────┬───────────┬──────────┬───────────┐         ││
│  │ Type        │ Count     │ Size     │ %         │         ││
│  │ Videos      │ 2,104     │ 28.5GB   │ 63%       │         ││
│  │ Images      │ 5,230     │ 3.1GB    │ 6.8%      │         ││
│  │ PDFs        │ 3,401     │ 10.2GB   │ 22.6%     │         ││
│  │ Other       │ 1,605     │ 3.4GB    │ 7.5%      │         ││
│  └─────────────┴───────────┴──────────┴───────────┘         ││
│  ⚙️ Upload Limits                                            │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Max File Size: [64 MB]                                   ││
│  │ Allowed Types: [PDF, Images, Video, Audio, Documents]    ││
│  │ Max Files Per Upload: [10]                               ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 12. الـ Audit Logs المحسّن

**الملف:** `src/app/(admin)/admin/audit-logs/page.tsx`
**التغيير:** إضافة PLATFORM-only features

### 12.1 التحسينات

- **Filters متقدمة:**
  - By action (CREATE, UPDATE, DELETE, BULK_*)
  - By entity type (USER, QUESTION, LECTURE, SETTING, FILE, etc.)
  - By admin (user selector)
  - Date range picker
  - Search في الـ description / entityId
- **Pagination** (cursor-based مع page numbers)
- **Export** CSV / JSON
- **Detail Expand** — click on row لرؤية قبل/بعد التعديل
- **Timeline View** — عرض الأحداث على Timeline

### 12.2 المكونات الجديدة

- **`AuditLogFilters`** — filters panel
- **`AuditLogTable`** — جدول محسّن مع sort
- **`AuditLogDetail`** — expandable detail view
- **`AuditLogDiff`** — before/after diff (JSON diff viewer)
- **`AuditLogTimeline`** — timeline view toggle

### 12.3 API Route محسّنة

```
GET /api/v1/admin/platform/audit-logs
  → { data: AdminActionLog[], meta: { total, page, hasMore } }
  Query params: action, entityType, adminId, dateFrom, dateTo, search, sortBy, sortOrder, cursor, limit

GET /api/v1/admin/platform/audit-logs/export
  → CSV/JSON download
```

### 12.4 JSON Diff Viewer

```typescript
function JsonDiffViewer({ before, after }: { before: any; after: any }) {
  const changes = findChanges(before, after);
  return (
    <div className="space-y-2">
      {changes.map((change, i) => (
        <div key={i} className="flex gap-4 text-sm">
          <span className="font-mono w-40">{change.field}</span>
          <span className="line-through text-red-500">{change.before}</span>
          <span className="text-green-500">{change.after}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 13. صفحة ملف المستخدم التفصيلي

**الملف:** `src/app/(admin)/admin/users/[id]/page.tsx` **(جديد)**

### 13.1 واجهة المستخدم

```
┌──────────────────────────────────────────────────────────────────────┐
│  👤 User Profile  [PLATFORM ONLY]                                    │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┬──────────────────────┐ │
│  │ 👤 User Avatar                           │ 🔴 Online Now        │ │
│  │ John Doe                                  │ 📧 john@example.com  │ │
│  │ 🏛 Cairo University • Faculty of Medicine │ 📱 +201234567890     │ │
│  │ 📚 Year 3 • Semester 5                    │ 🎂 25 years          │ │
│  │ 🏷 Role: STUDENT                          │ 📅 Joined: 15 Sep 25 │ │
│  │                                           │                      │ │
│  │ [Edit User] [Warn] [Ban] [Change Role ▾] │                      │ │
│  └──────────────────────────────────────────┴──────────────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│  📊 Stats Overview                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐│
│  │ Lectures │ Quizzes  │ Avg Quiz │ Focus    │ Posts    │ Points   ││
│  │ 45 compl │ 23 att.  │ 72.3%    │ 34.2 hrs │ 12 posts │ 2,340    ││
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘│
├──────────────────────────────────────────────────────────────────────┤
│  📈 Activity Timeline                                                 │
│  [7 Days] [30 Days] [All Time]                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ▄▃▅▇▆▄▅▃▂▄▅▆▇▆▅▄▃▂▃▄▅▆▇▆▅▄▃ — Lectures                       ││
│  │ ▂▃▄▅▆▇▆▅▄▃▂▃▄▅▆▇▆▅▄▃▂▃▄▅▆▇ — Quizzes                         ││
│  │ ▃▄▅▆▇▆▅▄▃▂▃▄▅▆▇▆▅▄▃▂▃▄▅▆▇▆ — Community                       ││
│  └──────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│  Tabs: [Activity] [Quiz History] [Study Sessions] [Warnings] [Community] │
├──────────────────────────────────────────────────────────────────────┤
│  [Quiz History Tab]:                                                  │
│  ┌──────┬────────────────┬────────┬────────┬──────────┬─────────┐   ││
│  │ Date │ Quiz Title     │ Score  │ Result │ Time     │ Details  │   ││
│  │ 12/6 │ Anatomy Mid    │ 18/25  │ ✅ 72% │ 15:20    │ [View]   │   ││
│  │ 10/6 │ Physiology     │ 22/25  │ ✅ 88% │ 12:10    │ [View]   │   ││
│  └──────┴────────────────┴────────┴────────┴──────────┴─────────┘   ││
├──────────────────────────────────────────────────────────────────────┤
│  [Warnings Tab]:                                                      │
│  ┌───┬──────────┬──────────┬──────────┬──────────┬──────────────┐   ││
│  │ # │ Severity │ Reason   │ Issued By│ Date     │ Status        │   ││
│  │ 1 │ MEDIUM   │ Spam     │ Admin X  │ 10 Jun   │ ACTIVE        │   ││
│  └───┴──────────┴──────────┴──────────┴──────────┴──────────────┘   ││
├──────────────────────────────────────────────────────────────────────┤
│  [Session History Tab]:                                               │
│  ┌──────┬─────────┬──────────┬────────┬────────┬─────────┐         ││
│  │ Date │ Login   │ Duration │ Device │ IP     │ Location│         ││
│  │ 15/6 │ 10:32   │ 2:45:00  │ iPhone │ 192.x  │ Cairo   │         ││
│  │ 14/6 │ 09:15   │ 1:20:00  │ Desktop│ 10.x   │ Giza    │         ││
│  └──────┴─────────┴──────────┴────────┴────────┴─────────┘         ││
└──────────────────────────────────────────────────────────────────────┘
```

### 13.2 المكونات

- **`UserProfileHeader`** — header مع المعلومات الأساسية + actions
- **`UserStatsCards`** — 6 بطاقات إحصائية
- **`UserActivityChart`** — timeline chart
- **`UserQuizHistoryTable`** — جدول quiz attempts
- **`UserWarningList`** — قائمة الإنذارات
- **`UserSessionHistory`** — history sessions
- **`UserCommunityActivity`** — posts, comments, reactions
- **`UserAIUsage`** — AI usage stats (بدون تفاصيل المحادثة)

### 13.3 API Routes

```
GET  /api/v1/admin/platform/users/[id]
     → { user, stats, recentActivity }

GET  /api/v1/admin/platform/users/[id]/activity
     → { timeline: ActivityEntry[] }
     Query params: period (7d|30d|all), type

GET  /api/v1/admin/platform/users/[id]/quiz-history
     → { data: QuizAttempt[], meta: { avgScore, totalAttempts } }

GET  /api/v1/admin/platform/users/[id]/sessions
     → { data: UserSessionLog[], meta: { totalDuration, avgDuration } }

GET  /api/v1/admin/platform/users/[id]/warnings
     → { data: Warning[] }

GET  /api/v1/admin/platform/users/[id]/community
     → { posts: number, comments: number, likes: number, reactions: number }

GET  /api/v1/admin/platform/users/[id]/ai-usage
     → { totalCalls: number, dailyAverage: number, types: { ask: number, explain: number, ... }, abuseFlags: number }
```

---

## 14. الـ Sidebar الجديد

**الملف:** `src/components/admin/AdminSidebarNav.tsx`

إضافة Group جديد اسمه "PLATFORM" يظهر لـ SUPER_ADMIN بس:

```typescript
const NAV_GROUPS = [
  // ... المجموعات الموجودة
  {
    label: "PLATFORM",
    superAdminOnly: true, // group كامل مش متاح للـ ADMIN العادي
    items: [
      { href: "/admin/dashboard",          label: "Platform Dashboard", icon: LayoutDashboard },
      { href: "/admin/users",              label: "Users Hub",         icon: Users },
      { href: "/admin/warnings",           label: "Warnings",          icon: ShieldAlert, badge: "NEW" },
      { href: "/admin/admin-monitoring",   label: "Admin Monitor",     icon: Eye, badge: "NEW" },
      { href: "/admin/security",           label: "Security",          icon: Lock, badge: "NEW" },
      { href: "/admin/video-analytics",    label: "Video Analytics",   icon: Video, badge: "NEW" },
      { href: "/admin/quiz-analytics",     label: "Quiz Analytics",    icon: TrendingUp, badge: "NEW" },
      { href: "/admin/leaderboard",        label: "Leaderboard",       icon: Trophy, badge: "NEW" },
      { href: "/admin/content-browser",    label: "Content Browser",   icon: BookOpen, badge: "NEW" },
      { href: "/admin/audit-logs",         label: "Audit Logs",        icon: Copy },
      { href: "/admin/settings",           label: "Platform Settings", icon: Settings },
    ],
  },
];
```

**فلترة الـ Sidebar:**
```typescript
const visibleItems = group.items.filter(
  (item) => isSuperAdmin || (!group.superAdminOnly && item.href !== "/admin/teams" && item.href !== "/admin/founders")
);
```

---

## 15. تحليلات إضافية — Extra Analytics

### 15.1 Activity Heatmap

خريطة حرارية لنشاط المستخدمين على مدار الـ 24 ساعة × 7 أيام:

```typescript
// API: GET /api/v1/admin/platform/analytics/heatmap
// Response: { grid: number[][] } // 24 columns (hours) × 7 rows (days)
const result = await prisma.$queryRaw`
  SELECT
    EXTRACT(DOW FROM created_at) as day,
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as count
  FROM "EngagementLog"
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY day, hour
  ORDER BY day, hour
`;
```

### 15.2 Retention Analytics

كم مستخدم بيرجع للمنصة بعد أول أسبوع/شهر:

```
API: GET /api/v1/admin/platform/analytics/retention
→ { d1: 85%, d7: 62%, d30: 41%, d90: 28% }
```

**SQL:**
```sql
WITH cohorts AS (
  SELECT
    DATE_TRUNC('week', created_at) as cohort_week,
    id as user_id
  FROM "User"
),
activity AS (
  SELECT DISTINCT
    user_id,
    DATE_TRUNC('week', created_at) as activity_week
  FROM "EngagementLog"
)
SELECT
  c.cohort_week,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_week >= c.cohort_week + INTERVAL '1 week' THEN c.user_id END)::float / COUNT(DISTINCT c.user_id) * 100 as week1_retention,
  COUNT(DISTINCT CASE WHEN a.activity_week >= c.cohort_week + INTERVAL '4 weeks' THEN c.user_id END)::float / COUNT(DISTINCT c.user_id) * 100 as week4_retention
FROM cohorts c
LEFT JOIN activity a ON a.user_id = c.user_id
GROUP BY c.cohort_week
ORDER BY c.cohort_week;
```

### 15.3 Device Analytics

```
API: GET /api/v1/admin/platform/analytics/devices
→ { web: 65%, android: 22%, ios: 10%, tablet: 3% }
```

### 15.4 Search Analytics

```
API: GET /api/v1/admin/platform/analytics/search
→ { topQueries: [{ query: "anatomy", count: 1234 }], searchesPerDay: [23, 45, ...] }
```

### 15.5 Geographic Distribution

```
API: GET /api/v1/admin/platform/analytics/locations
→ { data: [{ city: "Cairo", count: 5200 }, { city: "Alexandria", count: 2300 }] }
```

### 15.6 Feature Adoption

```
API: GET /api/v1/admin/platform/analytics/features
→ {
    lectures: { totalUsers: 8900, activeUsers: 3400, adoptionRate: 38.2 },
    quizzes: { totalUsers: 7800, activeUsers: 4200, adoptionRate: 53.8 },
    community: { totalUsers: 4500, activeUsers: 1200, adoptionRate: 15.4 },
    aiChat: { totalUsers: 3200, activeUsers: 1800, adoptionRate: 56.3 },
    studyRooms: { totalUsers: 1800, activeUsers: 600, adoptionRate: 33.3 },
  }
```

### 15.7 Content Quality Metrics

```
API: GET /api/v1/admin/platform/analytics/content-quality
→ {
    questions: { total: 45000, reported: 230, reportedPct: 0.51 },
    lectures: { total: 2104, lowViews: 89, lowViewsPct: 4.2 },
    quizzes: { total: 340, avgRating: 4.2 },
  }
```

### 15.8 API Usage & Performance

```
API: GET /api/v1/admin/platform/analytics/api-usage
→ {
    topEndpoints: [{ path: "/api/v1/questions", count: 12340, avgLatency: 45 }],
    errorRates: [{ code: 500, count: 23 }, { code: 404, count: 156 }],
    slowestEndpoints: [{ path: "/api/v1/past-papers/analysis", p95: 3400 }],
  }
```

### 15.9 All-in-one Export

API للتصدير الكامل:

```
GET /api/v1/admin/platform/analytics/export?format=csv&type=all
POST /api/v1/admin/platform/reports/generate
  → { reportType: 'monthly' | 'weekly' | 'custom', dateRange, includeSections: string[] }
  → Generates PDF/CSV report and returns download link
```

---

## 16. API Routes Summary

| # | Method | Route | PLATFORM Only | Page |
|---|--------|-------|---------------|------|
| 1 | GET | `/api/v1/admin/platform/dashboard` | ✅ | Dashboard |
| 2 | GET | `/api/v1/admin/platform/health` | ✅ | Dashboard |
| 3 | GET | `/api/v1/admin/platform/users` | ✅ | Users |
| 4 | PATCH | `/api/v1/admin/platform/users/bulk` | ✅ | Users |
| 5 | PATCH | `/api/v1/admin/platform/users/[id]` | ✅ | Users |
| 6 | DELETE | `/api/v1/admin/platform/users/[id]` | ✅ | Users |
| 7 | GET | `/api/v1/admin/platform/users/[id]` | ✅ | User Profile |
| 8 | GET | `/api/v1/admin/platform/users/[id]/activity` | ✅ | User Profile |
| 9 | GET | `/api/v1/admin/platform/users/[id]/quiz-history` | ✅ | User Profile |
| 10 | GET | `/api/v1/admin/platform/users/[id]/sessions` | ✅ | User Profile |
| 11 | GET | `/api/v1/admin/platform/users/[id]/warnings` | ✅ | User Profile |
| 12 | GET | `/api/v1/admin/platform/users/[id]/community` | ✅ | User Profile |
| 13 | GET | `/api/v1/admin/platform/users/[id]/ai-usage` | ✅ | User Profile |
| 14 | GET | `/api/v1/admin/platform/warnings` | ✅ | Warnings |
| 15 | POST | `/api/v1/admin/platform/warnings` | ✅ | Warnings |
| 16 | PATCH | `/api/v1/admin/platform/warnings/[id]/revoke` | ✅ | Warnings |
| 17 | POST | `/api/v1/admin/platform/warnings/auto-expire` | ✅ | Warnings |
| 18 | GET | `/api/v1/admin/platform/admin-monitoring` | ✅ | Admin Monitor |
| 19 | GET | `/api/v1/admin/platform/admin-monitoring/uploads` | ✅ | Admin Monitor |
| 20 | GET | `/api/v1/admin/platform/admin-monitoring/feed` | ✅ | Admin Monitor |
| 21 | GET | `/api/v1/admin/platform/security` | ✅ | Security |
| 22 | GET | `/api/v1/admin/platform/security/events` | ✅ | Security |
| 23 | PATCH | `/api/v1/admin/platform/security/events/[id]` | ✅ | Security |
| 24 | POST | `/api/v1/admin/platform/security/block-ip` | ✅ | Security |
| 25 | GET | `/api/v1/admin/platform/video-analytics` | ✅ | Video Analytics |
| 26 | GET | `/api/v1/admin/platform/video-analytics/[videoId]` | ✅ | Video Analytics |
| 27 | GET | `/api/v1/admin/platform/video-analytics/export` | ✅ | Video Analytics |
| 28 | GET | `/api/v1/admin/platform/quiz-analytics` | ✅ | Quiz Analytics |
| 29 | GET | `/api/v1/admin/platform/quiz-analytics/export` | ✅ | Quiz Analytics |
| 30 | GET | `/api/v1/admin/platform/leaderboard` | ✅ | Leaderboard |
| 31 | POST | `/api/v1/admin/platform/leaderboard/reward` | ✅ | Leaderboard |
| 32 | GET | `/api/v1/admin/platform/content-browser` | ✅ | Content Browser |
| 33 | GET | `/api/v1/admin/platform/content-browser/search` | ✅ | Content Browser |
| 34 | GET | `/api/v1/admin/platform/content-browser/stats` | ✅ | Content Browser |
| 35 | PUT | `/api/v1/admin/platform/content-browser/[type]/[id]` | ✅ | Content Browser |
| 36 | DELETE | `/api/v1/admin/platform/content-browser/[type]/[id]` | ✅ | Content Browser |
| 37 | GET | `/api/v1/admin/platform/audit-logs` | ✅ | Audit Logs |
| 38 | GET | `/api/v1/admin/platform/audit-logs/export` | ✅ | Audit Logs |
| 39 | GET | `/api/v1/admin/platform/analytics/heatmap` | ✅ | Analytics |
| 40 | GET | `/api/v1/admin/platform/analytics/retention` | ✅ | Analytics |
| 41 | GET | `/api/v1/admin/platform/analytics/devices` | ✅ | Analytics |
| 42 | GET | `/api/v1/admin/platform/analytics/search` | ✅ | Analytics |
| 43 | GET | `/api/v1/admin/platform/analytics/locations` | ✅ | Analytics |
| 44 | GET | `/api/v1/admin/platform/analytics/features` | ✅ | Analytics |
| 45 | GET | `/api/v1/admin/platform/analytics/content-quality` | ✅ | Analytics |
| 46 | GET | `/api/v1/admin/platform/analytics/api-usage` | ✅ | Analytics |
| 47 | GET | `/api/v1/admin/platform/analytics/export` | ✅ | Analytics |
| 48 | POST | `/api/v1/video/track` | ❌ (public) | Video Tracking |

**كل API routes لازم تتبع:**

1. **REST conventions** (API Design Reviewer) — أسماء موارد kebab-case, HTTP methods صحيحة
2. **Response format** — `{ data, meta }` أو `{ error, meta }`
3. **Authentication** — `auth()` + `isSuperAdmin()` check
4. **Input validation** — Zod schemas
5. **Rate limiting** — 100 req/min للـ PLATFORM APIs
6. **Audit logging** — كل إجراء كتابة يُسجل في AdminActionLog
7. **Pagination** — cursor-based للـ lists
8. **Error handling** — try/catch + meaningful error messages

---

## 17. تسلسل التنفيذ (Phases)

### Phase 1: Prisma Schema + Migrations (الأساس)
- إضافة الموديلات الجديدة (Warning, AdminActionLog, SecurityEvent, UserSessionLog, PageView, VideoViewTracking)
- إضافة الحقول الجديدة على User و LectureVideo
- تشغيل Prisma migrate
- مراجعة الـ indexes

**المدة المقدرة:** 2-3 أيام

### Phase 2: Core Infrastructure (API Middleware + Auth)
- إضافة middleware للأمان (security monitoring, rate limiting)
- إنشاء base API patterns للـ PLATFORM routes
- إنشاء shared components (DataTable, Filters, Charts)
- إضافة الـ AdminActionLog hooks في كل مكان

**المدة المقدرة:** 3-4 أيام

### Phase 3: Dashboard + User Management
- تحديث صفحة Dashboard مع PLATFORM sections
- تحديث صفحة Users مع PLATFORM features (bulk actions, filters)
- إنشاء صفحة User Profile التفصيلية
- API routes الخاصة بـ Users

**المدة المقدرة:** 4-5 أيام

### Phase 4: Monitoring Systems (Warnings + Admin Monitor + Security)
- إنشاء Warning صفحة + API
- إنشاء Admin Monitoring صفحة + API
- إنشاء Security Dashboard صفحة + API
- ربط UploadThing مع AdminActionLog

**المدة المقدرة:** 4-5 أيام

### Phase 5: Analytics (Video + Quiz + Leaderboard + Extra)
- إنشاء Video Analytics صفحة + API
- إنشاء Quiz Analytics صفحة + API
- إنشاء Leaderboard صفحة + API
- إنشاء Extra Analytics APIs (heatmap, retention, devices, search, features, content quality, API usage)
- Video tracking integration

**المدة المقدرة:** 4-5 أيام

### Phase 6: Content Browser + Settings enhancements
- إنشاء Content Browser صفحة + API
- إضافة تبويبات PLATFORM Settings
- "Edit Anything" generic logic

**المدة المقدرة:** 3-4 أيام

### Phase 7: Audit Logs enhancements + Sidebar
- تحسين Audit Logs (filters, pagination, export, diff viewer)
- تحديث AdminSidebarNav مع PLATFORM group
- Testing and QA

**المدة المقدرة:** 2-3 أيام

### Phase 8: Polish + Performance + Security Review
- Performance optimization
  - إضافة missing indexes (عدد المتوقع: 15-20 index)
  - تحسين N+1 queries
  - تحسين pagination
- Security review
  - RLS policies review
  - Middleware hardening
  - Input validation audit
- Code quality review
  - Clean Code principles verification
  - Code splitting where needed
  - Dead code removal
- UI/UX polish
  - Responsive design for all new pages
  - Loading states (skeleton screens)
  - Empty states
  - Error states
  - Dark mode compatibility

**المدة المقدرة:** 3-4 أيام

### Total Estimated Time: 25-33 أيام

---

## ملخص الملفات المتأثرة

### الملفات الجديدة (13 صفحة + API routes):
```
src/app/(admin)/admin/users/[id]/page.tsx
src/app/(admin)/admin/warnings/page.tsx
src/app/(admin)/admin/admin-monitoring/page.tsx
src/app/(admin)/admin/security/page.tsx
src/app/(admin)/admin/video-analytics/page.tsx
src/app/(admin)/admin/quiz-analytics/page.tsx
src/app/(admin)/admin/leaderboard/page.tsx
src/app/(admin)/admin/content-browser/page.tsx
src/app/api/v1/admin/platform/dashboard/route.ts
src/app/api/v1/admin/platform/health/route.ts
src/app/api/v1/admin/platform/users/route.ts + [id]/
src/app/api/v1/admin/platform/warnings/route.ts + [id]/
src/app/api/v1/admin/platform/admin-monitoring/route.ts
src/app/api/v1/admin/platform/security/route.ts + events/
src/app/api/v1/admin/platform/video-analytics/route.ts + [videoId]/
src/app/api/v1/admin/platform/quiz-analytics/route.ts
src/app/api/v1/admin/platform/leaderboard/route.ts
src/app/api/v1/admin/platform/content-browser/route.ts + [type]/[id]/
src/app/api/v1/admin/platform/analytics/route.ts
src/app/api/v1/admin/platform/audit-logs/route.ts
src/app/api/v1/video/track/route.ts
src/middleware/security-monitor.ts
```

### الملفات المعدلة (11 ملف):
```
prisma/schema.prisma
src/app/(admin)/admin/dashboard/page.tsx
src/app/(admin)/admin/settings/page.tsx
src/app/(admin)/admin/users/page.tsx
src/app/(admin)/admin/audit-logs/page.tsx
src/components/admin/AdminSidebarNav.tsx
src/lib/uploadthing.ts
src/lib/storage.ts
src/lib/platform-users.ts (جديد)
src/middleware.ts
src/app/(admin)/layout.tsx
```

---

## خطة الـ Testing

| النوع | الهدف | الأدوات |
|-------|-------|---------|
| **Unit tests** | API routes (validation, auth, error handling) | Vitest |
| **Integration tests** | Database queries, bulk actions, transactions | Vitest + Prisma |
| **E2E tests** | جميع صفحات PLATFORM | Playwright |
| **Performance tests** | API response times, DB query optimization | k6, EXPLAIN ANALYZE |
| **Security tests** | RLS bypass, rate limiting, SQL injection | Manual + automated |
| **Accessibility tests** | WCAG 2.1 AA | axe-core, Lighthouse |
| **Load tests** | Dashboard + APIs under concurrent load | k6 (50, 100, 500 concurrent users) |

**Performance targets للـ load tests:**
- صفحة Dashboard: p95 < 800ms, p99 < 1500ms
- PLATFORM APIs: p95 < 300ms, p99 < 600ms
- User Search: p95 < 500ms
- Analytics Aggregation: p95 < 2000ms (للبيانات الكبيرة، نستخدم materialized views أو caching)
- Concurrent users: 50 بدون degradation
- Throughput: 100 req/s للـ PLATFORM APIs

---

*End of Plan Document*
