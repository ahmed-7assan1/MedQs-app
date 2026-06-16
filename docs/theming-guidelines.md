# 🎨 MedOneX Theming Guidelines

## Overview

The app ships with **16 theme variants**, each providing cohesive light + dark color palettes across all pages. Theme variants are applied via the `data-theme-variant` attribute on `<html>`.

## Architecture

```
medonex-themes/                   ← Source: 16 hex-based CSS theme files
  └── theme-01-medonex-purple.css
  └── theme-02-ocean-teal.css
  └── ...

scripts/generate-themes.mjs       ← Converts hex → HSL, generates themes.css
  └── → src/styles/themes.css     ← 16 theme variants in HSL format

src/styles/globals.css            ← @import "./themes.css"
  └── :root, .dark                ← Default variables (MedOneX Purple)

src/lib/themes.ts                 ← ThemeVariant type + THEMES constant
src/lib/store.ts                  ← useThemeStore.themeVariant + setThemeVariant
src/app/layout.tsx                ← Inline script reads medqs-theme-variant → <html data-theme-variant>

src/components/ui/ThemeVariantPicker.tsx   ← UI grid to pick themes
  └── MobileBottomSheet.tsx                ← Mobile: under Appearance section
  └── FloatingIslandNavbar.tsx             ← Desktop: palette icon → expanded panel
```

## Available CSS Variables

These are defined for each theme variant in both light (`[data-theme-variant="xxx"]`) and dark (`.dark[data-theme-variant="xxx"]`):

| Variable | Source | Usage |
|---|---|---|
| `--background` | `--color-bg` | Page background |
| `--foreground` | `--color-text-1` | Primary text / headings |
| `--card` | `--color-surface` | Card / surface backgrounds |
| `--muted` | `--color-surface-dim` | Muted backgrounds (hover, inputs) |
| `--border` | `--color-border` | Borders / dividers |
| `--border-str` | `--color-border-str` | Stronger borders |
| `--primary` | `--color-primary` | Accent color (buttons, links) |
| `--primary-foreground` | `--color-primary-txt` | Text on primary backgrounds |
| `--primary-bg` | `--color-primary-bg` | Badge / chip backgrounds |
| `--secondary-foreground` | `--color-text-2` | Secondary text |
| `--muted-foreground` | `--color-text-3` | Placeholder / muted text |
| `--destructive` | `--color-danger` | Error / delete actions |
| `--success` | `--color-success` | Success states |
| `--warning` | `--color-warning` | Warning states |
| `--gold` | `--color-gold` | Streak / prestige accents |
| `--gold-bg` | `--color-gold-bg` | Gold badge backgrounds |
| `--navbar` | `--color-navbar` | Chrome (tab bar, navbar) |
| `--radius` | — | Border radius (12px) |

## Tailwind Class Mapping

Use these classes instead of hardcoded colors:

| Tailwind Class | CSS Variable |
|---|---|
| `bg-background` | `--background` |
| `text-foreground` | `--foreground` |
| `bg-card` | `--card` |
| `bg-muted` | `--muted` |
| `text-muted-foreground` | `--muted-foreground` |
| `border-border` | `--border` |
| `bg-primary` | `--primary` |
| `text-primary` | `--primary` |
| `bg-primary/10` | `--primary` at 10% opacity |
| `text-primary-foreground` | `--primary-foreground` |
| `bg-destructive` | `--destructive` |
| `text-destructive` | `--destructive` |
| `bg-success` | `--success` |
| `text-success` | `--success` |
| `bg-warning` | `--warning` |
| `bg-gold` | Add as needed |
| `bg-navbar` | Add as needed |

## Rules for Writing Components

1. **Never use hardcoded hex/HSL colors** — always use Tailwind classes that map to CSS variables (`bg-background`, `text-foreground`, `border-border`, `bg-primary/10`, etc.).

2. **Never use fixed brand colors** like `indigo-500`, `violet-400`, `amber-600` — replace with theme-aware equivalents:
   - `bg-indigo-500` → `bg-primary`
   - `text-indigo-400` → `text-primary`
   - `border-indigo-500` → `border-primary`
   - `bg-indigo-50` → `bg-primary/10`
   - `bg-indigo-100` → `bg-primary/15`

3. **Dark mode** — use Tailwind `dark:` variant over CSS variables: `text-primary dark:text-primary` (the `dark:` variant ensures the dark-mode value from the theme overrides the light-mode value).

4. **Opacity modifiers** work with HSL variables: `bg-primary/10`, `text-foreground/80`.

5. **Inline styles** — only use `var(--xxx)` when Tailwind doesn't support the property (e.g., masks, gradients).

## Adding a New Theme

1. Create a hex-based CSS file in `medonex-themes/` following the `--color-*` naming pattern.
2. Run `node scripts/generate-themes.mjs` to regenerate `src/styles/themes.css`.
3. Add the theme entry to the `THEMES` array in `src/lib/themes.ts`.

## Theme Variant Flow

```
User picks "Ocean Teal" in ThemeVariantPicker
  → setThemeVariant("ocean-teal")
    → localStorage.setItem("medqs-theme-variant", "ocean-teal")
    → <html data-theme-variant="ocean-teal">
      → [data-theme-variant="ocean-teal"] { --primary: 174 84% 35%; ... }
        → All bg-primary, text-foreground, etc. update automatically

On next page load:
  → Inline script reads medqs-theme-variant
    → Sets data-theme-variant before first paint
      → Zero flicker
```
