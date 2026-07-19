---
name: medonex-modules
description: Modules/Dashboard/Content design system for MedOneX — glass sidebar, TopBar, lecture pages, annotation/drawing tools, localStorage stores, and all layout/component patterns under the /modules/* routes. Use ONLY when building or redesigning modules pages, lecture pages, saved/downloads views, or the content ecosystem. Triggers on "modules page", "glass sidebar", "lecture page", "annotator", "draw mode", "saved view", "downloads page", "localStorage store".
---

# MedOneX Modules Design System

## Design Philosophy

The modules section is a dashboard-like workspace for students: lecture content, annotations, saved materials, and downloads. Everything uses a **glass aesthetic** with floating panels, backdrop blur, soft shadows, and a sidebar-centric layout. Unlike the landing/auth pages (purple glow + noise texture), the modules design is cleaner and more utilitarian — relying on surface layering (`bg-background`, `bg-card`, `bg-muted`) and border separation rather than decorative gradients.

## Layout Architecture

### Shell Structure
```
modules/layout.tsx (server) → SidebarProvider
  ├── TopBar (fixed top-0, glass)
  ├── ModulesSidebar (floating left, glass, collapsible)
  └── MainContent (dynamic margin based on sidebar state)
```

### Sidebar — 3 States
```tsx
// SidebarContext handles isCollapsed + open/close
// Scroll handler only auto-collapses, never auto-expands
const { isOpen, isCollapsed } = useSidebar();

// Margin logic in MainContent:
lg:ml-60  // full (open + not collapsed)
lg:ml-16  // collapsed (open + collapsed)
lg:ml-0   // closed
```

**Sidebar styling:**
```tsx
<aside className={cn(
  "fixed left-2 top-0 z-30 flex h-[calc(100vh-8px)] flex-col rounded-2xl rounded-tl-none rounded-tr-none border border-border bg-background/70 backdrop-blur-xl shadow-lg transition-all duration-500 ease-in-out",
  isOpen ? (isCollapsed ? "w-16" : "w-60") : "-translate-x-[calc(100%+0.5rem)]"
)}>
```

**Nav sections pattern:** Group items by `NAV_SECTIONS` (Main/Learning/Tools/Community), each section containing items with icons + labels. In collapsed mode show only icons via `ALL_ITEMS`.

### TopBar
```tsx
<header className="fixed top-0 z-40 flex h-[52px] w-full items-center border-b border-border bg-background/70 backdrop-blur-xl transition-all duration-500 ease-in-out">
  {/* Smart hamburger: collapsed → expand, full → close, closed → open full */}
  {/* Search input + ⌘K */}
  {/* Notification bell + dropdown */}
  {/* Avatar + dropdown */}
  {/* Brand logo centered at 34px height */}
</header>
```

### PageContainer — Dynamic Width
```tsx
// Switches between max-w-7xl and max-w-[1600px] when both sidebars closed
<div className={cn(
  "mx-auto w-full px-6 py-6 transition-all duration-500 ease-in-out",
  "max-w-7xl",
  !isModulesSidebarOpen && !sidebarOpen && "max-w-[1600px]"
)}>
```

## Component Patterns

### Glass Card (Base)
```tsx
<div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
  {children}
</div>
```

### Glass Panel (Floating)
```tsx
<div className="rounded-2xl border border-border bg-background/70 backdrop-blur-xl shadow-lg">
  {children}
</div>
```

### Module Card
```tsx
<div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-500 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
  {/* Accent color strip */}
  <div className="absolute left-0 top-0 h-full w-1 bg-[accent-color]" />
  {/* Content */}
</div>
```

### Filter Pills
```tsx
<button className={cn(
  "rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
  active
    ? "border-primary bg-primary text-primary-foreground shadow-sm"
    : "border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground"
)}>
  {label}
  {count !== undefined && <span className="ml-1.5 text-[10px] opacity-70">({count})</span>}
