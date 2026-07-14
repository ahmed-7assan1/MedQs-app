# Frontend Design System — Student Dashboard Redesign

**Version:** 1.0  
**Classification:** Internal Engineering Document  
**Scope:** Student Dashboard (`src/app/(student-clean)/dashboard-app/`) — visual redesign, component standards, data architecture  
**Target System:** MedOneX (medqs-app)  
**Infrastructure:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, framer-motion, SWR, Zustand

---

## 1. Overview

### 1.1 Objectives

1. **Consolidate visual inconsistencies** identified in the audit: 3 different card title sizes, 3 padding patterns, mixed button implementations, hardcoded colors that break dark mode.
2. **Design for 4 future features** as first-class dashboard sections: SpacedRepetitionCards, AIRecommendations, StudyTimer, StreakCelebration.
3. **Establish component-level standards** that every section must follow: error boundaries, loading states, empty states, responsive behavior.
4. **Fix the desktop view rendering bug** (desktop layout visible on mobile) without regressing when restructuring components.
5. **Document do-not-regress items** from the current codebase.

### 1.2 Non-Goals

- No backend logic changes, API route modifications, or data-fetching layer changes.
- No deletion of unused files — classification only, deletions are a separate reviewable step.
- No changes to the V2 dashboard (`/v2/student/dashboard`) — it is independent.

---

## 2. Component Inventory

### 2.1 Currently-Rendering Components (18 — after Phase B.2)

| Component | File | Data Source | Used In |
|---|---|---|---|
| DashboardShell | `DashboardShell.tsx` | `DashboardData` prop | page.tsx |
| DashboardMobileView | `DashboardMobileView.tsx` | `DashboardData` prop | DashboardShell |
| DashboardDesktopView | `DashboardDesktopView.tsx` | `DashboardData` prop + SWR observers | DashboardShell |
| MissionControlHero | `sections/MissionControlHero.tsx` | `DashboardData` prop | DesktopView + MobileView |
| LearningHeatmap | `sections/LearningHeatmap.tsx` | `DashboardData.activityArr` | MobileView (overview tab) |
| ContinueLearningSection | `sections/ContinueLearningSection.tsx` | `DashboardData.moduleProgress` | DesktopView |
| RecordsGrid | `sections/RecordsGrid.tsx` | SWR `/api/v1/records` (same `useRecords()` hook) | DesktopView |
| SuggestedVideosCarousel | `sections/SuggestedVideosCarousel.tsx` | SWR `/api/v1/videos/curriculum` | DesktopView |
| CommunityStrip | `sections/CommunityStrip.tsx` | SWR `/api/v1/community/posts` (same `useCommunityPosts()` hook) | DesktopView (sidebar) |
| ActiveRoomsSidebar | `sections/ActiveRoomsSidebar.tsx` | Raw fetch `/api/v1/sessions/active` | DesktopView (via SearchableSidebar) |
| LeaderboardSidebar | `sections/LeaderboardSidebar.tsx` | Raw fetch `/api/mobile/leaderboard` | DesktopView (via SearchableSidebar) |
| ContinueLectureCard | `sections/ContinueLectureCard.tsx` | `DashboardData.lastLecture` | DesktopView (via SearchableSidebar) |
| QuickAccessLinks | `sections/QuickAccessLinks.tsx` | Static | DesktopView (via SearchableSidebar) |
| DashboardFooter | `sections/DashboardFooter.tsx` | Static | DesktopView |
| SearchableSidebar | `sections/SearchableSidebar.tsx` | Internal search state | DesktopView (wrapper) |
| CarouselErrorBoundary | `CarouselErrorBoundary.tsx` | Error boundary | DesktopView (wraps 3 carousels) |
| SiteSectionsTrigger | `sections/SiteSectionsModal.tsx` | Static | DesktopView (via SearchableSidebar) |

### 2.2 Unused/Alternate Components (20 — after Phase B.2)

| Component | File | Classification | Notes |
|---|---|---|---|
| **Future Feature** | | | |
| SpacedRepetitionCards | `SpacedRepetitionCards.tsx` | Future Feature | 468-line flashcard reviewer; uses `text-indigo-500` (legacy color) |
| AIRecommendations | `sections/AIRecommendations.tsx` | Future Feature | 174-line suggestion generator from `DashboardData` |
| StudyTimer | `StudyTimer.tsx` | Future Feature | 147-line pomodoro with SVG ring, localStorage sessions |
| StreakCelebration | `StreakCelebration.tsx` | Future Feature | 73-line streak milestone card |
| **Archived (replaced by Phase B.2 — file kept on disk)** | | | | |
| RecordsCarousel | `sections/RecordsCarousel.tsx` | Archived | Superseded by RecordsGrid (same SWR hook, grid layout). Not imported/rendered; file preserved for Phase D review. |
| CommunityCarouselSidebar | `sections/CommunityCarouselSidebar.tsx` | Archived | Superseded by CommunityStrip (same SWR hook, compact sidebar layout). Not imported/rendered; file preserved for Phase D review. |
| **Abandoned Duplicate** | | | | |
| CommunityPostsCarousel | `CommunityPostsCarousel.tsx` | Abandoned Duplicate | Pre-consolidated-endpoint version; superseded by CommunityCarouselSidebar |
| MobileDashboardHero | `MobileDashboardHero.tsx` | Abandoned Duplicate | Superseded by MobileDashboardComponents |
| MobileDashboardComponents | `MobileDashboardComponents.tsx` | Abandoned Duplicate | Experiment; never rendered in any page |
| RedesignedComponents | `RedesignedComponents.tsx` | Abandoned Duplicate | Contains `AskDrQFeatured` — rescue-worthy; flag for EcosystemCards revival |
| DashboardTopBar | `DashboardTopBar.tsx` | Abandoned Duplicate | Pre-SearchableSidebar top bar |
| HomeTopBar | `HomeTopBar.tsx` | Abandoned Duplicate | Copied from TopBar; never customized |
| **Truly Dead Code** | | | |
| AchievementsShelf | `AchievementsShelf.tsx` | Truly Dead Code | Contains `STREAK_MILESTONES` constant — merge into StreakCelebration |
| BadgeProgressSheet | `BadgeProgressSheet.tsx` | Truly Dead Code | |
| DailyQuote | `DailyQuote.tsx` | Truly Dead Code | |
| DashboardDrQFab | `DashboardDrQFab.tsx` | Truly Dead Code | |
| EcosystemCards | `EcosystemCards.tsx` | Truly Dead Code | Possible revival target for AskDrQFeatured |
| ProfileCoverSection | `ProfileCoverSection.tsx` | Truly Dead Code | |
| ProfileSidebar | `ProfileSidebar.tsx` | Truly Dead Code | |
| QuickActionsHub | `QuickActionsHub.tsx` | Truly Dead Code | |

### 2.3 Rescue-Worthy Pieces from Dead Code

| Artifact | Source | Target |
|---|---|---|
| `AskDrQFeatured` component | `RedesignedComponents.tsx` | EcosystemCards revival (future) |
| `STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365]` | `shared/confetti.ts` (also in AchievementsShelf) | StreakCelebration milestone badge logic |

---

## 3. Data Flow Architecture

### 3.1 Pipeline

```
Prisma DB → fetchDashboardData() → DashboardPage (page.tsx) → DashboardShell → DashboardDesktopView / DashboardMobileView
                   ↓                                              ↓
            unstable_cache (60s)                    Client SWR hooks (30s dedup)
                   ↓                                              ↓
          Server types (dashboard-queries.ts)        /api/v1/records, /api/v1/videos/curriculum,
                                                           /api/v1/community/posts
```

### 3.2 Server → Client Type Mapping

| Server field (`dashboard-queries.ts`) | Client field (`@/types/dashboard.ts`) | Transformer in `page.tsx` |
|---|---|---|
| `user.name` | `firstName` | `.split(" ")[0]` |
| `user.image` | `userImage` | Google/Cloudinary URL optimization |
| `streak` | `currentStreak` | Direct passthrough |
| `weekCounts[]` | `activityArr[]` | Mapped via `chartDays` labels |
| `lastLectureActivity` | `lastLecture` | Flattened from nested lecture object |
| — | `greeting` | Computed from `new Date().getHours()` |
| — | `dailyTarget` | Hardcoded to `50` |
| — | `dailyPct` | Computed `todayItemCount / 50 * 100` |
| — | `overallPct` | Computed `totalCorrect / totalQuestions * 100` |
| — | `isProfileIncomplete` | Checked from `fullProfile` query |
| — | `ads` | Separate `getCachedAds` query (300s cache) |
| `quickPaper` | **NOT MAPPED** | Dead query — logged as P2-10 |
| `totalQuestions`, `totalCorrect` | `totalQuestions`, `overallPct` | Only `totalQuestions` is passed; `totalCorrect` consumed internally |

