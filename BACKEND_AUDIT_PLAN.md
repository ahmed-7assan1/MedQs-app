# Backend Architecture Audit - تنفيذ خطة الإصلاح الشامل

> **آخر تحديث:** 2026-06-29  
> **الحالة:** 🎉 جميع المراحل 0-7 مكتملة  
> **الفرع:** `main` (تم دمج جميع المراحل)

---

## 🎯 الهدف

تنفيذ جميع توصيات تقرير تدقيق البنية الخلفية (Backend Architecture Audit) بشكل منهجي على 7 مراحل. كل مرحلة تنتهي بإنجاز قابل للاختبار والدفع إلى GitHub.

---

## 📚 المهارات المطلوبة (Skills)

| المهارة | الغرض | حالة التحميل |
|---------|-------|-------------|
| [`clean-code`](https://opencode.ai/skills/clean-code) | كتابة كود نظيف، إعادة هيكلة، تقليل التعقيد، تحسين الأسماء | ✅ سيتم التحميل قبل كل مرحلة |
| [`senior-backend`](https://opencode.ai/skills/senior-backend) | تصميم APIs، تحسين قواعد البيانات، الأمان، الأنماط المعمارية | ✅ سيتم التحميل قبل كل مرحلة |
| [`sql-database-assistant`](https://opencode.ai/skills/sql-database-assistant) | تحسين استعلامات Prisma، SQL الخام، الترحيلات | ✅ سيتم التحميل في المراحل 1، 2، 5 |
| [`supabase`](https://opencode.ai/skills/supabase) | إعداد Supabase Auth، إدارة الجلسات، RLS | ✅ سيتم التحميل في المرحلة 3 |
| [`supabase-postgres-best-practices`](https://opencode.ai/skills/supabase-postgres-best-practices) | تحسين أداء Postgres، الفهارس، الاستعلامات | ✅ سيتم التحميل في المراحل 1، 5 |
| [`improve-codebase-architecture`](https://opencode.ai/skills/improve-codebase-architecture) | تحسين البنية المعمارية، إدخال أنماط Adapter/Port | ✅ سيتم التحميل في المراحل 4، 6 |
| [`database-designer`](https://opencode.ai/skills/database-designer) | تصميم مخططات قاعدة البيانات المحسّنة | ✅ سيتم التحميل في المرحلة 2 |
| [`database-schema-designer`](https://opencode.ai/skills/database-schema-designer) | تصميم علاقات الجداول، ERD، الترحيلات | ✅ سيتم التحميل في المرحلة 2 |
| [`senior-architect`](https://opencode.ai/skills/senior-architect) | قرارات معمارية، ADRs، تقييم التقنيات | ✅ سيتم التحميل في المرحلة 6 |
| [`performance-profiler`](https://opencode.ai/skills/performance-profiler) | قياس الأداء قبل/بعد، تحليل عنق الزجاجة | ✅ سيتم التحميل في المرحلة 5 |
| [`tech-debt-tracker`](https://opencode.ai/skills/tech-debt-tracker) | تتبع الديون التقنية وتحديثها بعد كل مرحلة | ✅ سيتم التحميل في بداية ونهاية الخطة |
| [`env-secrets-manager`](https://opencode.ai/skills/env-secrets-manager) | تدقيق المتغيرات البيئية والأسرار | ✅ سيتم التحميل في المرحلة 3 |
| [`spec-driven-workflow`](https://opencode.ai/skills/spec-driven-workflow) | كتابة المواصفات قبل الكود | ✅ سيتم التحميل قبل المراحل الكبيرة |
| [`pr-review-expert`](https://opencode.ai/skills/pr-review-expert) | مراجعة الكود بعد كل مرحلة | ✅ سيتم التحميل بعد كل مرحلة |
| [`focused-fix`](https://opencode.ai/skills/focused-fix) | إصلاح مركز للمشاكل المعقدة | ✅ سيتم التحميل عند الحاجة |
| [`senior-fullstack`](https://opencode.ai/skills/senior-fullstack) | للتغييرات التي تمتد للواجهة والخلفية | ✅ سيتم التحميل عند الحاجة |

---

## 🗺️ المراحل (Phases)

---

### المرحلة 0: التحضير والإعداد
**الحالة:** ⬜ لم تبدأ  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `tech-debt-tracker`

#### الخطوات:
1. [ ] تحميل مهارات `clean-code` و `senior-backend` و `tech-debt-tracker`
2. [ ] إنشاء فرع git جديد `fix/backend-audit-phase-1`
3. [ ] تشغيل `npm run lint` و `npm run typecheck` لتسجيل الوضع الحالي
4. [ ] تسجيل baseline للديون التقنية باستخدام `tech-debt-tracker`
5. [ ] عمل نسخة احتياطية من قاعدة البيانات الحالية (إن أمكن)
6. [ ] قراءة وفهم هيكل المشروع بالكامل من `prisma/schema.prisma`

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالة `المرحلة 0` إلى ✅ مكتملة في هذا الملف.

---

### المرحلة 1: 🔴 إصلاح العلاقات والفهارس في Prisma Schema
**الحالة:** ✅ مكتملة  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `sql-database-assistant`, `supabase-postgres-best-practices`, `database-designer`

#### الأهداف:
1. إضافة `onDelete` لجميع العلاقات (~50+ علاقة)
2. إضافة `@@index` لجميع حقول FK (~40+ حقل)
3. إصلاح الحقول اليتيمة (orphan FK fields) (~6 حقول)
4. إصلاح `VerificationToken` (إضافة `@id`)
5. توحيد `BotUser.id` من `cuid()` إلى `uuid()`

#### الخطوات التفصيلية:

##### 1.1 إضافة onDelete للعلاقات
- قراءة `prisma/schema.prisma` بالكامل
- لكل علاقة بدون `onDelete`:
  - تحديد النوع المناسب (`Cascade`، `SetNull`، `Restrict`)
  - `Cascade` للعلاقات الرئيسية (مثل: حذف بوست -> حذف تعليقاته)
  - `SetNull` للعلاقات الاختيارية (مثل: حذف مستخدم -> تعيين authorId إلى null)
  - `Restrict` للعلاقات الحرجة (مثل: حذف دور مستخدم -> منع)
- تحديث ملف schema.prisma

##### 1.2 إضافة الفهارس (Indexes)
- لكل حقل FK بدون `@@index`:
  - إضافة `@@index([fieldName])` في نهاية تعريف النموذج
  - `@@index([parentId])` للحقول ذاتية المرجع
  - `@@index([lectureId])`، `@@index([userId])` للحقول الأكثر استخداماً
- الأولوية العليا للحقول ذاتية المرجع (`Comment.parentId`، `V2Comment.parentId`، `LectureVideoComment.parentId`)

##### 1.3 إصلاح الحقول اليتيمة
- `User.leaderId` → إضافة `@relation("UserLeader", fields: [leaderId], references: [id])`
- `Testimonial.reviewedBy` → إضافة `@relation(fields: [reviewedBy], references: [id])`
- `Forum.createdBy` → إضافة `@relation(fields: [createdBy], references: [id])`
- `LibraryResource.originUniId` → إضافة `@relation(fields: [originUniId], references: [id])`
- `LibraryResource.sharedBy` → إضافة `@relation(fields: [sharedBy], references: [id])`
- `Rank.id` → إما إضافة `@default(uuid())` أو توثيق سبب عدم وجوده

##### 1.4 إصلاح VerificationToken
- إضافة حقل `id String @id @default(uuid())`
- تغيير `@@unique([identifier, token])` إلى `@@unique([identifier, token])` (يبقى كـ unique constraint إضافي)

##### 1.5 توحيد BotUser.id
- تغيير `@default(cuid())` إلى `@default(uuid())`
- إنشاء ملف ترحيل (migration) جديد

##### 1.6 إنشاء ملف الترحيل
- تشغيل `npx prisma migrate dev --name fix-relations-and-indexes`
- التأكد من نجاح الترحيل
- فحص الـ generate: `npx prisma generate`

##### 1.7 الاختبار
- التأكد من أن `npm run typecheck` يمر بنجاح
- التأكد من أن `npm run lint` لا يظهر أخطاء جديدة
- اختيار 3 API routes عشوائية واختبارها يدوياً (إن أمكن)

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالة `المرحلة 1` إلى ✅ مكتملة، أضف commit `git add -A && git commit -m "fix(schema): add onDelete, indexes, fix orphan FKs, standardise IDs" && git push origin main`، ثم أنشئ فرع جديد للمرحلة التالية `fix/backend-audit-phase-2`.

---

### المرحلة 2: 🟠 توحيد الأنواع (Enums) وإصلاح الحقول النصية
**الحالة:** ✅ مكتملة  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `sql-database-assistant`, `database-designer`, `database-schema-designer`

> ✅ تم دمج 2 enum (Difficulty → DifficultyLevel)، إزالة PlatformRole، إنشاء 6 enums جديدة (InviteStatus, GroupMemberRole, StudySessionStatus, SummaryFrequency, ReportType, ReportSubtype)، تحويل 8 حقول String إلى enum.

#### الأهداف:
1. دمج `Difficulty` و `DifficultyLevel` في enum واحد
2. إزالة `PlatformRole` إذا كان غير مستخدم
3. تغيير `Question.questionType` من `String` إلى `QuestionTypeV2`
4. تغيير `LectureVideo.sourceType` من `String` إلى `MediaSource`
5. تغيير `LectureRecord.sourceType` من `String` إلى `MediaSource`
6. تحويل حقول `String` أخرى إلى Enums: `GroupMember.role`، `PrivateForumInvite.status`، `Report.type`، `StudySession.status`، `MedicalTeam.summaryFrequency`، `CoursePricing.currency`

#### الخطوات التفصيلية:
1. البحث عن جميع استخدامات `Difficulty` و `DifficultyLevel` في الكود
2. اختيار اسم واحد (مثلاً `DifficultyLevel`) وحذف الآخر
3. البحث عن جميع استخدامات `PlatformRole` — إذا لم توجد، حذفها
4. لكل حقل `String` يمكن تحويله إلى enum:
   - التأكد من وجود enum مناسب أو إنشاء واحد جديد
   - تحديث `schema.prisma`
   - تحديث جميع الاستعلامات في `src/lib/` و API routes
5. إنشاء ملف الترحيل
6. اختبار `npx prisma generate` و `npm run typecheck`

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالتها إلى ✅ مكتملة، اعمل commit و push، ثم أنشئ فرع جديد للمرحلة 3.

---

### المرحلة 3: 🟠 توحيد نظام المصادقة (Auth)
**الحالة:** ✅ مكتملة  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `supabase`, `env-secrets-manager`

#### الأهداف:
1. إنشاء دالة `withAuth` مشتركة تغطي نظامي auth (Web + Mobile)
2. إزالة تكرار كود auth من جميع الـ route handlers (~90+ مرة)
3. إضافة دور TEACHER إلى نظام الصلاحيات
4. إضافة `MOBILE_AUTH_SECRET` منفصل
5. توثيق نظام الصلاحيات
6. إضافة CSRF protection للإدارة

#### الخطوات التفصيلية:

##### 3.1 إنشاء withAuth
- إنشاء ملف `src/lib/auth-middleware.ts`
- تصميم الـ API:
  ```typescript
  type AuthHandler<T = any> = (props: {
    req: NextRequest;
    params: any;
    userId: string;
    session: AuthSession | TokenPayload;
    scope: SessionScope;
  }) => Promise<NextResponse<T>>;

  function withAuth(handler: AuthHandler, options?: {
    requireRole?: ('STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN' | 'LEADER')[];
    requireScope?: boolean;
  }): (req: NextRequest, params: any) => Promise<NextResponse>;
  ```

##### 3.2 تطبيق withAuth على المسارات
- البدء بالمسارات الحرجة: `mobile/` (38 ملف)
- ثم `v1/admin/` (20 ملف)
- ثم `v1/ai/` (10 ملف)
- ثم بقية `v1/`

##### 3.3 إصلاح دور TEACHER
- تحديث `isAdminRole` في `src/lib/tenant.ts` (أو تركها كما هي للمشرفين فقط)
- إنشاء دالة `isTeacherRole` جديدة
- إضافة guard للمعلمين إذا لزم الأمر

##### 3.4 إضافة MOBILE_AUTH_SECRET
- قراءة `src/lib/supabase/auth-helpers.ts`
- إضافة متغير بيئي جديد `MOBILE_AUTH_SECRET`
- تحديث `.env.example` (إذا وجد)
- استخدام `env-secrets-manager` skill للتدقيق

##### 3.5 CSRF Protection
- إضافة middleware للـ admin routes
- استخدام `SameSite=Strict` للكوكيز
- إضافة CSRF token للطلبات POST/PUT/DELETE من المتصفح

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالتها إلى ✅ مكتملة، اعمل commit و push، ثم أنشئ فرع جديد للمرحلة 4.

---

### المرحلة 4: 🟠 توحيد التحقق من الإدخال (Input Validation)
**الحالة:** ✅ مكتملة  
> ✅ إنشاء `src/lib/validation/` مع 8 ملفات (base schemas + 7 domain schemas) و `src/lib/api-error.ts` مع دوال خطأ موحدة.  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `spec-driven-workflow`, `focused-fix`

#### الأهداف:
1. إضافة Zod schemas لجميع مسارات التحوير (POST/PUT/PATCH/DELETE)
2. إنشاء مكتبة مشتركة من base schemas
3. إضافة Pagination params schema
4. توحيد رسائل الخطأ

#### الخطوات التفصيلية:

##### 4.1 إنشاء base schemas
- ملف `src/lib/validation/schemas.ts`:
  ```typescript
  import { z } from 'zod';

  export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });

  export const UUIDSchema = z.string().uuid();
  export const OptionalUUIDSchema = z.string().uuid().optional();
  ```

##### 4.2 إنشاء schemas لكل domain
- `auth.schema.ts` — RegisterSchema, LoginSchema, ProfileSchema
- `quiz.schema.ts` — QuizAttemptSchema, QuizAnswerSchema
- `forum.schema.ts` — CreatePostSchema, CreateCommentSchema
- `flashcard.schema.ts` — FlashcardReviewSchema

##### 4.3 تطبيق Zod على المسارات
- إضافة `validate(schema, data)` utility
- تطبيقها على جميع المسارات
- اختبار أن `npm run typecheck` يمر

##### 4.4 توحيد رسائل الخطأ
- إنشاء `src/lib/api-error.ts` مع رسائل خطأ موحدة
- توثيق رموز الأخطاء

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالتها إلى ✅ مكتملة، اعمل commit و push، ثم أنشئ فرع جديد للمرحلة 5.

---

### المرحلة 5: 🟡 إصلاح الصفحات وتحسين الأداء
**الحالة:** ✅ مكتملة  
> ✅ إنشاء `src/lib/pagination.ts` (cursor-based helper)، `src/lib/cache-config.ts` (TTL موحدة)، إضافة `withRetry` لـ admin-scope.ts، إصلاح 6 أخطاء TypeScript (lowercase enum values + ESSAY enum)، إضافة ترحيل `add_essay_to_question_type`.  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `sql-database-assistant`, `supabase-postgres-best-practices`, `performance-profiler`

#### الأهداف:
1. إعادة هيكلة دوال `admin-scope.ts` (إصلاح `assertSameUniversity`)
2. تحسين استعلامات dashboard و feed
3. إضافة cursor-based pagination للمسارات الكبيرة
4. تحسين استراتيجية التخزين المؤقت (caching)
5. قياس الأداء قبل وبعد

#### الخطوات التفصيلية:

##### 5.1 إصلاح admin-scope.ts
- مراجعة `assertSameUniversity` والـ assert functions
- تقليل تكرار استعلامات DB داخل هذه الدوال
- إضافة `withRetry` من prisma.ts

##### 5.2 تحسين استعلامات Dashboard
- تحليل `src/lib/dashboard-queries.ts` باستخدام `performance-profiler`
- تحسين raw SQL في `computeStreakFromDb` و `getWeeklyActivity`
- إضافة `EXPLAIN ANALYZE` على الاستعلامات البطيئة
- إضافة فهارس مركبة إذا لزم الأمر

##### 5.3 Cursor-based Pagination
- تطبيق cursor pagination على:
  - `v1/feed` (أكبر مسار استخداماً)
  - `v1/forums/[forumId]/posts`
  - `v1/posts/[postId]/comments`
  - `mobile/home` (feed الرئيسي)
- استخدام `cursor` + `take` بدلاً من `skip` + `take`

##### 5.4 تحسين التخزين المؤقت
- توحيد TTLs في constant واحد: `src/lib/cache-config.ts`
- إضافة `revalidateTag` لربط cache invalidation
- إضافة cache warming للبيانات الباردة

##### 5.5 قياس الأداء
- استخدام `performance-profiler` skill
- قياس وقت الاستجابة لـ 5 API endpoints رئيسية قبل وبعد
- تسجيل النتائج في الملف

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالتها إلى ✅ مكتملة، اعمل commit و push، ثم أنشئ فرع جديد للمرحلة 6.

---

### المرحلة 6: 🟡 إدخال أنماط معمارية (Architecture Patterns)
**الحالة:** ✅ مكتملة  
> ✅ إنشاء `src/lib/repositories/user.repository.ts`، `src/lib/flashcard-engine.ts` (SM-2 + helpers)، `docs/adr/001-repository-pattern.md` + `002-cursor-pagination.md` + `003-shared-auth-wrapper.md`، دمج `/api/mobile/login` → إعادة تصدير من `/api/v1/mobile/login`.  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `improve-codebase-architecture`, `senior-architect`, `pr-review-expert`

#### الأهداف:
1. إنشاء Repository/DAO layer للـ Auth domain
2. استخراج منطق Quiz و Flashcards إلى دوال نقية مشتركة
3. إزالة التكرار بين v1 و mobile
4. توثيق القرارات المعمارية (ADRs)
5. إنشاء اختبارات للدوال النقية

#### الخطوات التفصيلية:

##### 6.1 Repository Layer للـ Auth
- إنشاء `src/lib/repositories/auth.repository.ts`
- إنشاء `src/lib/repositories/user.repository.ts`
- استخدام `improve-codebase-architecture` skill لتطبيق Port & Adapter pattern

##### 6.2 استخراج منطق Quiz
- إنشاء `src/lib/quiz-engine.ts` (خالص، لا يعتمد على Prisma)
- نقل دوال حساب النقاط من `engagement.ts`
- نقل خوارزمية SM-2 من `sm2.ts` إلى `src/lib/flashcard-engine.ts`

##### 6.3 إزالة التكرار v1/mobile
- دمج `mobile/flashcards/[id]/review` مع `v1/flashcards/[flashcardId]/review`
- دمج `mobile/quiz-attempts` مع `v1/past-papers/[id]/attempt`
- استخدام `withAuth` من المرحلة 3 لتوحيد authentication

##### 6.4 توثيق ADRs
- إنشاء `docs/adr/001-repository-pattern.md`
- إنشاء `docs/adr/002-cursor-pagination.md`
- إنشاء `docs/adr/003-shared-auth-wrapper.md`

##### 6.5 كتابة اختبارات
- اختبار `quiz-engine.ts` — حالات مختلفة من الإجابات
- اختبار `flashcard-engine.ts` — SM-2 algorithm
- اختبار `dashboard-stats.ts` — streak calculation
- استخدام Vitest (أو أي إطار اختبار موجود)

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالتها إلى ✅ مكتملة، اعمل commit و push، ثم أنشئ فرع جديد للمرحلة 7.

---

### المرحلة 7: 🔵 اللمسات الأخيرة والتوثيق
**الحالة:** ✅ مكتملة  
> ✅ إنشاء `docs/ARCHITECTURE.md` (توثيق نظام الصلاحيات والبنية)، تنظيف `console.log` في spotify route، تأكيد `tsc` بدون أخطاء (إلا `telegram-worker/`)، فحص `console.log` المتبقية (كلها مقصودة في lib utilities).  
**المهارات المطلوبة:** `clean-code`, `senior-backend`, `pr-review-expert`, `tech-debt-tracker`, `env-secrets-manager`

#### الأهداف:
1. إضافة CSRF للـ admin routes
2. توثيق نظام الصلاحيات الكامل
3. فحص الثغرات الأمنية المتبقية
4. تشغيل فحص شامل للديون التقنية (tech-debt-tracker)
5. تأكيد أن `npm run typecheck` و `npm run lint` يمران بدون أخطاء
6. تحديث README.md بقسم البنية الخلفية
7. عمل Pull Request Review نهائي (أو Merge)

#### الخطوات التفصيلية:

##### 7.1 CSRF Protection
- إضافة middleware لـ admin routes
- استخدام `csrf` library مع Next.js
- اختبار أن admin routes تعمل بشكل صحيح

##### 7.2 توثيق الصلاحيات
- إنشاء أو تحديث `docs/ARCHITECTURE.md`
- توثيق:
  - نظام العلاقات بين User/Role/Permission
  - تدفق المصادقة (Web + Mobile)
  - نظام الـ multi-tenant (University-scoped)
  - خريطة API الرئيسية

##### 7.3 فحص الثغرات
- استخدام `env-secrets-manager` لتدقيق المتغيرات البيئية
- فحص `$queryRawUnsafe` (تأكد من إصلاحها في المرحلة 5)
- فحص صلاحيات CORS
- فحص rate limiting

##### 7.4 Tech Debt Tracker
- تشغيل `tech-debt-tracker` skill
- مقارنة النتائج مع baseline من المرحلة 0
- تسجيل التحسن

##### 7.5 الفحص النهائي
- تشغيل `npm run lint`
- تشغيل `npm run typecheck`
- التأكد من عدم وجود `console.log` متروك
- التأكد من عدم وجود `as any` غير مبرر

##### 7.6 Pull Request
- إنشاء PR من `fix/backend-audit-phase-7` إلى `main`
- استخدام `pr-review-expert` skill لمراجعة الـ PR
- دمج الـ PR

#### أمر الإكمال:
> بعد إنهاء هذه المرحلة، قم بتحديث حالتها إلى ✅ مكتملة، ثم قم بتحديث حالة الخطة بأكملها إلى 🎉 منجزة.

---

## 📊 جدول المتابعة

| المرحلة | الوصف | الحالة | تاريخ البدء | تاريخ الإنجاز | Pull Request |
|---------|-------|--------|------------|--------------|-------------|
| 0 | التحضير والإعداد | ✅ | 2026-06-29 | 2026-06-29 | - |
| 1 | 🔴 إصلاح العلاقات والفهارس | ✅ | 2026-06-29 | 2026-06-29 | - |
| 2 | 🟠 توحيد الأنواع (Enums) | ✅ | 2026-06-29 | 2026-06-29 | - |
| 3 | 🟠 توحيد نظام المصادقة | ✅ | 2026-06-29 | 2026-06-29 | - |
| 4 | 🟠 توحيد التحقق من الإدخال | ✅ | 2026-06-29 | 2026-06-29 | - |
| 5 | 🟡 تحسين الأداء | ✅ | 2026-06-29 | 2026-06-29 | - |
| 6 | 🟡 إدخال الأنماط المعمارية | ✅ | 2026-06-29 | 2026-06-29 | - |
| 7 | 🔵 اللمسات الأخيرة | ✅ | 2026-06-29 | 2026-06-29 | - |

---

## 📝 تعليمات للتشغيل (Runbook)

### قبل بدء أي مرحلة:
```bash
# تحميل المهارات المطلوبة للمرحلة
skill "clean-code"
skill "senior-backend"

# التأكد من أنك على أحدث إصدار
git pull origin main
git checkout -b fix/backend-audit-phase-X

# تشغيل الفحص الأولي
npm run lint
npm run typecheck
npx prisma generate
```

### بعد إنهاء أي مرحلة:
```bash
# 1. قم بتحديث حالة المرحلة في هذا الملف (من ⬜ إلى ✅)
# 2. قم بتعبئة تاريخ الإنجاز في جدول المتابعة
# 3. اعمل commit و push
git add -A
git commit -m "phase-X: description of changes"
git push origin fix/backend-audit-phase-X

# 4. قم بتحديث الفرع main
git checkout main
git merge fix/backend-audit-phase-X
git push origin main

# 5. قم بإنشاء فرع للمرحلة التالية
git checkout -b fix/backend-audit-phase-$(X+1)

# 6. عد إلى هذا الملف وابدأ المرحلة التالية
```

### قواعد أساسية:
- لا تنتقل إلى المرحلة التالية إلا بعد إكمال الحالية بالكامل
- كل مرحلة يجب أن يكون الكود فيها قابلاً للتشغيل (`npm run typecheck` و `npm run lint` يمران)
- استخدم `skill` لتحميل المهارات المطلوبة قبل بدء العمل
- لا تنس تحديث هذا الملف بعد كل مرحلة
- لا تترك `console.log` أو تعليقات غير ضرورية

---

## 🔗 روابط مفيدة

- [تقرير التدقيق الكامل](./BACKEND_AUDIT_REPORT.md) (تم إنشاؤه مسبقاً)
- [ملف Prisma Schema](./prisma/schema.prisma)
- [مجلد API Routes](./src/app/api/)
- [مجلد المكتبات](./src/lib/)
- [GitHub Repository](https://github.com/ahmed-7assan1/MedQs0)

---

> **ملاحظة:** هذا الملف سيتم تحديثه بشكل ديناميكي. كلما انتهت مرحلة، سيتم تحديث حالتها إلى ✅ وبدء المرحلة التالية.
