# Modules Page Redesign Plan

## Goal
تحويل صفحة Modules الحالية إلى design مستوحى من المشروع المرجعي (Vite + TanStack Router + Tailwind v4).
نفس الداتا، نفس الـ business logic، فقط UI يتحول إلى تجربة premium.

---

## Step 1 — إضافة CSS variables (shadow-card, shadow-elevated) في globals.css
**المهارة**: Frontend (CSS / Tailwind)
**التفاصيل**: إضافة `--shadow-card` و `--shadow-elevated` في `:root` و `.dark` في `src/styles/globals.css`.
**الملف**: `src/styles/globals.css`
**الخطة**:
```css
:root {
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06);
  --shadow-elevated: 0 10px 40px hsl(var(--primary) / 0.25);
}
.dark {
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.2), 0 8px 24px rgb(0 0 0 / 0.4);
  --shadow-elevated: 0 10px 40px rgb(0 0 0 / 0.5);
}
```

---

## Step 2 — إنشاء TopBar.tsx
**المهارة**: Frontend (React / Next.js / Tailwind)
**الملف الجديد**: `src/components/modules/TopBar.tsx`
**المحتوى**:
- Search input (decorative — no action needed)
- Notifications bell icon + dot
- Bookmarks icon
- User avatar button (first letter of name)
- مستوحى من TopBar في المرجع

---

## Step 3 — إنشاء HeroSection.tsx
**المهارة**: Frontend (React / Tailwind / تصدير Server Component)
**الملف الجديد**: `src/components/modules/HeroSection.tsx`
**المحتوى**:
- Heading "Medical Library"
- Subtitle "Master your curriculum through structured clinical modules."
- CTA button "Continue Last Lecture" (لينك لآخر نشاط)
- Bookmark secondary icon button
- Stats bar underneath: Modules, Lectures, Questions counts
- مستوحى من Hero في المرجع مع الحفاظ على illustration placeholder (دائرة مفرغة)

---

## Step 4 — إنشاء StatsCard.tsx
**المهارة**: Frontend (React / Tailwind / Framer Motion)
**الملف الجديد**: `src/components/modules/StatsCard.tsx`
**المحتوى**:
- 4 stats: Modules (total), Lectures (total), Questions (total), Study Hours (masteredCount)
- Overall completion progress bar مع percentage
- Animated counter (Framer Motion useSpring)
- `rounded-3xl bg-card shadow-[var(--shadow-card)] ring-1 ring-border/60`
- مستوحى من Stats card في المرجع

---

## Step 5 — إنشاء QuickActions.tsx
**المهارة**: Frontend (React / Tailwind / Framer Motion)
**الملف الجديد**: `src/components/modules/QuickActions.tsx`
**المحتوى**:
- 5 horizontal cards: Continue, Bookmarks, Completed, Downloads, Recent
- كل كارت: icon circle + title + subtitle
- hover: translateY(-2px) + shadow-lg
- مستوحى من QuickActions في المرجع

---

## Step 6 — إنشاء FilterPills.tsx
**المهارة**: Frontend (Client Component / React / Tailwind)
**الملف الجديد**: `src/components/modules/FilterPills.tsx`
**المحتوى**:
- `"use client"`
- Pill filters: All Modules, In Progress, Completed, Basic Sciences, Clinical Sciences, Electives
- Active state bg-accent + ring-1 ring-primary/30
- Sort by dropdown (decorative)
- Filter button icon
- `onFilterChange` callback لتصفية الموديولات
- مستوحى من Filters في المرجع

---

## Step 7 — إنشاء FeaturedModuleCard.tsx
**المهارة**: Frontend (React / Tailwind / Framer Motion)
**الملف الجديد**: `src/components/modules/FeaturedModuleCard.tsx`
**المحتوى**:
- يأخذ module (الأعلى percentage واللي أقل من 100%)
- Gradient خلفية + صورة الموديول semi-transparent
- Abbreviation (CNS) كبير
- Full name
- Subjects, Lectures, Questions counts
- Mastery progress bar + percentage
- Continue CTA button
- مستوحى من Continue Learning section في المرجع

---