### 3.3 SWR Endpoints

| Hook | Endpoint | Type | Component |
|---|---|---|---|
| `useRecords` | `/api/v1/records?page=1&limit=6` | `PaginatedResponse<SuggestedRecord>` | RecordsGrid (was RecordsCarousel — data pipeline unchanged) |
| `useCurriculumVideos` | `/api/v1/videos/curriculum?page=1&limit=6` | `PaginatedResponse<SuggestedVideo>` | SuggestedVideosCarousel |
| `useCommunityPosts` | `/api/v1/community/posts?limit=6` | `PaginatedResponse<PostData>` | CommunityStrip (was CommunityCarouselSidebar — data pipeline unchanged) |

**⚠️ API shape uncertainty**: `DashboardDesktopView:30` applies `raw?.data ?? raw` unwrap — the actual API response shape needs verification against the real API routes.

### 3.4 Raw Fetch Components (No SWR)

| Component | Endpoint | Refresh | Error Handling |
|---|---|---|---|
| ActiveRoomsSidebar | `/api/v1/sessions/active` | On mount only | Silent catch → `/api/v1/rooms` fallback |
| LeaderboardSidebar | `/api/mobile/leaderboard?limit=3` | On mount only | Silent catch → empty |
| MissionControlHero (notifs) | `/api/v1/notifications` | On dialog open | Silent catch |

---

## 4. Visual Design System

### 4.1 Spacing (8pt Grid)

The codebase already follows an 8pt system via Tailwind spacing. Common patterns:

| Token | Value | Used For |
|---|---|---|
| `p-4` | 16px | Standard card padding |
| `p-4 md:p-6` | 16px → 24px | Responsive card padding (target standard) |
| `px-3 py-2.5` | 12px / 10px | Carousel card content — **non-standard, target `p-4`** |
| `gap-3` | 12px | Between carousel items |
| `gap-6 md:gap-8` | 24px → 32px | Sidebar section spacing |
| `space-y-8 md:space-y-10` | 32px → 40px | Desktop main section spacing (target standard) |
| `mt-7` | 28px | Between hero and grid in DesktopView |
| `mx-auto` with `maxWidth: 1360` | — | Desktop page width constraint |

**Target**: Standardize all card content padding to `p-4` (desktop `md:p-6` for primary sections, `md:p-5` for secondary).

### 4.2 Color System (CSS Variables)

All colors use `hsl(var(--variable))` via `globals.css` and `themes.css`. Hardcoded colors that violate this rule are flagged below.

