# Modules Page Restructure Plan

## Overview
Split the single flat module list into 3 semantically grouped sections based on the student's academic progression.

## Key Schema (Current — schema.prisma v1)
```
University → AcademicYear (yearNumber: Int) → Semester → Module
User.semesterId → Semester
User.universityId → University
```

## New Page Layout
```
TopBar
├── HeroSection + StatsCard         ← current semester only
├── QuickActions
├── Guest Banner (if guest)
├── Continue Learning               ← featured from current semester
├── Recently Updated                ← from current semester
├── In Progress                     ← current semester modules
│   └── ModulesGrid
├── Completed                       ← earlier semesters (yearNumber < current)
│   └── ModulesGrid
└── All Modules                     ← all university modules grouped by semester
    └── per-semester sections
```

## Data Fetching Strategy

### Server Component (page.tsx)
Single Prisma query fetches all modules for the user's university:

```ts
prisma.module.findMany({
  where: {
    semester: {
      academicYear: { universityId: user.universityId }
    }
  },
  include: { semester: { include: { academicYear: true } }, subjects: { ... } },
  orderBy: [{ semester: { academicYear: { yearNumber: 'asc' } } }, { name: 'asc' }]
})
```

Then split into 3 groups in-memory:
| Group | Filter | Stats Source |
|---|---|---|
| InProgress | `module.semesterId === user.semesterId` | Current semester |
| Completed | `module.semester.academicYear.yearNumber < currentYearNumber` | Earlier semesters |
| AllModules | All (grouped by semester label) | All university |

Mastery data (`QuizAttemptItem`) fetched in a single batch for all modules at once.

### API Endpoint (bonus)
`GET /api/v1/modules?scope=current|completed|all` returns filtered `ModuleWithStats[]` 
— useful if sections need client-side refresh later.

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(student)/modules/page.tsx` | Rewrite data fetching → 3 groups + new layout sections |
| `src/app/api/v1/modules/route.ts` | **New** — API endpoint for scope-based filtering |

## Components Used (no changes needed)
- `TopBar`, `HeroSection`, `StatsCard`, `QuickActions`, `FilterPills`
- `FeaturedModuleCard`, `RecentModuleCard`
- `ModulesGrid`, `ModuleCard` (receives `ModuleWithStats[]`)

## Implementation Phases

### Phase 1: Plan file ✓
### Phase 2: Module grouping data fetch + page rewrite
### Phase 3: TypeScript + verification

## Skills/Knowledge Used
- **Next.js App Router** — server components, parallel data fetching
- **Prisma** — relational queries with nested includes, sorting by related model fields
- **TypeScript** — type-safe data transformation, sets for mastery tracking
- **Tailwind CSS** — responsive grid layout, section styling
- **React** — fragment grouping, conditional rendering
