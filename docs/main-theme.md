# MedOneX Landing Page — Main Theme

> Apply this spec to any page to match the landing page's visual identity.

---

## 1. Layout Shell

| Rule | Value |
|---|---|
| Outer wrapper | `min-h-screen overflow-x-hidden` |
| Max content width | `max-w-7xl` (1280px) |
| Horizontal padding | `px-6` (24px) |
| Section vertical padding | `py-24` (96px) |
| Section alternating bg | `bg-transparent` ↔ `bg-card/40` |
| Background grid | `.landing-dot-grid` — `radial-gradient(hsl(var(--border)) 1px, transparent 1px)` at `22px 22px` |
| RTL support | `dir="rtl"` + `font-arabic` class swaps font to Cairo |

---

## 2. Color Tokens (CSS Variables)

```css
/* Light mode */
--background: 240 33% 97%;        /* page bg     #F5F5FA */
--foreground: 240 28% 14%;        /* headings    #1A1A2E */
--card: 0 0% 100%;                /* surfaces    #FFFFFF */
--primary: 246 89% 70%;           /* brand       #7C6FF7 */
--border: 240 14% 93%;            /* borders     #EBEBF0 */
--muted: 240 33% 96%;             /* surface-dim #F0F0F8 */
--muted-foreground: 240 10% 59%;  /* #8E8EA0 */
--secondary: 0 0% 0% / 0.04;
--ring: 246 89% 70%;
--radius: 12px;

/* Dark mode */
.dark {
  --background: 240 3% 4%;        /* #0A0A0B */
  --foreground: 250 33% 95%;      /* #F0EFF8 */
  --card: 240 16% 12%;            /* #1A1A24 */
  --primary: 246 89% 70%;         /* same as light */
  --border: 240 20% 22%;          /* #2C2C42 */
  --muted: 240 19% 16%;           /* #222232 */
  --muted-foreground: 246 14% 42%;/* #5E5C7A */
}
```

---

## 3. Typography

| Element | Classes |
|---|---|
| Font stack | `--font-nunito` (EN) / `--font-cairo` (AR), `system-ui, sans-serif` |
| Hero H1 | `text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]` |
| Section H2 | `text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight` |
| Card H3 | `text-base font-semibold` |
| Body | `text-sm leading-relaxed text-muted-foreground` |
| Subtitle | `mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground` |

---

## 4. Reusable Components

### Eyebrow Badge
```
inline-flex items-center gap-1.5 rounded-full border border-border
bg-card px-3 py-1 text-xs font-medium text-muted-foreground
```
Add `Sparkles h-3 w-3 text-primary` icon before text.

### Section Header
```
mx-auto max-w-2xl text-center
  [Eyebrow Badge]
  mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl   (title)
  mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base              (optional subtitle)
```

### Card Base
```
rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md
```

### Feature Card
```
group relative h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md
  [icon] grid h-11 w-11 place-items-center rounded-xl   bg-[color]20 color-[color]
  [title] mt-4 text-base font-semibold
  [desc] mt-1.5 text-sm leading-relaxed text-muted-foreground
  [hover glow] absolute inset-0 bg-gradient-to-b from-transparent via-[color]10 to-[color]18 opacity-0 group-hover:opacity-80
```

### Primary Button (Hero style)
```
rounded-full border border-border bg-black px-4 py-2 text-sm font-medium
text-white shadow-sm transition-all hover:shadow-md
dark:bg-white dark:text-black
```

### Primary Button (CTA style)
```
rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground
shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)]
```

### Secondary Button
```
rounded-full border border-border bg-card px-4 py-2 text-sm font-medium
shadow-sm transition-all hover:shadow-md
```
Ghost variant: `rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground`

### Social Icon Circle
```
grid h-9 w-9 place-items-center rounded-full border border-border bg-background
text-muted-foreground transition-colors hover:text-foreground
```