| Variable | Light | Dark | Used For |
|---|---|---|---|
| `--background` | `0 0% 100%` | `240 15% 8%` | Page background |
| `--foreground` | `240 28% 14%` | `250 33% 95%` | Primary text |
| `--card` | `0 0% 100%` | `240 16% 12%` | Card surfaces |
| `--card-foreground` | `240 28% 14%` | `250 33% 95%` | Card text |
| `--primary` | `180 70% 32%` | — | Teal primary (Deep Teal #1A8A8A) |
| `--primary-foreground` | — | — | Text on primary |
| `--muted` | — | — | Muted backgrounds |
| `--muted-foreground` | — | — | Secondary text |
| `--border` | — | — | Borders |
| `--accent` | — | — | Accent backgrounds |

#### Hardcoded Colors Flagged for Cleanup

| Location | Hardcoded Value | Replace With |
|---|---|---|
| All dashboard section `<Card>` wrappers (10 instances across 8 files) | `dark:bg-[#14141B]` | Remove override — rely on `bg-card` |
| Play button overlays (Records, Videos, Community, ContinueLectureCard) | `bg-white/90` | `bg-background/90` |
| CommunityCarouselSidebar "Read more" button | `text-indigo-500` | `text-primary` or theme variable |
| CommunityCarouselSidebar file-type icons | `text-sky-500`, `text-red-500` | CSS variable or semantic mapping |
| LeaderboardSidebar glow shadows | `shadow-[0_0_12px_rgba(234,179,8,0.4)]` etc. | CSS variable with alpha |
| MissionControlHero notification badge glow | `shadow-[0_0_8px_rgba(239,68,68,0.4)]` | `ring-red-500/40` |

**Note**: Hardcoded accent colors for streaks (`text-orange-500`, `border-orange-500/30`, `bg-orange-500/5`) and XP (`text-amber-500`, `border-amber-500/30`) are accepted as intentional feature-specific colors that should not change with theme.

### 4.3 Typography

#### 4.3.1 Font Families

| Role | Font | Source |
|---|---|---|
| Sans (English) | Nunito | Google Fonts |
| Display/Arabic | Cairo | Google Fonts |
| Monospace/Decorative | Syne | Google Fonts |

#### 4.3.2 Type Scale

| Token | Size | Weight | Used For |
|---|---|---|---|
| `text-2xl md:text-3xl lg:text-4xl` | 24→30→36px | `font-bold` | Page title (MissionControlHero h1) |
| `text-xs` | 12px | `font-bold` | Card titles — **target standard** |
| `text-[11px]` | 11px | `font-black` | Primary card titles (MissionControlHero quiz cards) |
| `text-sm` | 14px | `font-bold` | ContinueLectureCard title — **OUTLIER: change to `text-xs font-bold`** |
| `text-[10px]` | 10px | `font-black` | SectionHeader titles (shared pattern) |
| `text-[9px]` | 9px | `font-medium/black` | Leaderboard names, QuickAccess labels, chart labels |
| `text-[8px]` | 8px | — | QuickAccess link labels — **consider bumping to `text-[9px]`** |

#### 4.3.3 SectionHeader Pattern (Shared)

```tsx
<SectionHeader icon={IconName} title="Section Title" />
```

Consistent across all 8 components that use SectionHeader. Renders:
- `text-[11px] font-black uppercase tracking-[0.2em]` title
- `rounded-lg` icon container
- Right slot for action buttons (carousel nav arrows, etc.)

**Keep this pattern. Do not restyle.**

### 4.4 Border-Radius

| Token | Value | Used For |
|---|---|---|
| `rounded-xl` (default) | 12px | Card containers, toolbar icon buttons |
| `rounded-lg` | 8px | Carousel nav buttons, SectionHeader icon, list items, tab buttons |
| `rounded-2xl` | 16px | **OUTLIERS**: MissionControlHero dialog icon, ContinueLearning empty-state button — should be `rounded-xl` |
| `rounded-full` | 50% | Avatars, status dots, progress bars, play button overlays |

**Target**: Unify toolbar/action-icon buttons to `rounded-lg` (nav arrows) or `rounded-xl` (action buttons). Eliminate `rounded-2xl` outliers.

### 4.5 Shadows

| Token | Used For |
|---|---|
| `shadow-sm` | Standard card state |
| `hover:shadow-md` | Interactive card hover |
| `shadow-lg shadow-primary/30` | Play button overlays (universal) |
| `shadow-2xl` | Fixed alert banner (DashboardShell) |

**Shadows are the most consistent dimension across all components. No changes needed.**

### 4.6 Icon Set

**100% `lucide-react`** across all components. One emoji placeholder (`💬`) in DashboardMobileView — acceptable for a fallback. **No changes needed.**

### 4.7 Button Variants

Current state: 3 implementation patterns coexist.

| Pattern | Where Used | Issue |
|---|---|---|
| `<Button variant="outline">` | Cancel/empty-state actions | ✅ Consistent |
| `<Button>` (default/primary) | "Start Quiz", "Continue" | ✅ Consistent |
| Custom `<button>` elements | Toolbar icons, carousel nav arrows, tab bar | ⚠️ Should use `Button` component with `variant="ghost"` or `variant="outline"` for uniformity |
| Raw `<Link>` styled as button | DashboardShell "Complete Now" button | ⚠️ Should use `Button asChild` |

**Target**: Standardize to `Button` component with appropriate variants. Use `Button asChild` for link-as-button patterns. Replace custom `<button>` nav arrows with `Button variant="outline" size="icon"`.

---

## 5. Component-Level Standards

### 5.1 Error Boundaries (Mandatory Rule)

**Every data-fetching component must have an error boundary.** If the boundary needs to be renamed/generalized from `CarouselErrorBoundary`, do so — it is no longer carousel-specific.

| Component | Has Error Boundary? | Status |
|---|---|---|
| RecordsCarousel | ✅ Via `CarouselErrorBoundary` | Compliant |
| SuggestedVideosCarousel | ✅ Via `CarouselErrorBoundary` | Compliant |
| CommunityCarouselSidebar | ✅ Via `CarouselErrorBoundary` | Compliant |
| MissionControlHero | ❌ None | Must add |
| ActiveRoomsSidebar | ❌ None | Must add |
| LeaderboardSidebar | ❌ None | Must add |
| ContinueLectureCard | ❌ None | Must add |

**⚠️ Known bug**: `CarouselErrorBoundary`'s `resetKey` uses `data.items?.length` — if length doesn't change after error recovery, the boundary stays stuck on the fallback forever. Logged as **P2-9** in the backend plan. Fix: change `resetKey` to a timestamp or incrementing counter.

### 5.2 Loading States

| Component | Has Loading State? | Status |
|---|---|---|
| RecordsCarousel | ✅ `CarouselSkeleton` | Compliant |
| SuggestedVideosCarousel | ✅ `CarouselSkeleton` | Compliant |
| CommunityCarouselSidebar | ✅ `CarouselSkeleton` | Compliant |
| ActiveRoomsSidebar | ✅ `loading` state (conditionally renders null) | Compliant (thin) |
| LeaderboardSidebar | ❌ Returns null if `users.length === 0` — **no loading state** | Missing |
| ContinueLectureCard | ❌ Returns null if `!lecture` — **no loading state** | Missing |

**Target**: LeaderboardSidebar and ContinueLectureCard should show skeleton/placeholder while data loads.

### 5.3 Empty States

| Component | Has Empty State? | Current Behavior |
|---|---|---|
| ContinueLearningSection | ✅ Shows "No active modules" with CTA button | Compliant |
| MissonControlHero (quiz cards) | ✅ Shows "No quizzes yet" | Compliant |
| RecordsCarousel | ❌ Returns `null` — **silent blank** | Must add empty state |
| SuggestedVideosCarousel | ❌ Returns `null` — **silent blank** | Must add empty state |
| CommunityCarouselSidebar | ❌ Returns `null` — **silent blank** | Must add empty state |
| ActiveRoomsSidebar | ✅ Shows null → "More" link | Compliant |
| LeaderboardSidebar | ❌ Returns `null` — **silent blank** | Must add empty state |
| ContinueLectureCard | ❌ Returns `null` — **silent blank** | Must add empty state |

**Target**: Every section that returns `null` when empty should render a visible empty-state placeholder (e.g., "No upcoming content" with an icon) to prevent layout gaps.

### 5.4 Responsive Behavior

#### 5.4.1 Mobile/Desktop Split

| View | Class | Mobile (375px) | Tablet (768px) | Desktop (1024px+) |
|---|---|---|---|---|
| MobileView | `md:hidden` | ✅ Visible | ❌ Hidden | ❌ Hidden |
| DesktopView | `hidden md:block` | ❌ Hidden | ✅ Visible | ✅ Visible |

**⚠️ Do not regress**: The `hidden md:block` on `DashboardDesktopView`'s root `<div>` must be preserved in any restructuring. The working-tree modifications (experimental, now deleted) had accidentally removed this.

#### 5.4.2 Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│  MissionControlHero (full width)                            │
├─────────────────────────────────────────────────────────────┤
│            ▬▬▬▬▬▬ YOUR PROGRESS ▬▬▬▬▬▬                      │
├──────────────────────────────────────┬──────────────────────┤
│  ContinueLearningSection (4-card     │  SearchableSidebar   │
│  grid, unchanged)                    │  ┌────────────────┐  │
│                                      │  │ ContinueLecture │  │
│  RecordsGrid (2-col grid,            │  ├────────────────┤  │
│  replaces carousel)                  │  │ ActiveRooms    │  │
│                                      │  ├────────────────┤  │
│                                      │  │ CommunityStrip │  │
│                                      │  │ (compact list) │  │
│                                      │  ├────────────────┤  │
│                                      │  │ Leaderboard    │  │
│                                      │  ├────────────────┤  │
│                                      │  │ QuickAccess    │  │
│                                      │  └────────────────┘  │
├──────────────────────────────────────┴──────────────────────┤
│            ▬▬▬▬▬▬▬▬ EXPLORE ▬▬▬▬▬▬▬▬                       │
├──────────────────────────────────────┬──────────────────────┤
│  AIRecommendations (wired in,        │                      │
│  no error boundary until Phase C)    │                      │
│                                      │                      │
│  SuggestedVideosCarousel             │                      │
│  (h-[260px] — visually distinct)     │                      │
│                                      │                      │
│  StudyTimer (wired in,               │                      │
│  no error boundary until Phase C)    │                      │
├──────────────────────────────────────┴──────────────────────┤
│  DashboardFooter                                             │
├─────────────────────────────────────────────────────────────┤
```

- Max width: `1360px` (via inline style `maxWidth: 1504px - 64px` with sidebar)
- Main column: `flex-1` (takes remaining space)
- Sidebar: `w-80` when open, `w-0` when closed (via `SearchableSidebar`)
- Sidebar toggle: `onToggleSidebar` prop on `MissionControlHero`
- Sidebar auto-opens on viewport >= 1280px

#### 5.4.3 Mobile Layout

Tab-based with 3 tabs:
- **Overview**: MissionControlHero + LearningHeatmap
- **Learn**: ContinueLearningSection
- **Social**: RecordsCarousel + SuggestedVideosCarousel + CommunityCarouselSidebar

Sticky tab bar at top with `position: sticky; top: 0; z-index: 10`.

### 5.5 Future Feature Design

#### 5.5.1 SpacedRepetitionCards (468 lines, file exists)

**Current state**: Fully implemented flashcard reviewer with swipe/flip/rate/save logic. Uses `text-indigo-500` (legacy color, not teal primary). Not rendered in any dashboard view.

**Design requirements**:
- Must become a dashboard section (not a separate page)
- Replace `text-indigo-500` with `text-primary` or teal CSS variable
- Add error boundary
- Add loading state (skeleton)
- Add empty state ("No flashcards due for review")
- Fit within the desktop 2-column layout or mobile tab structure

#### 5.5.2 AIRecommendations (174 lines, file exists)

**Current state**: Smart suggestion generator reading `DashboardData`. Not rendered.

**Design requirements**:
- Dashboard section to display AI-generated study recommendations
- Must consume `DashboardData` — ensure type compatibility
- Add error boundary
- Add loading state (skeleton)
- Add empty state ("Complete more quizzes for recommendations")

#### 5.5.3 StudyTimer (147 lines, file exists)

**Current state**: Pomodoro timer with SVG ring, localStorage session persistence. Not rendered.

**Design requirements**:
- Dashboard section with compact timer display
- SVG ring animation from current code
- localStorage session persistence (keep as-is)
- Add error boundary
- Consider mobile layout — compact enough to be always-visible

#### 5.5.4 StreakCelebration (73 lines, file exists)

**Current state**: Streak milestone card with progress bar. Not rendered.

**Design requirements**:
- Dashboard section showing next streak milestone + progress
- Merge `STREAK_MILESTONES` constant from `shared/confetti.ts` (also duplicated in `AchievementsShelf.tsx`)
- Milestones: `[3, 7, 14, 21, 30, 60, 90, 180, 365]`
- Add error boundary (minimal — depends on `DashboardData.currentStreak`)
- Position: near MissionControlHero (streak badge area)

---

## 6. Known Issues & Migration Notes

### 6.1 Do-Not-Regress Items

1. **`hidden md:block`** on `DashboardDesktopView` root — critical. Must survive component restructuring. Cannot be accidentally removed.
2. **SectionHeader pattern** — consistent across 8 components. Do not restyle.
3. **Shadow pattern** — `shadow-sm` on cards, `hover:shadow-md` on interactive. Consistent. Preserve.
4. **Lucide-react icon set** — 100% exclusive. No new icon libraries.
5. **`bg-card` + CSS variable color system** — all new components must use theme variables, not hardcoded colors.

### 6.2 Dead Code Preservation

The following files exist but are NOT rendered in any current page. **Do not delete during redesign.** Their status is classified above (Section 2.2). Deletion is a separate, reviewable step.

| File | Classification | Preserve Because |
|---|---|---|---|
| `SpacedRepetitionCards.tsx` | Future Feature | Contains full flashcard reviewer logic |
| `sections/AIRecommendations.tsx` | Future Feature | DashboardData-aware suggestions |
| `StudyTimer.tsx` | Future Feature | Pomodoro timer with localStorage |
| `StreakCelebration.tsx` | Future Feature | Streak milestone component |
| `sections/RecordsCarousel.tsx` | Archived (Phase B.2) | Superseded by RecordsGrid. File kept on disk — deletion is a separate Phase D review step. |
| `sections/CommunityCarouselSidebar.tsx` | Archived (Phase B.2) | Superseded by CommunityStrip. File kept on disk — deletion is a separate Phase D review step. |
| `RedesignedComponents.tsx` | Abandoned Duplicate | Contains `AskDrQFeatured` — rescue-worthy |
| `AchievementsShelf.tsx` | Truly Dead Code | Contains `STREAK_MILESTONES` — merge into StreakCelebration |
| Remainder (12 files) | Abandoned Duplicate / Truly Dead Code | Do not delete until explicitly reviewed |

### 6.3 Cache & Freshness

| Layer | TTL | Notes |
|---|---|---|
| Server data (`unstable_cache`) | 60s | Cache tag: `CACHE_TAGS.DASHBOARD` |
| Ads (`unstable_cache`) | 300s | Cache tag: `CACHE_TAGS.ADS` |
| SWR client dedup | 30s | `revalidateOnFocus: false`, 1 retry |
| Max staleness | 90s | Server cache (60s) + SWR dedup (30s) — acceptable, but document |

**4 future features** use `DashboardData` — they automatically benefit from the cache layer. No additional caching needed.

---

## 7. Execution Plan

### Phase A — Component Standards
1. Add error boundaries to MissionControlHero, ActiveRoomsSidebar, LeaderboardSidebar, ContinueLectureCard
2. Add loading states to LeaderboardSidebar, ContinueLectureCard
3. Add empty states to all components returning `null`
4. Fix `resetKey` bug (P2-9) — change to timestamp/counter

### Phase B — Visual Consistency (Original Scope)
1. Unify card title sizes (`text-xs font-bold` standard)
2. Unify card padding (`p-4` standard, `md:p-6` for primary sections)
3. Replace hardcoded colors: `bg-white/90` → `bg-background/90`, remove `dark:bg-[#14141B]` overrides
4. Standardize button patterns: replace custom `<button>` with `Button` component
5. Eliminate `rounded-2xl` outliers

### Phase B.2 — Hierarchy, Grouping & Layout Rhythm

**Goal**: Give the same personal dashboard content stronger visual hierarchy and rhythm — not a marketing page, but a polished "portal" feel.

**Three content groups**:
- **YOUR PROGRESS** (Hero, ContinueLearning, RecordsGrid) — large, prominent, personal
- **EXPLORE** (AIRecommendations, SuggestedVideos, StudyTimer) — varied shapes, discovery
- **Community** (in sidebar only, no visible label) — compact, social

**Steps**:
1. Create `GroupLabel` divider component (text + thin horizontal rule at `text-muted-foreground/30`, center-aligned, `tracking-[0.3em]`, `text-[10px]`, no icons)
2. Group sections under "YOUR PROGRESS": ContinueLearningSection + RecordsGrid
3. Group sections under "EXPLORE": AIRecommendations + SuggestedVideosCarousel + StudyTimer
4. Move Community section into sidebar as compact `CommunityStrip` (no group label)
5. Distinguish section shapes: Records as grid (not carousel), videos as shorter carousel (`h-[260px]` vs `h-[300px]`)
6. Fix ContinueLearningSection card width regression (`lg:w-[260px] < md:w-[280px]`) — switch to CSS grid
7. Update MobileView tabs to reflect new grouping

**Phase B.2.a (sub-phase — RecordsGrid)**:
- New component at `sections/RecordsGrid.tsx`
- Same `useRecords()` SWR hook and data pipeline — visual change only
- Replaces Embla `Carousel` + 3-item horizontal scroll with 2-column CSS `grid`
- Eliminates carousel boilerplate (nav arrows, auto-advance, reInit, opacity blur)
- Separate, reviewable increment per direction from Phase B oversight

**Phase B/C boundary**:
- Phase B.2 reserves visual placement for StudyTimer and AIRecommendations in their existing form (minimal/inactive)
- Full activation (error boundaries, loading/empty states, interactivity, 3-card recommendations, responsive SVG sizing) remains in Phase C as originally planned

**⚠️ Accepted temporary risk — AIRecommendations and StudyTimer render without error boundaries during Phase B.2**:
This is an accepted temporary risk, justified because: (a) AIRecommendations only consumes already-fetched DashboardData with no additional network calls, (b) StudyTimer only uses localStorage with no network dependency. Neither component can fail due to a data-fetch error. If either throws for an unrelated reason (e.g., a rendering bug), it could affect the surrounding page until Phase C adds proper error boundaries. This is documented and accepted, not overlooked.

**Deep-link confirmation**: `/social?post=${post.id}` is verified as a supported route. `OneXCommunity.tsx:1967` uses `useSearchParams().get("post")` to deep-link to a specific post. No additional backend work needed.

**🔁 Standard pattern: parent observer + child consumer for CarouselErrorBoundary resetKey**:

Components that use SWR hooks inside `CarouselErrorBoundary` follow this pattern to avoid the P2-9 "stuck in error state" bug:

```
DashboardDesktopView (parent)
├── useRecords() ────────────────→ revalidationKeys.records (observer only)
├── useCommunityPosts() ─────────→ revalidationKeys.community (observer only)
├── useCurriculumVideos() ───────→ revalidationKeys.videos (observer only)
│
├── CarouselErrorBoundary resetKey={revalidationKeys.records}
│   └── RecordsGrid
│       └── useRecords() ←── SWR dedup → same key as parent
│
├── CarouselErrorBoundary resetKey={revalidationKeys.videos}
│   └── SuggestedVideosCarousel
│       └── useCurriculumVideos() ←── SWR dedup → same key as parent
│
└── CarouselErrorBoundary resetKey={revalidationKeys.community}
    └── CommunityStrip
        └── useCommunityPosts() ←── SWR dedup → same key as parent
```

**Why the duplication exists**: The parent's `useEffect(() => { key++; }, [data])` runs after data changes. When SWR retries and succeeds after an error, the parent increments the key, which triggers `CarouselErrorBoundary.componentDidUpdate` to clear the error state. The child's same-key SWR call is deduplicated by SWR — only one actual network request occurs despite two hook call sites. **Do not "clean up" by removing the parent observer or by moving the SWR call only to the child** — this would reintroduce P2-9. This is the proven pattern used by Records (RecordsGrid), Community (CommunityStrip), and Videos (SuggestedVideosCarousel).

### Phase C — Future Features
1. Integrate StreakCelebration near MissionControlHero streak area
2. Integrate StudyTimer as dashboard section
3. Integrate AIRecommendations as dashboard section
4. Integrate SpacedRepetitionCards as dashboard section
5. Merge `STREAK_MILESTONES` from AchievementsShelf into StreakCelebration
6. Flag `AskDrQFeatured` for EcosystemCards revival (deferred)

### Phase D — Cleanup
1. Delete abandoned duplicate files (after review)
2. Delete truly dead code files (after review)
3. Remove dead `quickPaper` query (P2-10 — backend-adjacent, may be done during Phase D or as a separate backend hotfix)

---

## 8. References

- **Dashboard page**: `src/app/(student-clean)/dashboard-app/page.tsx`
- **Component tree root**: `src/components/dashboard/DashboardShell.tsx`
- **Desktop layout**: `src/components/dashboard/DashboardDesktopView.tsx`
- **Mobile layout**: `src/components/dashboard/DashboardMobileView.tsx`
- **Dashboard data types**: `src/types/dashboard.ts`
- **Server query types**: `src/lib/dashboard-queries.ts`
- **SWR hooks**: `src/lib/dashboard-fetch.ts`
- **Cache constants**: `src/lib/cache-tags.ts`
- **Theme/CSS**: `src/styles/globals.css`, `src/styles/themes.css`, `tailwind.config.ts`
- **Shared animations**: `src/components/dashboard/shared/animations.ts`
- **Shared badges**: `src/components/dashboard/shared/badges.ts`
- **Backend findings**: `docs/dashboard-backend-remediation-plan.md` (P2-9, P2-10)

---

## Section 9 — Deep Component Audit

### 9.1 Per-Component Defect Table

#### 9.1.1 Layout & Shell Components

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| DashboardShell | `DashboardShell.tsx:17` | Suspected | Alert banner `fixed top-0 left-0 right-0 z-50`. If a sticky navbar at `z-navbar: 300` exists above dashboard-app route, the alert (also z-50) could overlap or conflict. | Medium | Suspected-needs-verification | Change to `sticky top-0` or verify no sticky navbar exists on this route |
| DashboardDesktopView | `DashboardDesktopView.tsx:50` | Spacing | `pt-24 lg:pt-28` = 96–112px top padding. Very large — clears ~88px for a fixed/tall navbar. If actual visible navbar is shorter or absent, wastes 40+px. | Medium | Confirmed | Reduce to `pt-16 lg:pt-20`. **NEEDS MANUAL VERIFICATION** of actual navbar height at this route |
| DashboardDesktopView | `DashboardDesktopView.tsx:49` | Layout | `pl-4 sm:pl-8 lg:pl-12` on flex container but `pr-6 xl:pr-8` on main content div — asymmetric gutters. `pr-6` creates a gap between carousel edge and sidebar, especially at 1024px. | Low | Confirmed | Move `pr-6 xl:pr-8` to flex container or use `gap` for symmetry |
| DashboardDesktopView | `DashboardDesktopView.tsx:33-38` | Suspected | `useEffect` auto-opens sidebar for `min-width: 1280px` via `matchMedia`. SSR hydration may show closed sidebar briefly before client JS runs. | Low | Suspected-needs-verification | Use `useSyncExternalStore` or add `mounted` guard to suppress flash |
| DashboardDesktopView | `DashboardDesktopView.tsx:30` | Suspected | `communityData = (_communityData as any)?.data ?? _communityData` — fragile unwrap. If API returns `{ data: null }` vs `{ data: [] }`, behavior differs. | Medium | Suspected-needs-verification | Standardize unwrap at SWR hook level, not per-consumer |
| DashboardMobileView | `DashboardMobileView.tsx:25` | Layout | Tab bar `sticky top-0 z-10` inside `md:hidden`. No offset for the possible fixed alert banner (z-50) from DashboardShell. If both visible, banner overlaps tab bar. | Medium | Confirmed | Set `top` dynamically or match alert banner height |
| DashboardMobileView | `DashboardMobileView.tsx:23` | Spacing | Parent `pt-4` but no account for mobile navbar offset at top. | Low | Suspected-needs-verification | Add `pt-[var(--mobile-header-offset)]` if mobile header is fixed |

#### 9.1.2 MissionControlHero

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| MissionControlHero | `MissionControlHero.tsx:129-191` | Touch | All 7 toolbar buttons `h-9 w-9` (36×36px) — below 44×44px minimum. At 375px, 7 buttons + streak + XP badge do not fit in one row. | Critical | Confirmed | Increase to `min-h-11 min-w-11` (44px). Wrap buttons to second row or overflow menu below `sm:`. Combine theme+fullscreen into settings dropdown. |
| MissionControlHero | `MissionControlHero.tsx:67` | Responsive | Avatar `h-16 w-16 md:h-20 md:w-20` (64→80px) responsive. Title `text-2xl md:text-3xl lg:text-4xl`. But toolbar buttons are static size across all breakpoints. | High | Confirmed | Wrap toolbar into second row or use collapsible menu below `sm:` |
| MissionControlHero | `MissionControlHero.tsx:120,124` | Typography | "day streak" and "XP" labels at `text-[9px]` — below 10px threshold for informational text. | Medium | Confirmed | Bump to `text-[10px]` |
| MissionControlHero | `MissionControlHero.tsx:213` | Typography | Quiz card module name at `text-[8px]` — informational, below legibility threshold. | High | Confirmed | Bump to `text-[9px]` minimum, ideally `text-[10px]` |
| MissionControlHero | `MissionControlHero.tsx:135` | Color | Notification badge glow `shadow-[0_0_8px_rgba(239,68,68,0.4)]` — hardcoded red. Already flagged in Section 4.2. | Medium | Confirmed | Replace with `shadow-destructive/40` or CSS variable |
| MissionControlHero | `MissionControlHero.tsx:51-58` | Suspected | Notification fetch only runs when dialog opens and `notifications.length === 0`. Silent catch — no error state, no retry. | Medium | Suspected-needs-verification | Add error state in dialog; use SWR for caching |
| MissionControlHero | `MissionControlHero.tsx:67-76` | Performance | 4+ framer-motion instances (SVG ring + progress bar ×2 + stacked cards) animate simultaneously at mount. May cause jank on low-end devices. | Low | Suspected-needs-verification | Profile on 4x CPU slowdown; add `useReducedMotion` guard |
| MissionControlHero | N/A | Standards | No error boundary (per Section 5.1). | High | Confirmed | Wrap with ErrorBoundary |

#### 9.1.3 ContinueLearningSection + LearningHeatmap

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| ContinueLearningSection | `ContinueLearningSection.tsx:70` | Responsive | Card widths change per breakpoint: `w-[220px] md:w-[280px] lg:w-[260px]`. Desktop cards (260px) are narrower than tablet (280px) — likely unintended. | Medium | Confirmed | Use consistent card width, adjust grid column count instead |
| ContinueLearningSection | `ContinueLearningSection.tsx:70` | Performance | 4× `motion.div` + 4× inner progress `motion.div` = 8 framer-motion instances at mount. All have `will-change-transform`. | Low | Suspected-needs-verification | Profile on low-end device; avoid `will-change-transform` on all cards simultaneously |
| ContinueLearningSection | `ContinueLearningSection.tsx:52` | Layout | SectionHeader `[&>div:last-child]:hidden` deep child selector to hide separator. Fragile if SectionHeader internals change. | Low | Confirmed | Add `hideSeparator` prop to SectionHeader |
| ContinueLearningSection | `ContinueLearningSection.tsx:56` | Layout | `flex flex-wrap justify-center` — on 1440px+ with <4 modules, centering leaves large side gaps. | Low | Confirmed | Use CSS grid with explicit column breakpoints |
| ContinueLearningSection | `ContinueLearningSection.tsx:109` | Typography | "Module" label and time estimate at `text-[9px]`. Clock icon `h-2.5 w-2.5`. | Low | Confirmed | Bump to `text-[10px]`, icon to `h-3 w-3` |
| LearningHeatmap | `LearningHeatmap.tsx:48` | Spacing | Card `p-4 md:p-5` — follows responsive padding pattern. | — | — | No change needed |
| LearningHeatmap | `LearningHeatmap.tsx:72-78` | Performance | 7× `motion.div` bars with staggered delays. Lightweight but 7 framer instances for simple height animation. | Low | Suspected-needs-verification | Could replace with CSS transitions |

#### 9.1.4 Sidebar Components

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| SearchableSidebar | `SearchableSidebar.tsx:81` | Touch | Search input `h-9` (36px) — below 44px minimum. | High | Confirmed | Increase to `min-h-11` |
| SearchableSidebar | `SearchableSidebar.tsx:84,94` | Touch | Close button ~28px, search toggle `h-9 w-9` (36px) — below 44px. | High | Confirmed | Increase to `min-h-11 min-w-11` |
| SearchableSidebar | `SearchableSidebar.tsx:63-66` | Color | Section colors `text-blue-500`, `text-amber-500`, `text-emerald-500`, `text-purple-500` — hardcoded categorical colors. | Medium | Confirmed | Replace with semantic variable or category tokens |
| ActiveRoomsSidebar | `ActiveRoomsSidebar.tsx:36-39` | Color | Status dots `bg-yellow-400`, `bg-green-400`, `bg-amber-400` — hardcoded status indicator colors. | Low | Confirmed | Accept as status convention, but consider CSS variable mapping |
| LeaderboardSidebar | `LeaderboardSidebar.tsx:48-51` | Color | Rank rings `ring-yellow-500`, `ring-amber-600/60`, `ring-gray-300` with hardcoded shadows — 3 combinations. | Medium | Confirmed | Replace with token-based rank styling |
| LeaderboardSidebar | `LeaderboardSidebar.tsx:76-86` | Typography | User name `text-[9px]`, rank `text-[8px]` — both below legibility threshold. | High | Confirmed | Name: `text-[10px]` minimum, rank: `text-[10px]` |
| LeaderboardSidebar | `LeaderboardSidebar.tsx:28-46` | Standards | Empty state exists. Loading state missing — returns null while fetching. | High | Confirmed | Add skeleton loading state |
| ContinueLectureCard | `ContinueLectureCard.tsx:89` | Typography | Avatar fallback `text-[7px]` — critically small. | Medium | Confirmed | Increase to `text-[9px]` minimum |
| ContinueLectureCard | `ContinueLectureCard.tsx:99-103` | Touch | "Continue" button `h-8` (32px) — below 44px minimum. | High | Confirmed | Increase to `min-h-11` |
| ContinueLectureCard | `ContinueLectureCard.tsx:24-36` | Standards | Empty state exists. Loading state missing — returns empty while data loads. | High | Confirmed | Add skeleton loading state |
| QuickAccessLinks | `QuickAccessLinks.tsx:38` | Touch | Icon container `w-8 h-8` (32×32px) — interactive via parent `<Link>`. Visual affordance is very weak. | Medium | Confirmed | Increase icon container to `w-9 h-9` (36px) or `w-10 h-10` (40px) |
| QuickAccessLinks | `QuickAccessLinks.tsx:41` | Typography | Link labels `text-[8px]` — **smallest text in the entire dashboard**. Critically below legibility. | Critical | Confirmed | Increase to `text-[9px]` minimum, ideally `text-[10px]` |
| SiteSectionsTrigger | `SiteSectionsModal.tsx:153` | Touch | Trigger button `h-9 w-9` (36×36px) — below 44px minimum. | High | Confirmed | Increase to `h-11 w-11` |

#### 9.1.5 Carousel Components

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| RecordsCarousel nav arrows | `RecordsCarousel.tsx:149-154` | Touch | Prev/Next arrow buttons `h-7 w-7` (28×28px) — far below 44px minimum. | Critical | Confirmed | Increase to `h-9 w-9` (36px) minimum, ideally `h-11 w-11` |
| SuggestedVideosCarousel nav arrows | `SuggestedVideosCarousel.tsx:184-189` | Touch | Same 28×28px nav arrows. | Critical | Confirmed | Same fix |
| CommunityCarouselSidebar nav arrows | `CommunityCarouselSidebar.tsx:326-331` | Touch | Same 28×28px nav arrows. | Critical | Confirmed | Same fix |
| RecordsCarousel | `RecordsCarousel.tsx:23` | Layout | Card `h-[300px]` fixed height — content may be clipped on overflow. | Medium | Confirmed | Use `min-h-[300px]` with `overflow-y-auto` |
| SuggestedVideosCarousel | `SuggestedVideosCarousel.tsx:47` | Layout | Same `h-[300px]` fixed height issue. | Medium | Confirmed | Same fix |
| CommunityCarouselSidebar | `CommunityCarouselSidebar.tsx:186` | Layout | Same `h-[300px]` fixed height issue. | Medium | Confirmed | Same fix |
| RecordsCarousel | `RecordsCarousel.tsx:45,54` | Spacing/Typography | `px-3 py-2.5` non-standard padding; avatar fallback `text-[6px]` — unreadable. | High | Confirmed | Padding: `p-4`. Fallback: `text-[9px]` minimum |
| SuggestedVideosCarousel | `SuggestedVideosCarousel.tsx:75,87` | Spacing/Typography | Same `px-3 py-2.5` and `text-[6px]` avatar fallback. | High | Confirmed | Same fixes |
| CommunityCarouselSidebar | `CommunityCarouselSidebar.tsx:99-103,228` | Color | File icons `text-sky-500`/`text-red-500`, "Read more" `text-indigo-500`, play overlay `bg-white/90`. Already flagged in Section 4.2. | Medium | Confirmed | Replace with CSS variables / `bg-background/90` |
| CarouselErrorBoundary | `CarouselErrorBoundary.tsx:30` | Suspected | `resetKey` uses `data.items?.length` — stuck on error if length unchanged. Logged as P2-9. | Medium | Confirmed | Change `resetKey` to timestamp or incrementing counter |
| All 3 carousels | Each: interval `useEffect` | Suspected | Auto-advance 30s — no pause on hover/focus. Could disorient reading users. | Low | Suspected-needs-verification | Pause on `mouseenter`/`focusin` |
| All 3 carousels | Each: `reInit` `useEffect` | Suspected | `api.reInit()` with 500ms timeout on sidebar toggle. Rapid toggling could stack timers. | Low | Suspected-needs-verification | Debounce or cancel previous timer |

#### 9.1.6 Future Feature Components

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| StudyTimer | `StudyTimer.tsx:105` | Responsive | SVG ring `width="80" height="80"` hardcoded — not responsive to container or breakpoint. | Medium | Confirmed | Make SVG size responsive via `w-20 md:w-24` or container percentage |
| StudyTimer | `StudyTimer.tsx:129` | Color | Pause button `bg-amber-500 text-white` — should use `bg-warning text-warning-foreground`. | Medium | Confirmed | Replace with semantic color variables |
| StudyTimer | `StudyTimer.tsx:125` | Color | Start button `bg-primary text-white` — should use `text-primary-foreground`. | Low | Confirmed | Replace with `text-primary-foreground` |
| StudyTimer | `StudyTimer.tsx:140` | Typography | Session count at `text-[9px]` — below 10px. | Low | Confirmed | Bump to `text-[10px]` |
| StudyTimer | `StudyTimer.tsx:59-63` | Suspected | Timer interval uses `sessions` via closure dependency. Line 62: `saveSessions(sessions + 1)` may read stale `sessions` if interval fires after state changes. | Medium | Suspected-needs-verification | Use functional setState or ref for `sessions` inside interval |
| StudyTimer | N/A | Standards | No error boundary. | Medium | Confirmed | Add ErrorBoundary wrapper |
| StreakCelebration | `StreakCelebration.tsx:34-36` | Color | Streak tier colors `text-amber-500`, `text-orange-500`, `text-rose-500` — intentional feature-specific. | Low | Confirmed | Accept as intentional exception |
| StreakCelebration | `StreakCelebration.tsx:23-28` | Suspected | `useEffect` on `currentStreak` — rapid changes could trigger multiple `saveMilestones` calls. | Low | Suspected-needs-verification | Add debounce guard |
| AIRecommendations | `AIRecommendations.tsx:156` | Touch | Action button `h-7` (28px) — very small touch target. | High | Confirmed | Increase to `min-h-9`, ideally `min-h-11` |
| AIRecommendations | `AIRecommendations.tsx:29-100` | Color | Per-recommendation hardcoded accents (orange, rose, emerald, violet, blue) — intentional categorical variety. | Low | Confirmed | Accept as intentional exception |
| SpacedRepetitionCards | (across file) | Color | Uses `text-indigo-500` — already flagged. | Medium | Confirmed | Replace with `text-primary` |
| SpacedRepetitionCards | N/A | Standards | No error boundary, loading state, or empty state for flashcard scenarios. | High | Confirmed | Add all three per Section 5 standards |

#### 9.1.7 Dead/Unused Components

| Component | File:Line | Category | Finding | Severity | Confidence | Suggested Fix |
|---|---|---|---|---|---|---|
| HomeTopBar | `HomeTopBar.tsx:267` | Layout | Spacer `h-[260px]` tied to scroll state — fragile if collapsible header content changes. File is Abandoned Duplicate (Section 2.2). | Medium | Confirmed (dead code) | Flag for deletion in Phase D |
| HomeTopBar | `HomeTopBar.tsx:229-232` | Suspected | `max-h-[300px]` transition — unprefixed `origin-top` without `overflow-hidden` in parent can cause animation jank. | Low | Confirmed (dead code) | Flag for deletion |
| DashboardTopBar | `DashboardTopBar.tsx:33` | Performance | `backdrop-blur-xl` + `shadow-[0_8px_30px_rgba(0,0,0,0.12)]` — heavy. | Medium | Confirmed (dead code) | Flag for deletion |
| BadgeProgressSheet | `BadgeProgressSheet.tsx:15-23` | Color | 8 per-badge hardcoded border styles — intentional badge system variety. | Low | Confirmed | Accept as intentional exception |
| BadgeProgressSheet | `BadgeProgressSheet.tsx:25-77` | Performance | 8 custom `@keyframes` animations via `<style jsx global>` — all run perpetually with `will-change: transform` when sheet is open. | Low | Suspected-needs-verification | Profile with sheet open on low-end device |
| MobileDashboardHero | `MobileDashboardHero.tsx:66` | Typography | Badge label `text-[7px]` — extremely small. | High | Confirmed (dead code) | Flag — increase if revived |
| MobileDashboardHero | `MobileDashboardHero.tsx:13-17` | Performance | `AnimatedFlame` uses 3 overlapped animated elements — heavy for decorative element. | Low | Confirmed (dead code) | Accept; file is abandoned duplicate |
| MobileDashboardComponents | (various) | Typography | `text-[8px]` in `MobileCompactQuickAccess` labels and `MobileQuickCard` labels — below legibility. | High | Confirmed (dead code) | Flag for deletion |

---

### 9.2 Responsive Behavior Per Component

#### 9.2.1 Desktop View (1024px+)

| Component | 375px (Mobile) | 768px (Tablet) | 1024px (Small Desktop) | 1440px+ (Large Desktop) | Assessment |
|---|---|---|---|---|---|
| **DashboardShell** | Renders MobileView, hidden DesktopView. Alert banner `fixed top-0` full width. | Same as mobile. | Same. Alert persists. | Same. | Alert has no breakpoint classes — works across all widths. No issue. |
| **DashboardDesktopView** | `hidden` (not rendered) | `md:block` — renders. Main column only. Sidebar wrapper `hidden lg:flex` — sidebar hidden at 768px. Padding `pl-8`. | Sidebar becomes `flex` at 1024px. Main column `pl-12`. Content `pr-6`. | Sidebar auto-opens at 1280px. Content `pr-8`. | At 768px, sidebar hidden but main column still reserves `pr-6` — wasted space. Should be `pr-0 lg:pr-6`. |
| **DashboardMobileView** | `md:hidden` — visible. Tab bar `sticky top-0`. Content `px-4 pb-4`. | Still visible until 768px. No tablet-specific adjustments. | Hidden. | Hidden. | No tablet-specific handling between 375-768px. Acceptable. |

#### 9.2.2 Shared Components (Both Views)

| Component | 375px | 768px | 1024px | 1440px+ | Assessment |
|---|---|---|---|---|---|
| **MissionControlHero** | Avatar 64px. Title 24px. Toolbar: 7 buttons × 36px + badges. At 375px, toolbar alone ~300px — likely wraps. | Avatar 80px. Title 30px. Same toolbar. | Avatar 80px (no lg: increase). Title 36px. | Same as 1024px. | Avatar ring stops scaling at `md:`. At 1440px, 80px avatar looks proportionally small. Toolbar never adapts — **critical breakpoint violation at 375px**. |
| **ContinueLearningSection** | Cards 220px wide, centered. ~1 visible. | Cards 280px wide — widest!. ~2 visible. | Cards 260px wide — narrower than tablet. ~3 visible. | Same. 4 cards max. | **Unintended**: `lg:w-[260px] < md:w-[280px]`. Desktop cards should be same width or wider. |
| **LearningHeatmap** | Full width, flexible bars. | Same (mobile view only up to 768px). | Not rendered. | Not rendered. | Properly scoped to mobile view. |

#### 9.2.3 Desktop-Only Components (Sidebar, renders 1024px+)

| Component | 1024px | 1440px+ | Assessment |
|---|---|---|---|
| **SearchableSidebar** | Renders inside sidebar when open. | Same. | At 1024px, sidebar is `w-80` (320px). Search input fits. **Correction from earlier**: sidebar wrapper is `hidden lg:flex` — it does NOT render at 768px. At 768px the user gets the full-width main column only. This is correct. |
| **ActiveRoomsSidebar** | Renders in sidebar. | Same. | Correct — sidebar-only |
| **LeaderboardSidebar** | Renders in sidebar. 3 users in flex row. | Same. | Correct — sidebar-only |
| **ContinueLectureCard** | Renders in sidebar. Thumbnail responsive. | Same. | Correct — sidebar-only |
| **QuickAccessLinks** | `grid-cols-4` in 320px sidebar = ~80px/cell. | Same. | Dense but functional. No breakpoint needed. |
| **DashboardFooter** | `flex-col`. Link groups `grid-cols-2 md:grid-cols-4`. | `lg:flex-row`. | Has responsive handling. `md:grid-cols-4` works at 768px but footer doesn't render there. Minor — no harm. |

#### 9.2.4 Carousel Components

| Component | 768px (no sidebar) | 1024px (sidebar open) | 1440px+ (sidebar open) | Assessment |
|---|---|---|---|---|
| **RecordsCarousel** | `basis-1/3` — ~3 items visible in ~700px main column. | `lg:basis-[300px]` — 2 items in ~600px column. Drop from 3→2. | Same — ~2 items in ~700px. | At 1024px, sidebar open reduces column enough that carousel drops from 3 to 2 visible items. The `basis-[300px]` at `lg:` likely intended minimum card width. Acceptable. |
| **SuggestedVideosCarousel** | Same as RecordsCarousel. | Same | Same | Same assessment |
| **CommunityCarouselSidebar** | Same. Post card `h-[300px]` fixed — overflow risk at narrower widths. | Same | Same | Content overflow risk increases at 1024px with sidebar open. |

---

### 9.3 Full Color Audit

#### 9.3.1 Hardcoded Colors to Replace

| File | Location | Value | Verdict | Reasoning |
|---|---|---|---|---|
| `MissionControlHero.tsx` | Line 135 | `shadow-[0_0_8px_rgba(239,68,68,0.4)]` | **Replace** with `shadow-destructive/40` | Notification badge glow — should be theme-aware |
| `CommunityCarouselSidebar.tsx` | Lines 99-103 | `text-sky-500`, `text-red-500` | **Replace** with CSS variable | File-type icon colors should respect theme |
| `CommunityCarouselSidebar.tsx` | Line 228 | `text-indigo-500` | **Replace** with `text-primary` or theme variable | Already flagged in Section 4.2 |
| `CommunityCarouselSidebar.tsx` | Lines 69, 141 | `bg-white/90` | **Replace** with `bg-background/90` | Already flagged in Section 4.2 |
| `RecordsCarousel.tsx` | Line 39 | `bg-white/90` | **Replace** with `bg-background/90` | Play overlay — theme-aware |
| `SuggestedVideosCarousel.tsx` | Line 69 | `bg-white/90` | **Replace** with `bg-background/90` | Play overlay — theme-aware |
| `ContinueLectureCard.tsx` | Line 69 | `bg-primary/90` | **Replace** with `bg-primary` | Opacity on primary may look wrong in dark mode |
| `LeaderboardSidebar.tsx` | Lines 48-51 | 3 hardcoded shadow glows | **Replace** with CSS variable with alpha | Glow shadows should adapt to theme |
| `LeaderboardSidebar.tsx` | Lines 49-50 | `ring-yellow-500`, `ring-amber-600/60`, `ring-gray-300` | **Replace** with rank token system | Rank colors need semantic mapping |
| `StudyTimer.tsx` | Line 129 | `bg-amber-500 text-white` | **Replace** with `bg-warning text-warning-foreground` | Use semantic color variables |
| `StudyTimer.tsx` | Line 125 | `text-white` | **Replace** with `text-primary-foreground` | Use theme text variable |
| `SearchableSidebar.tsx` | Lines 63-66 | `text-blue-500`, `text-amber-500`, `text-emerald-500`, `text-purple-500` | **Replace** with category tokens | Search result categories need semantic mapping |

#### 9.3.2 Hardcoded Colors — Keep as Intentional Exceptions

| File | Location | Values | Verdict | Reasoning |
|---|---|---|---|---|
| `BadgeProgressSheet.tsx` | Lines 15-23 | Per-badge pairs (rose, pink, amber, violet, emerald, sky, slate borders + gradients) | **KEEP** | Badge system requires distinct visual identity per achievement |
| `ContinueLearningSection.tsx` | Lines 13-24 | `from-emerald-500/30`, `border-emerald-500/30`, etc. (4 variations) | **KEEP** | Decorative gradients for card variety |
| `StreakCelebration.tsx` | Lines 34-36 | `text-amber-500`, `text-orange-500`, `text-rose-500` | **KEEP** | Streak tier colors are feature-specific semantics |
| `AIRecommendations.tsx` | Lines 29-100 | `text-orange-500`, `text-rose-500`, `text-emerald-500`, `text-violet-500`, `text-blue-500` | **KEEP** | Each recommendation type has distinct semantic color for scanning |
| `EcosystemCards.tsx` | Lines 12-55 | `from-amber-500/20`, `from-blue-500/20`, etc. (5 variations) | **KEEP** | Ecosystem feature cards benefit from color distinction |
| `SiteSectionsModal.tsx` | Lines 45-81 | 12+ named Tailwind colors (sky, blue, emerald, amber, rose, indigo, violet, cyan, purple, orange) | **KEEP** | Navigation picker requires categorical variety for scanability |
| `ActiveRoomsSidebar.tsx` | Lines 36-39 | `bg-yellow-400`, `bg-green-400`, `bg-amber-400` | **KEEP** (consider variable mapping) | Status indicator convention |

#### 9.3.3 Color System Gap

| Gap | Description | Severity |
|---|---|---|
| `text-primary-foreground` underused | StudyTimer start button uses `text-white` instead of `text-primary-foreground` | Low |
| No semantic rank-color tokens | Leaderboard positions use hardcoded ring colors — should map to `--rank-1`, `--rank-2`, `--rank-3` CSS variables | Medium |
| No category-color tokens for search | Search result categories use hardcoded blue/amber/emerald/purple — should map to semantic variables | Medium |

---

### 9.4 Quick Wins vs Deep Fixes

#### 9.4.1 Quick Wins (Low Effort, High Impact)

| # | Fix | Files | Effort | Impact |
|---|---|---|---|---|
| 1 | Bump `text-[8px]` QuickAccess labels to `text-[9px]/[10px]` | `QuickAccessLinks.tsx:41` | 1 line | Critical |
| 2 | Bump carousel avatar fallback `text-[6px]` → `text-[9px]` | `RecordsCarousel.tsx:54`, `SuggestedVideosCarousel.tsx:87` | 2 lines | High |
| 3 | Bump Leaderboard rank `text-[8px]` → `text-[10px]`, name `text-[9px]` → `text-[10px]` | `LeaderboardSidebar.tsx:76,80-84` | 3 lines | High |
| 4 | Replace `bg-white/90` → `bg-background/90` in all play overlays | 4 files | 4 lines | Medium |
| 5 | Replace `text-white` → `text-primary-foreground` in StudyTimer | `StudyTimer.tsx:125` | 1 line | Low |
| 6 | Replace `bg-amber-500` → `bg-warning` in StudyTimer pause | `StudyTimer.tsx:129` | 1 line | Low |
| 7 | Replace notification glow `shadow-[... rgba(239,68,68)]` | `MissionControlHero.tsx:135` | 1 line | Low |
| 8 | Bump `rounded-2xl` → `rounded-xl` on empty-state CTAs | 3 files | 3 lines | Low |
| 9 | Fix `lg:w-[260px] < md:w-[280px]` in ContinueLearningSection | `ContinueLearningSection.tsx:70` | 1 line | Medium |
| 10 | Bump `text-[7px]` avatar fallback → `text-[9px]` | `ContinueLectureCard.tsx:89` | 1 line | Medium |

#### 9.4.2 Medium Fixes (Moderate Effort)

| # | Fix | Files | Effort | Impact |
|---|---|---|---|---|
| 11 | Increase nav arrows `h-7 w-7` (28px) → `h-9 w-9` (36px) minimum | 3 carousel files | 6 lines | Critical |
| 12 | Increase QuickAccess icon containers `w-8 h-8` → `w-9 h-9` | `QuickAccessLinks.tsx:38` | 1 line | Medium |
| 13 | Increase SearchableSidebar search input `h-9` → `min-h-11` | `SearchableSidebar.tsx:81` | 1 line | High |
| 14 | Increase ContinueLectureCard "Continue" `h-8` → `min-h-11` | `ContinueLectureCard.tsx:101` | 1 line | High |
| 15 | Increase SiteSectionsTrigger `h-9 w-9` → `h-11 w-11` | `SiteSectionsModal.tsx:153` | 1 line | High |
| 16 | Increase AIRecommendations action button `h-7` → `min-h-9` | `AIRecommendations.tsx:156` | 1 line | High |
| 17 | Push `pr-6 xl:pr-8` from main content to flex container | `DashboardDesktopView.tsx:49-50` | 2 lines | Low |
| 18 | Add `hideSeparator` prop to SectionHeader | 2 files | 2 files | Low |
| 19 | Replace hardcoded Leaderboard shadows/rings with CSS variables | `LeaderboardSidebar.tsx:48-51` | 4 lines | Medium |
| 20 | Replace SearchableSidebar section colors with tokens | `SearchableSidebar.tsx:63-66` | 4 lines | Medium |

#### 9.4.3 Deep Fixes (Structural Changes)

| # | Fix | Files | Effort | Impact |
|---|---|---|---|---|
| 21 | Toolbar overflow menu for 375px — 7 buttons don't fit | `MissionControlHero.tsx` | Medium-High | Critical |
| 22 | Add loading skeletons for LeaderboardSidebar, ContinueLectureCard | 2 files | Low-Medium | High |
| 23 | Add error boundaries for MissionControlHero + sidebar components | 4 files | Low | High |
| 24 | Fix `CarouselErrorBoundary.resetKey` stuck-on-error (P2-9) | `CarouselErrorBoundary.tsx` | Low | Medium |
| 25 | Standardize SWR data unwrap at hook level | `lib/dashboard-fetch.ts` + consumers | Medium | Medium |
| 26 | Verify and fix `pt-24 lg:pt-28` → `pt-16 lg:pt-20` | `DashboardDesktopView.tsx:50` | Low | Medium |
| 27 | StudyTimer interval `sessions` stale closure | `StudyTimer.tsx:59-63` | Low | Low |
| 28 | Pause carousel auto-advance on hover/focus | 3 carousel files | Low | Medium |
| 29 | Standardize card padding `px-3 py-2.5` → `p-4` | 3 carousel files | 6 lines | Low |
| 30 | RTL/Arabic compatibility audit for user-generated content | All components with dynamic text | Medium | Medium |

#### 9.4.4 Priority Mapping to Phases

**Phase B candidates (visual consistency + touch targets):** Items #1–20  
**Phase C candidates (future features + standards):** Items #21–25, #27–28  
**Phase D candidates (cleanup):** Items #26, #29–30

---

### 9.5 Confirmed vs Suspected — Runtime Verification Checklist

| Finding | What to Test | How |
|---|---|---|
| `pt-24 lg:pt-28` justification | Measure actual fixed navbar height at dashboard-app route | Inspect computed style of the page layout above dashboard-content |
| Hero-mesh animation CPU cost | Profile MissionControlHero mount | Chrome DevTools Performance tab, 4x CPU throttling, record mount |
| Toolbar wrapping at 375px | Open dashboard at 375px viewport width | Responsive mode in DevTools — check if toolbar wraps to 2+ rows |
| Carousel auto-advance UX | Read a post card while auto-advance fires | Manual — does scroll feel disruptive? |
| BadgeProgressSheet animation | Profile with sheet open and 8 badges visible | Chrome DevTools Performance, check GPU/compositing cost |
| StudyTimer `sessions` stale closure | Run timer; let it complete a session; check logged sessions value | Add `console.log` at `saveSessions` call; check if value is `previous + 1` or expected value |

---

(End of Section 9)
