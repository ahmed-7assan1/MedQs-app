---
name: medonex-frontend
description: MedOneX frontend design patterns and principles derived from the landing page and auth pages. Use this skill whenever the user asks you to create a new page, component, or UI element for MedOneX, or to match the look and feel of the existing landing/auth experience. Triggers on phrases like "make it match the landing page", "use MedOneX design", "follow the same style as the auth page", "design like the rest of the app", "مثل اللاندينج", "زي صفحة التسجيل".
---

# MedOneX Frontend Design System

## Core Design Philosophy

Every MedOneX page should feel like it belongs to the same application. The landing page establishes the brand voice — professional, modern, with a purple accent. Auth flows feel secure and guided. Follow these patterns exactly.

## Brand Identity

### Primary Color Palette
- **Primary** (`hsl(var(--primary))`) — Purple (#7C3AED range)
- **Background** (`bg-background`, `bg-card`, `bg-muted`)
- **Text** (`text-foreground`, `text-muted-foreground`)
- **Border** (`border-border`, `border-input`)

### Ambient Glow (Brand Signature)
The purple radial gradient background is the most recognizable MedOneX visual signature:
```tsx
<div
  className="pointer-events-none fixed inset-0 z-0 opacity-[0.15] dark:opacity-[0.25] max-md:opacity-[0.08] max-md:dark:opacity-[0.12]"
  style={{
    background:
      "radial-gradient(ellipse 80% 60% at 0% 0%, #E7D6FF 0%, #B36BFF 25%, #7C3AED 45%, transparent 70%)",
  }}
/>
```

### Noise Texture (Dark Mode)
SVG filter overlay, visible only in dark mode:
```tsx
<div
  className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-[0.03]"
  style={{
    backgroundImage:
      `url("data:image/svg+xml,...")`, // fractalNoise filter
    backgroundSize: "128px 128px",
  }}
/>
```

## Animation System

### EASE Curve
ALWAYS use this cubic bezier for all animations:
```ts
const EASE = [0.22, 1, 0.36, 1] as const;
```

### FadeUp Variants (Standard)
```ts
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: EASE, delay: i * 0.06 },
  }),
};
```

### Stagger Children Pattern
```ts
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};
```

### whileInView (Scroll Reveal)
```ts
const VIEWPORT = { once: true, amount: 0.25 } as const;
// Use: initial="hidden" whileInView="visible" viewport={VIEWPORT}
```

## Layout Patterns

### Section Wrapper
```tsx
<section className="mx-auto max-w-7xl px-6 py-24">
```

### Max Width Containers
- Content sections: `mx-auto max-w-7xl px-6`
- Text content: `mx-auto max-w-2xl` or `max-w-lg`
- Auth forms: `w-full max-w-md` or `max-w-[420px]`

### Responsive Navbar (Fixed + Glass)
Always use the glass navbar pattern:
- `fixed top-0 left-0 right-0 z-50`
- `w-[min(1200px,calc(100vw-32px))]`
- `rounded-2xl border border-border/40 bg-background/80 backdrop-blur-xl`
- `shadow-[0_8px_30px_rgba(0,0,0,0.12)]`

### Page Sections
- Hero: `mx-auto max-w-7xl px-6 pb-24 pt-4 md:pt-8`
- Features/Content: `mx-auto max-w-7xl px-6 py-24`
- CTA: `mx-auto max-w-7xl px-6 pb-24`

## Component Patterns

### SectionHeader (Reusable Section Intro)
```tsx
// Eyebrow badge + heading + optional subtitle
<div className="mx-auto max-w-2xl text-center">
  <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
    <Sparkles className="h-3 w-3 text-primary" />
    {eyebrow}
  </div>
  <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
  {subtitle && <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
</div>
```

### Card (Standard)
```tsx
<div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
  {children}
</div>
```

### CTA Card (Large Featured Card)
```tsx
<div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] md:p-16">
  {/* Decorative blur circles */}
  <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
  <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
  {children}
</div>
```

### Buttons
**Primary (CTA):**
```tsx
<button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)]">
  Label <ChevronRight className="h-4 w-4" />
</button>
```

**Secondary (Ghost):**
```tsx
<button className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
  Label
</button>
```

**Pill Badge:**
```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
  <Sparkles className="w-3.5 h-3.5" />
  Label
</div>
```

### Auth Form Card (NewAuthShell)
```tsx
<div className="rounded-3xl border border-border bg-card/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-10">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
  <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
  <div className="mt-8">{children}</div>
</div>
```

### Tabs (Auth Mode Switcher)
```tsx
<div className="flex mb-6 p-0.5 rounded-xl bg-secondary border border-border">
  <button className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
    Option
  </button>
</div>
```

### Input Fields
```tsx
<input className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
```

## Typography
- **Headings**: `font-bold` or `font-black` + `tracking-tight`
- **Hero titles**: `text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]`
- **Section titles**: `text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl`
- **Featured numbers/stats**: `text-3xl font-black tracking-tight`
- **Subtitle/body**: `text-sm text-muted-foreground` or `text-base leading-relaxed`
- **Eyebrow labels**: `text-xs font-semibold uppercase tracking-[0.18em]`
- **User names**: `text-[15px] font-medium`

## Responsive Patterns

### Desktop / Mobile Breakpoint
- Auth uses `min-[1440px]:block` / `min-[1440px]:hidden` breakpoint for large desktop
- General responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints

### Mobile Card Grid
For feature cards on mobile, use horizontal scroll instead of hidden:
```tsx
<div className="-mx-6 mt-14 flex gap-5 overflow-x-auto px-6 pb-4 sm:hidden snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden">
  <div className="snap-start shrink-0 w-[80%]">{card}</div>
</div>
<div className="mt-14 hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
  {cards}
</div>
```

### Fixed Hero on Centered Columns
For landing/auth split layouts:
- Desktop: 55vw (left panel) + 45vw (right form area)
- Mobile: stacked single column

## RTL / Arabic Support
```tsx
// Wrap content with locale awareness
const { locale } = useLocale();
const isRtl = locale === "ar";
<div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "font-arabic" : ""}>
```

## Common Utilities

### Logo + Site Name Header
```tsx
<Link href="/" className="flex items-center gap-2">
  <MedOneXLogoMark className="h-8 w-8 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
  <div className="flex items-center gap-2">
    <div className="h-6 w-px bg-[#49495A] dark:bg-white/20" />
    <span className="text-[15px] font-bold tracking-tight text-[#13171E] dark:text-white">{siteName}</span>
  </div>
</Link>
```

### Theme Toggle Button
```tsx
<button className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground md:rounded-full md:border md:border-border md:bg-card md:hover:shadow-sm">
  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</button>
```

## Dependencies
- `framer-motion` — Required for all animations
- `lucide-react` — Required for all icons
- `@/contexts/LocaleContext` — RTL/AR support
- `@/contexts/SiteConfigContext` — Dynamic site name/logo
- `@/components/branding/MedQsLogo` — MedOneXLogoMark component

## When NOT to Use This Skill
- For admin dashboard pages (they follow a different design system)
- For external templates or marketing materials outside MedOneX
- When user explicitly asks for a different style or platform