</button>
```

### Tab Bar (Lecture Page) — Sticky
```tsx
<div className="sticky top-[52px] z-20 border-b border-border bg-background/70 backdrop-blur-xl">
  {tabs.map(tab => (
    <button className={cn(
      "relative px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
      active === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    )}>
      {tab.label}
      {tab.count > 0 && <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">{tab.count}</span>}
      {active === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  ))}
</div>
```

### Hero Section
```tsx
<div className="flex items-center py-10">
  {/* Centered vertically with py-10, items-center */}
  {/* Breadcrumb links */}
  {/* Title + description */}
  {/* Stats row */}
</div>
```

### Overview Dashboard
```tsx
<div className="grid gap-6">
  {/* AI Summary (optional) */}
  {/* Quick Access — grid of glass section cards */}
  {/* Each card clickable → sets active tab */}
</div>
```

### Section Card (Quick Access / Overview)
```tsx
<button className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
    <Icon className="h-5 w-5 text-primary" />
  </div>
  <h3 className="text-sm font-bold">{title}</h3>
  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
</button>
```

### Breadcrumbs
```tsx
<nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
  <Link href="/modules" className="hover:text-foreground transition-colors">Modules</Link>
  <ChevronRight className="h-3 w-3" />
  <span className="text-foreground">Current</span>
</nav>
```

### Stats Badge
```tsx
<div className={cn(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold",
  "bg-accent/10 text-accent"
)}>
  <Icon className="h-3.5 w-3.5" />
  <span>{value}</span>
</div>
```

## Lecture Page Patterns

### Layout
```tsx
<div className="min-h-screen bg-background">
  <TopBar />
  <PageContainer>{/* children */}</PageContainer>
</div>
```

### LectureAnnotator — PDF-like Annotation Tool
- **6 Modes**: Edit / Pen / Highlight / Eraser / Note / Draw
- **Default mode**: `"pen"` (not "edit")
- **PDF Page**: white background (`bg-white`), `rounded-xl shadow-lg`, `max-w-3xl`, A4 proportions
- **TipTap Layer**: renders markdown content, `editable={mode === "edit"}`, read-only in annotation modes
- **Canvas Overlay**: active only in pen/eraser/note modes (`pointer-events-none` otherwise)
- **Sticky Notes**: DOM elements (not canvas dots), positioned absolutely, hover tooltip + click-to-edit
- **Highlight Mode**: uses TipTap's native Highlight mark (text selection, not canvas)
- **Storage**: HTML → `medonex_notes_html_{lectureId}`, annotations → `medonex_annotations_{lectureId}`

```tsx
<LectureAnnotator
  lectureId={string}
  content={markdownString}
  placeholder={string}
/>
```

### AnnotatorDrawCanvas — Excalidraw Drawing Mode
- Loaded dynamically: `dynamic(() => import("@/vendor/excalidraw/vendor"))` — only loaded when Draw mode activated
- Controls: zoom in/out, grid toggle, background color presets (white/light/cream/dark/blueprint), export PNG, clear canvas
- Auto-save to localStorage under `medonex_drawing_{lectureId}`
- Light theme (`theme="light"`) to match PDF white page aesthetic
- **IMPORTANT**: When passing `initialData` to Excalidraw, always ensure `appState.collaborators` is an array (`[]`)

```tsx
<AnnotatorDrawCanvas lectureId={string} />
```

### TiptapEditor — Forwarded Ref
```tsx
<TiptapEditor
  ref={editorRef}
  content={html}
  onChange={setHtml}
  editable={mode === "edit"}
  toolbar={false}
  className="border-0 shadow-none rounded-none bg-transparent"
/>
```
- Exposes `toggleHighlight()` and `focus()` via `forwardRef`

### Sub-pages Consistency
All 8 lecture sub-pages (recordings, materials, flashcards, quiz, checklist, notes, Q&A, AI Tutor) share:
- `min-h-screen bg-background`
- `<TopBar />`
- `<PageContainer />` with dynamic max-w
- Glass card containers for content

## localStorage Stores — CRUD Pattern

All stores follow the same pattern:

```ts
// cached read pattern to prevent infinite render loops
let _cacheRaw: Type[] | null = null;

export function getItems(): Type[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (_cacheRaw && shallowEqual(_cacheRaw, parsed)) return _cacheRaw;
    _cacheRaw = parsed;
    return _cacheRaw;
  } catch {
    return [];
  }
}

export function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function useItems() {
  return useSyncExternalStore(subscribe, getItems);
}

export function addItem(item) {
  const items = getItems();
  items.push({ ...item, id: nanoid() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  _cacheRaw = items;
  window.dispatchEvent(new Event("storage"));
}
```

### Existing Stores
| Store | Key | Data |
|---|---|---|
| `local-saved-store.ts` | `medonex_saved` | Array of `{ id, type, title, moduleName, savedAt, icon }` |
| `local-downloads-store.ts` | `medonex_downloads` | Array of `{ id, title, type, fileType, size, downloadedAt, url, icon }` |
| `local-annotations-store.ts` | `medonex_annotations` | `{ strokes: AnnotationStroke[], notes: AnnotationNote[] }` |

## Design Tokens (Modules-Specific)

| Token | Value | Usage |
|---|---|---|
| Glass surface | `bg-background/70 backdrop-blur-xl` | Sidebar, TopBar, tab bar |
| Card surface | `bg-card border border-border rounded-2xl` | Cards, panels |
| Card padding | `p-6` | Default card padding |
| Shadow | `shadow-sm` / `shadow-lg` | Cards / floating panels |
| Hover lift | `hover:-translate-y-0.5 hover:shadow-md` | Interactive cards |
| Container rounding | `rounded-2xl` | Sidebar, cards |
| Inner rounding | `rounded-xl` | Inputs, stat badges, buttons |
| Pill rounding | `rounded-xl` | Filter pills |
| Label text | `text-[11px] font-bold uppercase tracking-widest` | Toolbar labels, filter pills |
| Tab label | `text-xs font-bold uppercase tracking-widest` | Tab bar items |
| Transition | `duration-500 ease-in-out` | All layout animations |
| Sidebar full | `w-60` + `lg:ml-60` | Open state |
| Sidebar collapsed | `w-16` + `lg:ml-16` | Icons-only state |
| TopBar height | `h-[52px]` | Fixed header |
| Tab bar offset | `top-[52px]` | Sticky below TopBar |

## Typography
- **Display**: Plus Jakarta Sans (`font-display`)
- **Body/sans**: Inter (`font-sans`)
- **Mono**: IBM Plex Mono (`font-mono`)
- **Arabic**: Cairo (`font-arabic` or `font-sans` with Arabic chars)

## Animations
```ts
// All layout transitions
duration-500 ease-in-out

// Card hover
hover:-translate-y-0.5 hover:shadow-md transition-all duration-500 ease-in-out

// Page transitions (AnimatePresence)
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
/>

// Tab underline animation
<motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
```

## Key Dependencies
- `next/navigation` — `useRouter`, `useParams`
- `lucide-react` — All icons
- `framer-motion` — Animations, AnimatePresence
- `@/lib/utils` — `cn()` utility
- `@radix-ui/react-dialog` — Dialogs
- `@radix-ui/react-dropdown-menu` — Dropdowns
- `@radix-ui/react-tabs` — Tab components
- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-highlight` — LectureAnnotator text editor
- `@/vendor/excalidraw/vendor` — Draw mode (dynamic import, ssr:false)
- `marked` — Markdown→HTML conversion in LectureAnnotator
- React `useSyncExternalStore` — localStorage reactive subscriptions

## When NOT to Use This Skill
- For landing page, auth pages, or marketing pages — use `medonex-frontend` skill instead
- For admin dashboard pages that follow a different system
- When user explicitly asks for a different design approach