### Section Wrapper
```
mx-auto max-w-7xl px-6 py-24
```

---

## 5. Animation System

| Token | Value |
|---|---|
| `EASE` | `[0.22, 1, 0.36, 1]` (custom cubic-bezier) |
| `VIEWPORT` | `{ once: true, amount: 0.25 }` |
| Entry animation | `opacity: 0, y: 12-30 → opacity: 1, y: 0` (0.4-0.6s, EASE) |
| Stagger delay | `0.05-0.07` per child |
| Card hover | `whileHover={{ y: -4 }}` or `group-hover:-translate-y-1` |
| Progress bars | `scaleX` 0→1, `origin-left` (GPU) |
| Bar charts | `scaleY` 0→1, `origin-bottom` (GPU) |
| Marquee | CSS `@keyframes marquee` with `translate3d(-50%)`, `will-change: transform`, `backface-visibility: hidden` |
| Collapsible sections | `maxHeight` + `opacity` (not `height: auto`) |
| Scroll handler | RAF-throttled + `passive: true` |

---

## 6. Navbar Pattern

```
fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none
  mx-auto mt-3 w-[min(1200px,calc(100vw-32px))]
  rounded-2xl border border-border/40
  bg-background/80 backdrop-blur-xl
  shadow-[0_8px_30px_rgba(0,0,0,0.12)]
  supports-[backdrop-filter]:bg-background/60
  pointer-events-auto

  [inner] flex items-center justify-between px-5 py-2.5
    [logo] h-8 w-8 + h-6 w-px separator + text-[15px] font-bold tracking-tight
    [desktop nav] hidden md:flex items-center justify-center gap-9 text-sm text-muted-foreground
    [actions] buttons: rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm
    [mobile menu] AnimatePresence with overflow-hidden + maxHeight animation
```

---

## 7. Background Glow (CinematicBackground)

```
fixed inset-0 -z-10 overflow-hidden bg-background

[layer 1] radial-gradient orbs (top-left blue, bottom-right indigo)
  opacity-30 dark:opacity-20 pointer-events-none
  h-[1000px] w-[1000px] rounded-full
  bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)]

[layer 2] grid overlay
  opacity-[0.05] dark:opacity-[0.03]
  backgroundImage: linear-gradient + backgroundSize: 40px 40px

[layer 3] grain texture
  opacity-[0.02] dark:opacity-[0.03]
  bg-[url('carbon-fibre')]
```

---

## 8. Button Hover Effects

- Text links: `transition-colors hover:text-foreground`
- Border buttons: `transition-all hover:shadow-md`
- Icon buttons (mobile): `grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground md:rounded-full md:border md:border-border md:bg-card md:hover:shadow-sm`
- Tap feedback (mobile): `button:active { transform: scale(0.96); }`

---

## 9. Marquee Animations (CSS)

```css
@keyframes marquee {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
@keyframes marquee-reverse {
  from { transform: translate3d(-50%, 0, 0); }
  to   { transform: translate3d(0, 0, 0); }
}
.animate-marquee         { animation: marquee 40s linear infinite; }
.animate-marquee-reverse { animation: marquee-reverse 40s linear infinite; }
```

Both use `will-change: transform; backface-visibility: hidden;`

---

## 10. Quick Reference — Common Class Combinations

```tsx
// Section
<section className="mx-auto max-w-7xl px-6 py-24">...</section>

// Section with card bg
<section className="bg-card/40 py-24">...</section>

// Card
<div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md">

// Eyebrow
<div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">

// Primary button
<Link href="/register" className="rounded-full border border-border bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md dark:bg-white dark:text-black">

// Secondary button
<Link href="/auth" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">

// Social icon
<a className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground">

// Section header
<div className="mx-auto max-w-2xl text-center">
  <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
    <Sparkles className="h-3 w-3 text-primary" />
    {eyebrow}
  </div>
  <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
  <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
</div>

// Animated entry
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.25 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
>
```
