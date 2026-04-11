# MedQ V2 UI System

## Design System Foundations

Implemented under `src/ui/design-system`:

- `tokens.ts`
- `primitives/V2Card.tsx`
- `primitives/V2Kpi.tsx`
- `primitives/V2Shell.tsx`

## V2 Example Screens

- Student dashboard scaffold: `src/app/(student-v2)/dashboard/page.tsx`
- Admin dashboard scaffold: `src/app/(admin-v2)/dashboard/page.tsx`
- Teacher dashboard scaffold: `src/app/(teacher-v2)/dashboard/page.tsx`

## UX Principles

- Dashboard-centric layouts.
- Consistent spacing/elevation/radius tokens.
- Role-specific information architecture with shared primitives.
- Light and dark ready surfaces without visual clutter.

## Next UI Steps

- Migrate existing student/admin pages to V2 primitives incrementally.
- Add chart primitives, table primitives, and command palette.
- Wire micro-interactions with motion tokens and accessibility gates.
