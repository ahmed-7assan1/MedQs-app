# Download Page — Theme Alignment Plan

**Goal**: Apply `docs/main-theme.md` to `src/app/download/page.tsx`

## Changes Overview

| Step | File | What |
|---|---|---|
| 1 | `download/page.tsx` | Add `"use client"`, imports: `motion`, `EASE`, `VIEWPORT`, `SectionHeader`, `Footer` |
| 2 | `download/page.tsx` | Change outer wrapper: add `.landing-dot-grid`, remove `transition-colors` |
| 3 | `download/page.tsx` | Hero section — replace hardcoded colors with theme tokens, wrap in motion, fix buttons |
| 4 | `download/page.tsx` | Phone mockups — motion animation + theme colors |
| 5 | `download/page.tsx` | Stats section — `bg-card/40`, `text-foreground`, `text-muted-foreground`, + motion stagger |
| 6 | `download/page.tsx` | Features grid — replace cards with `FeatureCard` pattern (rounded-2xl, bg-card, h-11 w-11 icon) + stagger |
| 7 | `download/page.tsx` | Install steps — `rounded-2xl border border-border bg-card p-6`, 3-column grid |
| 8 | `download/page.tsx` | Auto-update section — `rounded-2xl border border-border bg-card p-10 md:p-16 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]` |
| 9 | `download/page.tsx` | CTA section — `rounded-full bg-primary px-6 py-3` buttons + SectionHeader pattern |
| 10 | `download/page.tsx` | Footer — replace manual footer with `<Footer />` import |
| 11 | `download/page.tsx` | Replace ALL `text-slate-*`, `bg-slate-*`, `border-slate-*` with theme variables |
| 12 | `download/page.tsx` | Add alternating section backgrounds (`bg-transparent` / `bg-card/40`) |
| 13 | `download/page.tsx` | Add Framer Motion entry animations to all sections |
| 14 | Check | Run TypeScript check — no errors |
| 15 | Check | Run build — no errors |

## Verification

- Each step: edit → save → verify
- Final: `npx tsc --noEmit` + `npm run build`