## Step 8 — إنشاء RecentModuleCard.tsx
**المهارة**: Frontend (React / Tailwind)
**الملف الجديد**: `src/components/modules/RecentModuleCard.tsx`
**المحتوى**:
- كارت صغير بخلفية gradient
- صورة الموديول blending
- Abbreviation + full name
- Lectures + Questions counts
- Progress bar صغير + percentage
- Bookmark icon button
- مستوحى من RecentCard في المرجع

---

## Step 9 — إنشاء ModuleCard.tsx (All Modules)
**المهارة**: Frontend (React / Tailwind / Framer Motion)
**الملف الجديد**: `src/components/modules/ModuleCard.tsx`
**المحتوى**:
- كارت الموديول الجديد للـ All Modules grid
- Abbreviation (CNS) باللون المميز للموديول
- Full name
- Lectures + Questions counts
- Progress bar + percentage
- Hover: translateY(-2px) + shadow-lg
- مستوحى من AllModules cards في المرجع

---

## Step 10 — تحديث ModulesGrid.tsx (تبسيط + استخدام ModuleCard)
**المهارة**: Frontend + Backend (Refactoring / TypeScript)
**الملف**: `src/components/modules/ModulesGrid.tsx`
**التفاصيل**:
- إزالة inline card rendering (~200 سطر)
- استخدام `ModuleCard` الجديد لكل موديول
- الإبقاء على: `ModuleWithStats` type, `iconThemeMap`, `getModuleStyle()`, admin edit modal, "Show More" button
- إضافة `getAbbreviation()` function

---

## Step 11 — تحديث page.tsx (إعادة هيكلة الـ JSX بالكامل)
**المهارة**: Backend + Frontend (Server Component / Next.js)
**الملف**: `src/app/(student)/modules/page.tsx`
**التفاصيل**:
- الـ data fetching يبقى كما هو (session, modules, streak, stats, lastActivity, semesterInfo)
- الـ JSX return يتغير بالكامل إلى التقسيم الجديد:
  ```tsx
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-[1240px] px-6 py-6">
      <TopBar />
      <HeroSection ... />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div> ... Hero content ... </div>
        <StatsCard ... />
      </div>
      <QuickActions />
      <FilterPills onFilterChange={...} />
      <ContinueAndRecent featured={featured} recent={recent} />
      <AllModules modules={visibleModules} />
    </div>
  </div>
  ```

---

## Step 12 — تحديث loading.tsx + Skeletons
**المهارة**: Frontend (React / Tailwind)
**الملفات**:
- `src/app/(student)/modules/loading.tsx`
- `src/components/modules/ModulesGridSkeleton.tsx`
- `src/components/modules/ModulesMobileSkeleton.tsx`
**التفاصيل**: تحديث الـ skeleton layouts لتتناسب مع التقسيم الجديد

---

## Step 13 — مراجعة TypeScript + lint
**المهارة**: Backend + Frontend (TypeScript / CLI)
**التفاصيل**: تشغيل `npx tsc --noEmit` و `npx next lint` للتأكد من عدم وجود errors جديدة

---

## Step 14 — اختبار عام لكل الخطوات
**المهارة**: Backend + Frontend (Manual Review)
**التفاصيل**:
- مراجعة كل ملف متغير
- التأكد من عدم كسر أي functionality قديمة
- التأكد من dark mode
- التأكد من mobile responsive
- التأكد من admin edit modal
- التأكد من guest banner
- التأكد من empty state

---

## خريطة التنفيذ

```
Step 1  ── globals.css (shadow-card)
Step 2  ── TopBar.tsx
Step 3  ── HeroSection.tsx
Step 4  ── StatsCard.tsx
Step 5  ── QuickActions.tsx
Step 6  ── FilterPills.tsx
Step 7  ── FeaturedModuleCard.tsx
Step 8  ── RecentModuleCard.tsx
Step 9  ── ModuleCard.tsx
Step 10 ── ModulesGrid.tsx (update)
Step 11 ── page.tsx (rewrite JSX)
Step 12 ── loading.tsx + skeletons (update)
Step 13 ── TypeScript + lint check
Step 14 ── Final review
```
