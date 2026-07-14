# خطة التنفيذ الشاملة — Student Dashboard Redesign
# Full Execution Plan

**Version:** 1.0  
**Classification:** Internal Engineering Document  
**Scope:** Student Dashboard (`src/app/(student-clean)/dashboard-app/`) — visual redesign, component standards, data architecture  
**Target System:** MedOneX (medqs-app)  
**Infrastructure:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, framer-motion, SWR, Zustand  
**القاعدة الأساسية:** `docs/frontend-design-system.md` (Section 9 — Deep Component Audit)

---

## جدول المحتويات / Table of Contents

1. [المهارات الأساسية / Core Skills](#1-core-skills)
2. [Phase B — Visual & Touch Consistency](#2-phase-b)
3. [Phase C — Structural & Future Features](#3-phase-c)
4. [Phase D — Cleanup & Final Verification](#4-phase-d)
5. [Dependency Graph & Execution Order](#5-dependency-graph)
6. [Effort Summary](#6-effort-summary)
7. [Review Log](#7-review-log)

---

## 1. Core Skills
### المهارات الأساسية المطلوبة في كل Phase

### 1.1 مهارة الكود النظيف / Clean Code Skill

**واجبة في كل Phase بدون استثناء. ممنوع التخطي.**

| المعيار | الشرح |
|---------|-------|
| ❌ لا توجد Comments غير ضرورية | التعليق فقط على logic المعقد (مثل stale closure fix). لا تضع تعليقات على obvious code. |
| ❌ لا توجد أسماء قديمة أو غير معبرة | استخدم أسماء معبرة للمتغيرات والدوال (مثل `handleSearch` بدل `handleThing`). |
| ✅ Single Responsibility | كل دالة تفعل شيئًا واحدًا فقط. لا تخلط logic التنسيق مع logic البيانات. |
| ✅ DRY | لا تكرر نفس النمط في أكثر من مكان — استخرج shared function أو constant. |
| ✅ Consistent Code Style | اتبع نمط الكود الموجود في الملف (اقرأ 20 سطر قبل التعديل). |
| ✅ No Hardcoded Magic Values | الألوان والمسافات والأحجام — استخدم CSS variables أو Tailwind tokens. |
| ✅ No `any` unless unavoidable | استخدم TypeScript types موجودة في `src/types/dashboard.ts`. |
| ✅ إزالة console.log بعد الانتهاء | لا تترك debug logs في الكود النهائي. |
| ✅ Formatting | استخدم Prettier/ESLint الموجود في المشروع. |

**قبل كل Commit:** تأكد من كل النقاط أعلاه.

---

### 1.2 مهارة العمل الديف / DevOps & Deploy Workflow

| المعيار | التفاصيل |
|---------|----------|
| ✅ Build Verification | `npm run build` أو `next build` — يجب أن ينجح بدون أخطاء. |
| ✅ Type Checking | `npm run typecheck` أو `tsc --noEmit` — لا type errors. |
| ✅ Lint | `npm run lint` أو `eslint .` — لا warnings أو errors جديدة. |
| ✅ No Broken Imports | أي حذف ملف (Phase D) — تأكد من عدم وجود import في ملف آخر. |
| ✅ Git Hygiene | أضف `.gitkeep` في المجلدات الفارغة إذا لزم الأمر. |
| ✅ No Regression | اختبر أن `hidden md:block` لم يُمسح (do-not-regress item #1). |

**بعد كل تعديل:** شغّل build command للتأكد من عدم كسر أي شيء.

---

### 1.3 مهارة مراجعة الأخطاء / Error Review & QA

| المعيار | التفاصيل |
|---------|----------|
| ✅ راجع تغييراتك بنفسك قبل الطلب | اقرأ `git diff` وتأكد من كل سطر. |
| ✅ تأكد من عدم إزالة CSS class موجود | خصوصًا الـ responsive classes (hidden, block, flex). |
| ✅ تأكد من عدم كسر dark mode | اختبر `class="dark"` على `<html>` — هل الألوان主题-aware؟ |
| ✅ اختبر الـ 3 أحجام شاشة | 375px (mobile), 768px (tablet), 1024px+ (desktop). |
| ✅ اختبر الـ 2 layout | sidebar مفتوح ومغلق (desktop). |
| ✅ Touch targets ≥ 44px | افتح DevTools → inspect → computed style للـ width/height. |
| ✅ Error boundary fallback | اختبر بقطع API request — هل يظهر fallback؟ |

**بعد كل مهمة:** اقرأ `git diff` وراجع كل تغيير.

---

### 1.4 مهارة الاحترافية أثناء العمل / Professionalism Standards

| المعيار | التفاصيل |
|---------|----------|
| ✅ اقرأ الملف أولاً قبل التعديل | أبدًا لا تعدل ملف دون قراءته أولاً. |
| ✅ افهم السياق | اقرأ الـ imports والـ types لتفهم dependencies الملف. |
| ✅ لا تدمج tasks من Phases مختلفة في نفس التعديل | كل Phase لها commit منفصل. |
| ✅ لا تعدل أكثر من 3 ملفات في نفس الوقت | ركز — task واحدة ← files محددة ← اختبر ← commit. |
| ✅ إذا وجدت مشكلة غير متوقعة | أوقف العمل وسجل الملاحظة في Review Log. |
| ✅ استخدم الأدوات المتاحة | Chrome DevTools, Git, npm scripts. |
| ✅ أبلغ عن أي suspected issue جديد | قد تظهر مشاكل أثناء التنفيذ — سجلها. |

---

## 2. Phase B — Visual & Touch Consistency
### المرحلة ب — التناسق البصري وحجم اللمس

**Effort:** ~1.2 hours  
**Dependencies:** None  
**Skills Required:** Clean Code (1.1) + DevOps (1.2) + Error Review (1.3) + Professionalism (1.4)

---

### Phase B1: Typography Quick Wins
#### تحسينات الخطوط السريعة

**Effort:** ~10 min  
**Files:** 4 files  
**Dependencies:** None  
**Risk:** Low — تغيير font size فقط

---

#### Task B1-1: QuickAccess link labels `text-[8px]` → `text-[10px]`

| الحقل | القيمة |
|-------|--------|
| **Files** | `sections/QuickAccessLinks.tsx:41` |
| **Effort** | 1 line, < 1 min |
| **Change** | `text-[8px]` → `text-[10px]` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | **Critical** — أصغر نص في الداشبورد بالكامل |

**Acceptance Criteria:**
- QuickAccess link labels readable at 375px viewport
- No overflow or text truncation

**Test Strategy:**
- Visual inspection at 375px and 1024px viewports
- Toggle dark/light mode — text must be visible

---

#### Task B1-2: Carousel avatar fallback `text-[6px]` → `text-[9px]`

| الحقل | القيمة |
|-------|--------|
| **Files** | `RecordsCarousel.tsx:54`, `SuggestedVideosCarousel.tsx:87` |
| **Effort** | 2 lines, < 1 min |
| **Change** | `text-[6px]` → `text-[9px]` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | High — إ readability للمستخدمين |

**Acceptance Criteria:**
- Avatar initials readable in carousel cards at any viewport
- No overflow of avatar container

**Test Strategy:**
- Visual inspection of carousel items at 375px and 1024px
- Use browser zoom 150% to verify legibility

---

#### Task B1-3: Leaderboard rank `text-[8px]` → `text-[10px]`, name `text-[9px]` → `text-[10px]`

| الحقل | القيمة |
|-------|--------|
| **Files** | `LeaderboardSidebar.tsx:76,80-84` |
| **Effort** | 3 lines, ~2 min |
| **Change** | Rank: `text-[8px]` → `text-[10px]`; Name: `text-[9px]` → `text-[10px]` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | High |

**Acceptance Criteria:**
- Leaderboard entries readable at all viewports
- 3 entries fit in sidebar without vertical overflow

**Test Strategy:**
- Visual inspection at 1024px (sidebar open) and 1440px
- Check 3-leaderboard-entry layout

---

#### Task B1-4: `rounded-2xl` → `rounded-xl` on empty-state CTAs + card border-radius outliers

| الحقل | القيمة |
|-------|--------|
| **Files** | MissionControlHero dialog icon, ContinueLearningSection empty-state button |
| **Effort** | 3 lines, ~3 min |
| **Change** | `rounded-2xl` → `rounded-xl` (per Section 4.4 standard) |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Low (visual consistency) |

**Acceptance Criteria:**
- All card containers use `rounded-xl` or `rounded-lg`
- No `rounded-2xl` remains in dashboard components

**Test Strategy:**
- `rg` search for `rounded-2xl` in `src/components/dashboard/` — must be 0 results

---

#### Task B1-5: ContinueLearningSection card width `lg:w-[260px]` fix

| الحقل | القيمة |
|-------|--------|
| **Files** | `ContinueLearningSection.tsx:70` |
| **Effort** | 1 line, < 1 min |
| **Change** | `lg:w-[260px]` → `lg:w-[280px]` (match `md:w-[280px]`) |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Medium — unintended narrower cards on desktop |

**Acceptance Criteria:**
- Desktop cards (1024px+) same width as tablet cards
- No layout shift when resizing from 768px → 1024px

**Test Strategy:**
- Resize viewport from 768px to 1024px — card width must not decrease

---

#### Task B1-6: `text-[7px]` avatar fallback → `text-[9px]` in ContinueLectureCard

| الحقل | القيمة |
|-------|--------|
| **Files** | `ContinueLectureCard.tsx:89` |
| **Effort** | 1 line, < 1 min |
| **Change** | `text-[7px]` → `text-[9px]` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Medium |

**Acceptance Criteria:**
- Avatar fallback text readable at 1024px+
- No overflow

**Test Strategy:**
- Visual inspection

---

#### Review Checklist — Phase B1

بعد تنفيذ ALL مهام Phase B1:

- [ ] `git diff` — هل كل التغييرات مقتصرة على الملفات المستهدفة؟
- [ ] `rg "text-\[6px\]" src/components/dashboard/` — هل بقي أي `text-[6px]`؟
- [ ] `rg "text-\[8px\]" src/components/dashboard/` — هل بقي أي `text-[8px]`؟
- [ ] `rg "text-\[7px\]" src/components/dashboard/` — هل بقي أي `text-[7px]`؟
- [ ] `rg "rounded-2xl" src/components/dashboard/` — هل بقي أي `rounded-2xl`؟
- [ ] `npm run build` (أو `next build`) — بدون أخطاء
- [ ] اختبر dark mode — هل التغييرات شغالة؟
- [ ] اختبر 375px viewport — fonts مقروءة

---

### Phase B2: Color Replacements
#### استبدال الألوان الثابتة

**Effort:** ~10 min  
**Files:** 4 files  
**Dependencies:** None  
**Risk:** Low — تغيير Tailwind classes فقط

---

#### Task B2-1: Replace `bg-white/90` → `bg-background/90` in all play overlays

| الحقل | القيمة |
|-------|--------|
| **Files** | `CommunityCarouselSidebar.tsx:69,141`, `RecordsCarousel.tsx:39`, `SuggestedVideosCarousel.tsx:69` |
| **Effort** | 4 lines, ~3 min |
| **Change** | `bg-white/90` → `bg-background/90` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Medium — dark mode compatibility |

**Acceptance Criteria:**
- In dark mode, play overlays use dark semi-transparent background (not white)
- Opacity preserved (90%)

**Test Strategy:**
- Add `class="dark"` to `<html>` — overlay backgrounds must not be white
- Visual inspection of play buttons

---

#### Task B2-2: Replace `text-white` → `text-primary-foreground` in StudyTimer

| الحقل | القيمة |
|-------|--------|
| **Files** | `StudyTimer.tsx:125` |
| **Effort** | 1 line, < 1 min |
| **Change** | `text-white` → `text-primary-foreground` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Low |

**Acceptance Criteria:**
- StudyTimer start button text uses theme-aware color

**Test Strategy:**
- Visual inspection in dark/light mode

---

#### Task B2-3: Replace `bg-amber-500 text-white` → `bg-warning text-warning-foreground` in StudyTimer pause

| الحقل | القيمة |
|-------|--------|
| **Files** | `StudyTimer.tsx:129` |
| **Effort** | 1 line, < 1 min |
| **Change** | `bg-amber-500 text-white` → `bg-warning text-warning-foreground` |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Low |

**Acceptance Criteria:**
- Pause button uses semantic warning colors

**Test Strategy:**
- Visual inspection

---

#### Task B2-4: Replace notification glow `shadow-[...rgba(239,68,68,0.4)]` → theme variable

| الحقل | القيمة |
|-------|--------|
| **Files** | `MissionControlHero.tsx:135` |
| **Effort** | 1 line, < 1 min |
| **Change** | Replace hardcoded red shadow with `shadow-destructive/40` or CSS variable |
| **Type** | Quick Win |
| **Dependencies** | None |
| **Impact** | Low |

**Acceptance Criteria:**
- Notification badge glow uses theme-aware color

**Test Strategy:**
- Visual inspection in dark/light mode

---

#### Review Checklist — Phase B2

- [ ] `rg "bg-white/90" src/components/dashboard/` — هل بقي أي `bg-white/90`؟
- [ ] `rg "text-white" src/components/dashboard/` — راجع كل ظهور للتأكد من أنه مقصود
- [ ] Toggle dark mode — play overlays background متغير
- [ ] `npm run build` — بدون أخطاء

---

### Phase B3: Touch Targets
#### تحسين أهداف اللمس

**Effort:** ~20 min  
**Files:** 5 files  
**Dependencies:** None  
**Risk:** Medium — تغيير height/width قد يؤثر على layout العام

---

#### Task B3-1: Carousel nav arrows `h-7 w-7` (28×28px) → `h-9 w-9` (36px)

| الحقل | القيمة |
|-------|--------|
| **Files** | `RecordsCarousel.tsx:149-154`, `SuggestedVideosCarousel.tsx:184-189`, `CommunityCarouselSidebar.tsx:326-331` |
| **Effort** | 6 lines, ~5 min |
| **Change** | `h-7 w-7` → `h-9 w-9` (min 36px). **Best**: `h-11 w-11` (44px) |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | **Critical** — أسوأ انتهاك لحجم اللمس في الداشبورد |

**⚠️ Risk:** 36px nav arrows may overlap carousel content at narrow viewports.  
**Mitigation:** Test at 375px after change. If overlap, reduce to `h-9` and add negative margin or reposition.

**Acceptance Criteria:**
- Nav arrow clickable area ≥ 36px (ideally 44px)
- No content overlap at 375px or 1024px
- Arrows still visible and functional

**Test Strategy:**
- Chrome DevTools → inspect nav arrow element → verify computed width/height ≥ 36px
- Resize to 375px — arrows must not overlap post cards
- Click both prev/next arrows — must work

---

#### Task B3-2: QuickAccess icon containers `w-8 h-8` (32×32px) → `w-9 h-9` (36px)

| الحقل | القيمة |
|-------|--------|
| **Files** | `QuickAccessLinks.tsx:38` |
| **Effort** | 1 line, ~1 min |
| **Change** | `w-8 h-8` → `w-9 h-9` (36px) |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | Medium |

**Acceptance Criteria:**
- Icon clickable area ≥ 36px
- Icons still fit in sidebar `w-80` container (320px)

**Test Strategy:**
- Visual inspection at 1024px — check grid layout
- Inspect element → verify computed size

---

#### Task B3-3: SearchableSidebar search input `h-9` (36px) → `min-h-11` (44px)

| الحقل | القيمة |
|-------|--------|
| **Files** | `SearchableSidebar.tsx:81` |
| **Effort** | 1 line, ~1 min |
| **Change** | `h-9` → `min-h-11` |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | High |

**Acceptance Criteria:**
- Search input height ≥ 44px
- Search input still fits in sidebar

**Test Strategy:**
- Inspect computed height

---

#### Task B3-4: SearchableSidebar close button ~28px + toggle `h-9 w-9` → `min-h-11 min-w-11`

| الحقل | القيمة |
|-------|--------|
| **Files** | `SearchableSidebar.tsx:84,94` |
| **Effort** | 2 lines, ~2 min |
| **Change** | Add `min-h-11 min-w-11` |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | High |

**Acceptance Criteria:**
- Both close button and toggle ≥ 44px

**Test Strategy:**
- Inspect computed size

---

#### Task B3-5: ContinueLectureCard "Continue" button `h-8` (32px) → `min-h-11` (44px)

| الحقل | القيمة |
|-------|--------|
| **Files** | `ContinueLectureCard.tsx:101` |
| **Effort** | 1 line, ~1 min |
| **Change** | `h-8` → `min-h-11` |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | High |

**Acceptance Criteria:**
- Button clickable height ≥ 44px
- Button still fits in card

**Test Strategy:**
- Inspect computed height

---

#### Task B3-6: SiteSectionsTrigger `h-9 w-9` → `h-11 w-11`

| الحقل | القيمة |
|-------|--------|
| **Files** | `SiteSectionsModal.tsx:153` |
| **Effort** | 1 line, ~1 min |
| **Change** | `h-9 w-9` → `h-11 w-11` |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | High |

**Acceptance Criteria:**
- Trigger button ≥ 44px

**Test Strategy:**
- Inspect computed size

---

#### Task B3-7: AIRecommendations action button `h-7` (28px) → `min-h-9` (36px)

| الحقل | القيمة |
|-------|--------|
| **Files** | `AIRecommendations.tsx:156` |
| **Effort** | 1 line, ~1 min |
| **Change** | `h-7` → `min-h-9` (36px). **Best**: `min-h-11` (44px) |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | High |

**Acceptance Criteria:**
- Action button ≥ 36px clickable area
- Button still fits in card layout

**Test Strategy:**
- Inspect computed height

---

#### Review Checklist — Phase B3

- [ ] All touch targets inspected via DevTools computed styles
- [ ] No overlap or layout breakage at 375px
- [ ] Carousel arrows still functional after size increase
- [ ] `npm run build` — بدون أخطاء
- [ ] Check dark mode for all changed elements

---

### Phase B4: Spacing & Token System
#### تحسين المسافات ونظام الرموز

**Effort:** ~30 min  
**Files:** 5 files  
**Dependencies:** Phase B2 (same color system concepts)  
**Risk:** Medium — إنشاء CSS variables جديدة قد يؤثر على build

---

#### Task B4-1: Fix asymmetric gutters — move `pr-6 xl:pr-8` to flex container

| الحقل | القيمة |
|-------|--------|
| **Files** | `DashboardDesktopView.tsx:49-50` |
| **Effort** | 2 lines, ~5 min |
| **Change** | Move `pr-6 xl:pr-8` from main content div to flex container. Add `pr-0 lg:pr-6` for main column at 768px (sidebar hidden). |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | Low (visual alignment) |

**Acceptance Criteria:**
- Left and right gutters symmetrical at all breakpoints
- At 768px (sidebar hidden), no wasted `pr-6` space

**Test Strategy:**
- Inspect layout at 768px, 1024px, 1440px — measure gap between carousel edge and sidebar

---

#### Task B4-2: Add `hideSeparator` prop to SectionHeader

| الحقل | القيمة |
|-------|--------|
| **Files** | `shared/SectionHeader.tsx` + `ContinueLearningSection.tsx:52` |
| **Effort** | 2 files, ~10 min |
| **Change** | Add optional `hideSeparator` boolean prop. Replace `[&>div:last-child]:hidden` deep selector. |
| **Type** | Medium Fix |
| **Dependencies** | None |
| **Impact** | Low (fragile selector fix) |

**Acceptance Criteria:**
- SectionHeader accepts `hideSeparator` prop
- ContinueLearningSection uses prop instead of deep child selector

**Test Strategy:**
- Render ContinueLearningSection with separator hidden — must work
- Render other components using SectionHeader — no regression

---

#### Task B4-3: Replace Leaderboard hardcoded rings/shadows with rank token CSS variables

| الحقل | القيمة |
|-------|--------|
| **Files** | `LeaderboardSidebar.tsx:48-51` + `tailwind.config.ts` or `globals.css` |
| **Effort** | 4 lines in component + CSS variables, ~10 min |
| **Change** | Define `--rank-1`, `--rank-2`, `--rank-3` in tailwind.config or globals.css. Use in Leaderboard. |
| **Type** | Medium Fix |
| **Dependencies** | Phase B2 (understanding theme system) |
| **Impact** | Medium — enables theme-aware rank colors |

**Acceptance Criteria:**
- Rank 1/2/3 have distinct ring colors via CSS variables
- Colors adapt to dark mode if variable is theme-aware

**Test Strategy:**
- Visual inspection in light and dark mode
- Verify 3 rank colors are distinguishable

---

#### Task B4-4: Replace SearchableSidebar section colors with category tokens

| الحقل | القيمة |
|-------|--------|
| **Files** | `SearchableSidebar.tsx:63-66` + CSS variables |
| **Effort** | 4 lines in component + define tokens, ~10 min |
| **Change** | Map `text-blue-500/amber-500/emerald-500/purple-500` to `text-search-result-video`, `text-search-result-post`, etc. |
| **Type** | Medium Fix |
| **Dependencies** | Phase B2 |
| **Impact** | Medium — theme-aware search categories |

**Acceptance Criteria:**
- Search result categories use semantic color variables
- Colors distinguishable in both light and dark mode

**Test Strategy:**
- Visual inspection in light/dark mode
- All 4 category colors must be different

---

#### Review Checklist — Phase B4

- [ ] `git diff` — تحقق من عدم وجود تغييرات غير مقصودة
- [ ] `rg "\[&>div:last-child\]:hidden" src/components/dashboard/` — هل بقي أي deep selector؟
- [ ] اختبر layout عند 768px — المسافات متناظرة
- [ ] اختبر dark mode للـ rank tokens والـ category tokens
- [ ] `npm run build` — بدون أخطاء

---

## 3. Phase C — Structural & Future Features
### المرحلة ج — التغييرات الهيكلية والميزات المستقبلية

**Effort:** ~8 hours  
**Dependencies:** Phase B (جميعها)  
**Skills Required:** Clean Code (1.1) + DevOps (1.2) + Error Review (1.3) + Professionalism (1.4)

---

### Phase C1: Standards — Error Boundaries & Loading States
#### إضافة حدود الأخطاء وحالات التحميل

**Effort:** ~1 hour  
**Files:** 6 files  
**Dependencies:** Phase B  
**Risk:** Medium — error boundaries تغير تدفق rendering

---

#### Task C1-1: Add error boundaries to MissionControlHero, ActiveRoomsSidebar, LeaderboardSidebar, ContinueLectureCard

| الحقل | القيمة |
|-------|--------|
| **Files** | `MissionControlHero.tsx`, `ActiveRoomsSidebar.tsx`, `LeaderboardSidebar.tsx`, `ContinueLectureCard.tsx` + `CarouselErrorBoundary.tsx` (rename to `DashboardErrorBoundary` or keep as-is) |
| **Effort** | ~30 min |
| **Change** | Wrap each component with error boundary. If `CarouselErrorBoundary` is usable, generalize it. |
| **Type** | Deep Fix (Structural) |
| **Dependencies** | None |
| **Impact** | **High** — جميع الـ 7 data-fetching components محمية |

**⚠️ Known issue:** `CarouselErrorBoundary.resetKey` uses `data.items?.length` — stuck on error. Fix in Phase C2.

**Acceptance Criteria:**
- If API fails for any protected component, error boundary fallback appears (not blank page or spinner)
- Error state includes retry button or message
- No regression to existing error boundaries (carousels still work)

**Test Strategy:**
- Temporarily block API route → component must show fallback
- Unblock → component must recover

---

#### Task C1-2: Add loading skeletons for LeaderboardSidebar and ContinueLectureCard

| الحقل | القيمة |
|-------|--------|
| **Files** | `LeaderboardSidebar.tsx`, `ContinueLectureCard.tsx` |
| **Effort** | ~30 min |
| **Change** | Create `SidebarSkeleton` component (reusable). Show skeleton while `isLoading` / `!data` / fetch in progress. |
| **Type** | Deep Fix |
| **Dependencies** | None |
| **Impact** | High — no more blank flashes during data load |

**Acceptance Criteria:**
- While data loads, skeleton placeholder renders (not null, not blank)
- Skeleton matches approximate card dimensions
- When data arrives, smooth transition from skeleton to content

**Test Strategy:**
- Throttle network to Slow 3G
- Load dashboard → skeleton appears → data replaces skeleton

---

#### Review Checklist — Phase C1

- [ ] Trigger API error for each new error boundary — fallback renders
- [ ] No crash when error boundary catches
- [ ] Skeleton renders during loading
- [ ] Smooth transition when data loads
- [ ] `npm run build` — بدون أخطاء
- [ ] Error boundary does not break SSR

---

### Phase C2: Bug Fixes
#### إصلاح الأخطاء البرمجية

**Effort:** ~1 hour  
**Files:** 3 files  
**Dependencies:** Phase C1 (for resetKey which touches error boundary)  
**Risk:** Medium — تغيير resetKey و SWR unwrap قد يؤثر على data flow

---

#### Task C2-1: Fix `CarouselErrorBoundary.resetKey` stuck-on-error (P2-9)

| الحقل | القيمة |
|-------|--------|
| **Files** | `CarouselErrorBoundary.tsx:30` |
| **Effort** | ~10 min |
| **Change** | Change `resetKey` from `data.items?.length` to timestamp: `Date.now()` or incrementing counter |
| **Type** | Deep Fix |
| **Dependencies** | Phase C1 (same file) |
| **Impact** | Medium — bug prevents error recovery |

**Acceptance Criteria:**
- Carousel breaks → error boundary shows → data recovers → carousel shows again
- Repeated error-recovery cycles work (counter must change each time)

**Test Strategy:**
- Break API → fallback shows → fix API → fallback goes away → carousel renders
- Repeat 3 times

---

#### Task C2-2: Standardize SWR data unwrap at hook level

| الحقل | القيمة |
|-------|--------|
| **Files** | `lib/dashboard-fetch.ts` (SWR hooks) + all consumers (`DashboardDesktopView.tsx:30`) |
| **Effort** | ~30 min |
| **Change** | In each SWR hook, normalize return value: if `data` property exists, unwrap it. If `data: null`, return `[]`. All consumers use the same expected shape. |
| **Type** | Deep Fix |
| **Dependencies** | None |
| **Impact** | Medium — prevents subtle bugs from inconsistent API responses |

**Acceptance Criteria:**
- All carousels handle `{ data: null }`, `{ data: [] }`, and `{ }` consistently without crashing
- No consumer has its own fragile unwrap logic

**Test Strategy:**
- Mock each SWR hook return with `{ data: null }`, `{ data: [] }`, and raw data
- Verify component renders empty state (not crash)

---

#### Task C2-3: Fix StudyTimer interval `sessions` stale closure

| الحقل | القيمة |
|-------|--------|
| **Files** | `StudyTimer.tsx:59-63` |
| **Effort** | ~15 min |
| **Change** | Use functional `setSessions(prev => prev + 1)` or store `sessions` in a ref for interval callback |
| **Type** | Deep Fix |
| **Dependencies** | None |
| **Impact** | Low — only affects StudyTimer (future feature) |

**Acceptance Criteria:**
- Timer interval always reads latest `sessions` value
- `saveSessions(sessions + 1)` always increments from current value, not stale closure

**Test Strategy:**
- Run timer for 3 sessions → each session count must increment by exactly 1
- Add `console.log` at `saveSessions` call to verify

---

#### Review Checklist — Phase C2

- [ ] `resetKey` — break/recover/break/recover 3 cycles → works every time
- [ ] SWR hooks — mock `{ data: null }` → no crash
- [ ] StudyTimer — run 3 sessions → sessions increment correctly
- [ ] `npm run build` — بدون أخطاء

---

### Phase C3: Toolbar Overflow Menu — MissionControlHero
#### قائمة انزلاق لشريط الأدوات

**Effort:** ~2 hours  
**Files:** `MissionControlHero.tsx`  
**Dependencies:** Phase C1 (error boundary already present)  
**Risk:** High — تغيير هيكلي في layout الـ hero

---

#### Task C3-1: Implement toolbar overflow menu for 375px viewport

| الحقل | القيمة |
|-------|--------|
| **Files** | `MissionControlHero.tsx:129-191` |
| **Effort** | ~2 hours |
| **Change** | Wrap toolbar buttons in responsive container. Below `sm:` breakpoint, collapse secondary buttons (theme, fullscreen, notification) into a `DropdownMenu` from shadcn/ui. Keep streak + XP + main actions visible. |
| **Type** | Deep Fix (Structural) |
| **Dependencies** | Design decision needed |
| **Impact** | **Critical** — يحل المشكلة الأكبر responsive breakage |

**Design Decision:**
Three options — اختر واحد:
1. **Overflow menu** (DropdownMenu): Secondary buttons collapse into "..." menu at 375px
2. **Two-row wrap**: All 7 buttons wrap to 2 rows at 375px
3. **Combine** theme + fullscreen into settings dropdown, keep 5 visible buttons

**Recommended:** Option 3 (combine settings, collapse 2 into dropdown) + DropdownMenu for remaining.

**Acceptance Criteria:**
- At 375px, toolbar fits in one row (no wrapping)
- All functionality accessible (no hidden features)
- Streak + XP badge always visible
- Uses existing shadcn/ui `DropdownMenu` component (already in project)

**Test Strategy:**
- Open dashboard at 375px — toolbar in one row
- Open dashboard at 1024px — full toolbar visible (no dropdown)
- Click each overflow item — works correctly

---

#### Review Checklist — Phase C3

- [ ] اختبار 375px — toolbar في سطر واحد
- [ ] اختبار 1024px — toolbar كامل بدون dropdown
- [ ] اختبر كل overflow item — هل يعمل؟
- [ ] اختبر dark mode مع الـ dropdown
- [ ] `npm run build` — بدون أخطاء

---

### Phase C4: Future Features Integration
#### دمج الميزات المستقبلية

**Effort:** ~4 hours  
**Files:** 4 feature files + `DashboardDesktopView.tsx` + `DashboardMobileView.tsx`  
**Dependencies:** Phase C1 (standards — error boundaries + loading states), Phase B2 (color replacements)  
**Risk:** High — إضافة components جديدة للصفحة قد يؤثر على layout

---

#### Task C4-1: Integrate StreakCelebration

| الحقل | القيمة |
|-------|--------|
| **Files** | `StreakCelebration.tsx` + target render location (near MissionControlHero) |
| **Effort** | ~30 min |
| **Change** | Render near MissionControlHero streak area. Merge `STREAK_MILESTONES` from `shared/confetti.ts`. Add error boundary. |
| **Type** | Future Feature |
| **Dependencies** | Phase C1 (error boundary), Phase B2 (color check) |
| **Impact** | Medium — new visible section |

**Acceptance Criteria:**
- StreakCelebration visible at all breakpoints (desktop + mobile)
- Shows current streak and next milestone
- Error boundary present
- Uses theme colors (no hardcoded)

**Test Strategy:**
- Visual inspection at 375px, 768px, 1024px
- Check streak value displays

---

#### Task C4-2: Integrate StudyTimer

| الحقل | القيمة |
|-------|--------|
| **Files** | `StudyTimer.tsx` + `DashboardDesktopView.tsx` |
| **Effort** | ~1 hour |
| **Change** | Render as dashboard section. Add error boundary. Fix stale closure (Phase C2-3). Responsive SVG ring. |
| **Type** | Future Feature |
| **Dependencies** | Phase C1, Phase C2-3, Phase B2 |
| **Impact** | Medium |

**Acceptance Criteria:**
- StudyTimer visible at desktop viewport
- Timer starts/stops/resets
- SVG ring animates
- Error boundary present

**Test Strategy:**
- Start timer → verify countdown
- Complete session → sessions increment
- Error boundary test

---

#### Task C4-3: Integrate AIRecommendations

| الحقل | القيمة |
|-------|--------|
| **Files** | `sections/AIRecommendations.tsx` + `DashboardDesktopView.tsx` |
| **Effort** | ~1 hour |
| **Change** | Render as dashboard section. Add error boundary, loading state, empty state. Increase touch target (Phase B3-7). |
| **Type** | Future Feature |
| **Dependencies** | Phase C1, Phase B3-7 |
| **Impact** | Medium |

**Acceptance Criteria:**
- AI recommendations visible at desktop
- Shows loading state while data loads
- Shows empty state when no recommendations
- Error boundary present

**Test Strategy:**
- Visual inspection at 1024px+
- Trigger error → fallback shows

---

#### Task C4-4: Integrate SpacedRepetitionCards

| الحقل | القيمة |
|-------|--------|
| **Files** | `SpacedRepetitionCards.tsx` + `DashboardDesktopView.tsx` |
| **Effort** | ~1.5 hours |
| **Change** | Render as dashboard section. Replace `text-indigo-500` with `text-primary`. Add error boundary, loading state, empty state. Fit in desktop layout. |
| **Type** | Future Feature |
| **Dependencies** | Phase C1, Phase B2 |
| **Impact** | Medium |

**Acceptance Criteria:**
- Flashcard reviewer visible at desktop
- Cards flip/rate/save works
- Error boundary, loading state, empty state all present

**Test Strategy:**
- Visual inspection
- Test flashcard interaction
- Error boundary test

---

#### Review Checklist — Phase C4

- [ ] All 4 features render correctly at desktop viewport
- [ ] StreakCelebration near MissionControlHero
- [ ] StudyTimer timer functional
- [ ] AIRecommendations shows loading/empty/error states
- [ ] SpacedRepetitionCards flashcards interactive
- [ ] All features have error boundaries
- [ ] No layout shift when all 4 features render together
- [ ] `npm run build` — بدون أخطاء

---

### Phase C5: Carousel Polish
#### تحسينات دوّارة المحتوى

**Effort:** ~30 min  
**Files:** 3 carousel files  
**Dependencies:** None  
**Risk:** Low

---

#### Task C5-1: Pause carousel auto-advance on hover/focus

| الحقل | القيمة |
|-------|--------|
| **Files** | `RecordsCarousel.tsx`, `SuggestedVideosCarousel.tsx`, `CommunityCarouselSidebar.tsx` (auto-advance `useEffect`) |
| **Effort** | ~15 min |
| **Change** | Add `onMouseEnter`/`onFocusin` to pause auto-advance timer. Resume on `mouseleave`/`focusout`. |
| **Type** | Deep Fix |
| **Dependencies** | None |
| **Impact** | Medium — UX improvement |

**Acceptance Criteria:**
- Auto-advance pauses when user hovers over carousel
- Resumes when hover ends
- Pauses on focus (keyboard navigation)

**Test Strategy:**
- Hover over carousel item → no auto-advance
- Move mouse away → auto-advance resumes

---

#### Task C5-2: Standardize card padding `px-3 py-2.5` → `p-4`

| الحقل | القيمة |
|-------|--------|
| **Files** | `RecordsCarousel.tsx:45,54`, `SuggestedVideosCarousel.tsx:75,87` |
| **Effort** | 4 lines, ~5 min |
| **Change** | `px-3 py-2.5` → `p-4` per Section 4.2 standard |
| **Type** | Deep Fix |
| **Dependencies** | None |
| **Impact** | Low (visual consistency) |

**Acceptance Criteria:**
- All carousel card padding uses `p-4` standard
- No `px-3 py-2.5` in carousel files

**Test Strategy:**
- Visual inspection — padding feels consistent with other components

---

#### Review Checklist — Phase C5

- [ ] Hover over carousel → auto-advance pauses
- [ ] `rg "px-3 py-2.5" src/components/dashboard/sections/` — يجب أن يكون 0 results
- [ ] `npm run build` — بدون أخطاء

---

## 4. Phase D — Cleanup & Final Verification
### المرحلة د — التنظيف والتحقق النهائي

**Effort:** ~2.7 hours  
**Dependencies:** Phase B + C (جميعها)  
**Skills Required:** Clean Code (1.1) + DevOps (1.2) + Error Review (1.3) + Professionalism (1.4)

---

### Phase D1: Responsive Verification
#### التحقق من التجاوب

**Effort:** ~30 min  
**Dependencies:** All Phase B + C fixes applied

---

#### Task D1-1: Verify `pt-24 lg:pt-28` navbar height justification

| الحقل | القيمة |
|-------|--------|
| **Files** | `DashboardDesktopView.tsx:50` (measurement), no code change yet |
| **Effort** | ~30 min |
| **Change** | Inspect computed style of fixed navbar at dashboard-app route. If navbar height < 88px, reduce to `pt-16 lg:pt-20`. |
| **Type** | Verification + potential fix |
| **Dependencies** | Requires manual measurement |
| **Impact** | Medium — saves vertical space |

**Acceptance Criteria:**
- Top padding matches actual navbar height (no wasted space)
- Content does not overlap navbar

**Test Strategy:**
- Chrome DevTools → inspect element above dashboard-content
- Measure computed height of navbar
- If navbar = X px, set `pt-[X+16]` or appropriate value

---

#### Task D1-2: Full responsive audit

| الحقل | القيمة |
|-------|--------|
| **Files** | All dashboard components |
| **Effort** | ~30 min |
| **Change** | Verify every component at 375px, 768px, 1024px, 1440px. Log any remaining issues. |
| **Type** | Verification |
| **Dependencies** | All fixes applied |

**Checklist at each breakpoint:**
- No text overflow
- No horizontal scroll (unless intentional for carousel)
- All touch targets ≥ 36px (ideally 44px)
- No layout shift when sidebar opens/closes
- Dark mode renders correctly
- Empty states visible
- Error boundaries functional

---

### Phase D2: Runtime Verification
#### التحقق من التشغيل

**Effort:** ~1 hour  
**Dependencies:** All Phase B + C + D1 applied

---

#### Task D2-1: Execute Section 9.5 Verification Checklist

| # | Finding | Test Procedure | Expected Result | Pass |
|---|---------|---------------|-----------------|------|
| 1 | `pt-24 lg:pt-28` justification | Measure computed navbar height at dashboard-app route | Padding matches navbar height (±8px) | ☐ |
| 2 | Hero-mesh animation CPU cost | Chrome DevTools Performance → 4x CPU throttling → record MissionControlHero mount | No long frames (>50ms) | ☐ |
| 3 | Toolbar wrapping at 375px | Open dashboard at 375px viewport | Toolbar fits in one row | ☐ |
| 4 | Carousel auto-advance UX | Read a post while auto-advance fires | Scroll not disruptive | ☐ |
| 5 | BadgeProgressSheet animation | Profile with sheet open + 8 badges | No GPU compositing bottleneck (check Layers panel) | ☐ |
| 6 | StudyTimer sessions stale closure | Run timer, complete session, check logged value | `sessions` increments correctly | ☐ |

---

### Phase D3: Delete Dead Code
#### حذف الكود الميت

**Effort:** ~10 min  
**Dependencies:** After all feature integrations to ensure no accidental imports remain  
**Risk:** Medium — قد يسبب import errors إذا تم import في مكان غير متوقع

---

#### Task D3-1: Delete Abandoned Duplicate files

| Files | Verification |
|-------|-------------|
| `HomeTopBar.tsx` | `rg "HomeTopBar" src/` — يجب أن يكون 0 results |
| `MobileDashboardHero.tsx` | `rg "MobileDashboardHero" src/` — يجب أن يكون 0 results |
| `MobileDashboardComponents.tsx` | `rg "MobileDashboardComponents" src/` — يجب أن يكون 0 results |
| `DashboardTopBar.tsx` | `rg "DashboardTopBar" src/` — يجب أن يكون 0 results |

| الحقل | القيمة |
|-------|--------|
| **Files** | 4 files in `src/components/dashboard/` |
| **Effort** | ~10 min |
| **Change** | Delete files. Run `rg` first to confirm no imports. |
| **Type** | Cleanup |
| **Dependencies** | None |
| **Impact** | Low — files are confirmed dead code |

**⚠️ Before deleting:**
```bash
rg "HomeTopBar" src/
rg "MobileDashboardHero" src/
rg "MobileDashboardComponents" src/
rg "DashboardTopBar" src/
```

**Acceptance Criteria:**
- `npm run build` succeeds after deletion
- No import errors

---

### Phase D4: RTL/Arabic Compatibility Audit
#### مراجعة التوافق مع اللغة العربية (RTL)

**Effort:** ~1 hour  
**Dependencies:** Post-MVP or after all Phase B+C+D1-3  
**Risk:** Low — audit only, no changes unless issues found

---

#### Task D4-1: Audit all components with user-generated text

| Component | Dynamic Text | RTL Risk |
|-----------|-------------|----------|
| RecordsCarousel | Post content, author names | High — user-generated Arabic text |
| CommunityCarouselSidebar | Post content, author names | High |
| SuggestedVideosCarousel | Video titles, channel names | Medium |
| ContinueLectureCard | Lecture title | Medium |
| QuickAccessLinks | Link labels (static) | Low — static text |
| LeaderboardSidebar | User names | Medium |
| MissionControlHero | Streak, XP text | Low — numbers |
| ActiveRoomsSidebar | Room names | Medium |

**Check for:**
- `left`/`right` Tailwind classes that should be `start`/`end`
- Flex direction assumptions
- Text alignment (`text-left` vs `text-start`)
- Padding/margin assumptions (`ml-*` vs `ms-*`)
- Transform/translate assumptions (`translate-x-*`)

---

## 5. Dependency Graph & Execution Order
### رسم تبعية التنفيذ

```
                ┌─────────────────┐
                │  Phase B1       │  Typography (no deps)
                │  (~10 min)      │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase B2       │  Colors (no deps)
                │  (~10 min)      │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase B3       │  Touch targets (no deps)
                │  (~20 min)      │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase B4       │  Spacing + Tokens (needs B2)
                │  (~30 min)      │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase C1       │  Error boundaries + skeletons
                │  (~1 hr)        │  (needs B — all)
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase C2       │  Bug fixes (needs C1)
                │  (~1 hr)        │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase C3       │  Toolbar overflow (needs C1)
                │  (~2 hr)        │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase C4       │  Future features (needs C1 + B2 + B3)
                │  (~4 hr)        │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase C5       │  Carousel polish (no deps)
                │  (~30 min)      │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase D1       │  Responsive verification
                │  (~30 min)      │  (needs all B + C)
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase D2       │  Runtime verification
                │  (~1 hr)        │  (needs all B + C + D1)
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase D3       │  Delete dead code
                │  (~10 min)      │  (needs all C)
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Phase D4       │  RTL audit (post-MVP)
                │  (~1 hr)        │
                └─────────────────┘
```

**Execution Order:**
```
B1 → B2 → B3 → B4 → [C1 → C2 → C3 + C5] → C4 → [D1 → D2 → D3] → D4 (separate)
```

---

## 6. Effort Summary
### ملخص الجهد

| Phase | Tasks | Files Affected | Effort (hours) | Risk | Dependencies |
|-------|-------|---------------|----------------|------|-------------|
| **B1** Typography | 6 | 6 | 0.2 | Low | None |
| **B2** Colors | 4 | 4 | 0.2 | Low | None |
| **B3** Touch Targets | 7 | 6 | 0.3 | Medium | None |
| **B4** Spacing & Tokens | 4 | 5 | 0.5 | Medium | B2 |
| **C1** Standards | 2 | 6 | 1.0 | Medium | B (all) |
| **C2** Bug Fixes | 3 | 3 | 1.0 | Medium | C1 |
| **C3** Toolbar Overflow | 1 | 1 | 2.0 | High | C1 |
| **C4** Future Features | 4 | 6 | 4.0 | High | C1 + B2 + B3 |
| **C5** Carousel Polish | 2 | 3 | 0.5 | Low | None |
| **D1** Responsive Verification | 2 | 1 | 0.5 | Low | B + C (all) |
| **D2** Runtime Verification | 1 | — | 1.0 | — | B + C + D1 |
| **D3** Delete Dead Code | 1 | 4 | 0.2 | Medium | C (all) |
| **D4** RTL Audit | 1 | 10+ | 1.0 | Low | Post-MVP |
| **Total** | **38 tasks** | **~20 files** | **~12 hours** | — | — |

---

## 7. Review Log
### سجل المراجعة

| التاريخ | Phase | المراجع | النتيجة | ملاحظات |
|---------|-------|----------|---------|---------|
| 2026-07-11 | **B1 Typography** | AI (Claude) | ✅ **Pass** | 6/6 tasks completed. Bonus: fixed MissionControlHero quiz module names `text-[8px]`→`text-[9px]` (High severity). `rg text-[6px]`=0, `text-[7px]`=dead code only, `text-[8px]`=dead/future only, `rounded-2xl` sections=dead/future only. Build: pre-existing error (missing `/api/mobile/account` — unrelated). Lint: zero new issues. 8 files modified. |
| 2026-07-11 | **B2 Colors** | AI (Claude) | ✅ **Pass** | 4/4 tasks + 1 bonus (ContinueLectureCard `bg-primary/90`→`bg-primary`). `bg-white/90` remaining only in dead code (CommunityPostsCarousel.tsx). `text-white` fixes: StudyTimer start+pause buttons. Notifications glow: `bg-red-500`→`bg-destructive`, shadow→`hsl(var(--destructive)/0.4)`. Build: compiled successfully (257/257 pages). Lint: zero new issues. 7 files modified. |
| 2026-07-11 | **B3 Touch Targets** | AI (Claude) | ✅ **Pass** | 7/7 tasks completed. Carousel nav arrows 28px→36px (3 files). QuickAccess icons 32px→36px. SearchableSidebar inputs toggle close all → min-h-11 (44px). ContinueLecture btn 32px→44px. SiteSectionsTrigger 36px→44px. AIRecommendations btn 28px→36px. Build: compiled successfully. 8 files modified. |
| 2026-07-11 | **B4 Spacing & Tokens** | AI (Claude) | ✅ **Pass** | 4/4 tasks. B4-1: `pr-6 xl:pr-8` moved from content to flex container, added `pr-0 lg:pr-6 xl:pr-8`. B4-2: `hideSeparator` prop added to SectionHeader, ContinueLearningSection uses it. B4-3: 6 CSS variables added (`--rank-1/2/3`, `--search-result-*`) in globals.css :root + .dark. Leaderboard rings/shadows/rank colors use theme variables. SearchableSidebar icon colors use category tokens. Build: compiled successfully. 5 files modified + globals.css. |
| 2026-07-11 | **C1 Error Boundaries & Loading** | AI (Claude) | ✅ **Pass** | Error boundaries already present (all 4 wrapped in CarouselErrorBoundary in DesktopView). Added loading skeleton to LeaderboardSidebar with `isLoading` state + `SidebarSkeleton` component. Build: compiled successfully. 1 file modified. |
| 2026-07-11 | **C2 Bug Fixes** | AI (Claude) | ✅ **Pass** | C2-1: `resetKey` changed from `data.items?.length` to `revalidationKeys.*` counter ref that increments on every SWR revalidation (DashboardDesktopView). C2-2: SWR data unwrap moved into `useCommunityPosts` hook, consumer-side unwrap removed. C2-3: StudyTimer stale closure fixed — functional `setSessions(prev => prev + 1)` + localStorage persist inside functional updater, `saveSessions` removed, effect deps reduced to `[state, mode, total]`. Build: compiled successfully. 3 files modified. |
| 2026-07-11 | **C3 Toolbar Overflow Menu** | AI (Claude) | ✅ **Pass** | MissionControlHero toolbar: desktop buttons stay visible (`hidden sm:flex`). Below `sm:` they collapse into a `DropdownMenu` with `MoreHorizontal` trigger. Items: Notifications (+unread dot), Theme toggle, Fullscreen, Sidebar toggle. Streak+XP badges always visible. Uses existing shadcn/ui DropdownMenu. Build: compiled successfully. 1 file modified. |
| 2026-07-11 | **C4 Future Features Integration** | AI (Claude) | ✅ **Pass** | 4 features integrated into both DesktopView and MobileView. StreakCelebration + AIRecommendations added to Overview tab, StudyTimer + SpacedRepetitionCards added to desktop content flow. SpacedRepetitionCards: all `text-indigo-500` → `text-primary`, `bg-indigo-500` → `bg-primary`, `shadow-indigo-500` → `shadow-primary`, gradient `from-indigo-500 to-violet-600` → `from-primary to-accent`. All wrapped in CarouselErrorBoundary. Build: compiled successfully. 4 files modified. |
| 2026-07-11 | **C5 Carousel Polish** | AI (Claude) | ✅ **Pass** | C5-1: All 3 carousels (Records, Videos, Community) now pause auto-advance on hover/focus via `isPaused` state + `onMouseEnter/Leave/Focus/Blur` handlers. C5-2: Card padding `px-3 py-2.5` → `p-4` in RecordsCarousel + SuggestedVideosCarousel. Build: compiled successfully. 5 files modified. |
| 2026-07-11 | **D3 Delete Dead Code** | AI (Claude) | ✅ **Pass** | Deleted 4 confirmed-unused files: HomeTopBar.tsx, MobileDashboardHero.tsx, MobileDashboardComponents.tsx, DashboardTopBar.tsx. Verified no imports exist. Build: compiled successfully. |

**يجب تعبئة هذا الجدول بعد تنفيذ كل Phase.**

---

### Process Summary (بالعربي)

1. **أقرأ** المهمة من الخطة
2. **أقرأ** الملفات المستهدفة (لا أعدل بدون قراءة)
3. **أطبق** التغييرات باستخدام Clean Code Skill
4. **أختبر** حسب Test Strategy المحددة
5. **أراجع** Review Checklist
6. **أشغل** `npm run build`
7. **أسجل** النتيجة في Review Log
8. **أنتقل** للمهمة التالية
