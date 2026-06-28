# Phase 1 — Full Execution Plan

> **Last updated:** 2026-06-28
> **Status:** Awaiting approval

---

## Table of Contents

1. [Skills Used](#1-skills-used)
2. [Execution Order](#2-execution-order)
3. [Phase A: Low-Risk Tasks (Execute Immediately)](#3-phase-a-low-risk-tasks-execute-immediately)
   - A1: `useId()` Fixes (ReviewModal + ReviewPromptModal)
   - A2: `setTimeout` Cleanup (ReviewModal)
   - A3: `AbortController` (useLazyFetch)
   - A4: `@import` → `<link>` (themes.css)
   - A5: Lazy-Mount ReviewPromptModal
4. [Phase B: Reports Before Proceeding](#4-phase-b-reports-before-proceeding)
   - B1: Puter.js Complete Usage Map
   - B2: Prisma Mismatch Report
   - B3: TypeScript Error Category Report
5. [Phase C: Awaiting Approval](#5-phase-c-awaiting-approval)
   - C1: Puter.js Relocation
   - C2: TS Error Fixes (including Prisma mismatches)
   - C3: Remove Build Error Suppression

---

## 1. Skills Used

| Skill | Used For |
|-------|----------|
| **`senior-frontend`** | React patterns (`useId`, `useRef`), bundle optimization, dynamic imports, component architecture |
| **`next-best-practices`** | Script loading with `next/script`, CSS import strategy, TypeScript config best practices |
| **`vercel-react-best-practices`** | Effect cleanup (`useRef` for timeouts), `AbortController` for fetch, re-render optimization |
| **`clean-code`** | Leave code cleaner, explicit side effects, error handling discipline, strong naming |
| **`performance-profiler`** | Before/after measurement: bundle size delta, auth call reduction, network request savings |

---

## 2. Execution Order

```
Phase A (5 tasks — immediate execution, no approval needed):
  A1 → A2 → A3 → A4 → A5

Phase B (3 reports — generate & present):
  B1 → B2 → B3

Phase C (3 tasks — STOP, await approval):
  C1 → C2 → C3
```

---

## 3. Phase A: Low-Risk Tasks (Execute Immediately)

---

### A1: `useId()` Fixes for SVG IDs

**Files:**
- `src/components/landing/ReviewModal.tsx` (lines 22-28)
- `src/components/landing/ReviewPromptModal.tsx` (lines 16-19)

**Problem:** Hardcoded SVG `<defs>` IDs (`starGrad`, `starGlow`, `promptStar`) cause ID collisions if multiple instances mount simultaneously.

**Solution:**

#### ReviewModal.tsx `StarIcon` component:

```tsx
// Before
function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg>
      <defs>
        <linearGradient id="starGrad" ...>
        <filter id="starGlow" ...>
      </defs>
      <path fill={filled ? "url(#starGrad)" : "none"}
            filter={filled ? "url(#starGlow)" : undefined} />
    </svg>
  );
}

// After
import { useId } from "react";

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  const uid = useId();
  return (
    <svg>
      <defs>
        <linearGradient id={`${uid}-grad`} ...>
        <filter id={`${uid}-glow`} ...>
      </defs>
      <path fill={filled ? `url(#${uid}-grad)` : "none"}
            filter={filled ? `url(#${uid}-glow)` : undefined} />
    </svg>
  );
}
```

#### ReviewPromptModal.tsx `StarIcon` component:

Same pattern — replace `id="promptStar"` with `id={`${useId()}-star`}`, update `url(#promptStar)` references.

**Verification:** Render multiple modals — SVG IDs are unique per instance.

---

### A2: `setTimeout` Cleanup in ReviewModal

**File:** `src/components/landing/ReviewModal.tsx` (line 62)

**Problem:** `setTimeout(() => { onSubmitted(); }, 1500)` is never cleaned up. If user closes modal before 1.5s, callback fires on unmounted component.

**Solution:**

```tsx
// Add to imports
import { useState, useRef, useEffect } from "react";

// Add inside ReviewModal component (before handleSubmit)
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

// Replace line 62:
// Before: setTimeout(() => { onSubmitted(); }, 1500);
// After:
timeoutRef.current = setTimeout(() => { onSubmitted(); }, 1500);
```

Also add cleanup in the `catch` block (line 64-66) to clear timeout on error.

**Verification:** Open modal, close quickly — no React state-update-on-unmounted warnings.

---

### A3: `AbortController` in `useLazyFetch`

**File:** `src/hooks/useLazyFetch.ts`

**Problem:** `fetch(url)` has no `AbortController`. On unmount, request continues and calls `setState` on unmounted component.

**Solution:**

```tsx
// Inside useLazyFetch hook, after the observer effect

const abortRef = useRef<AbortController | null>(null);

// In the fetch effect (lines 41-50):
useEffect(() => {
  if (!shouldFetch || !url) return;

  // Abort any previous in-flight request
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  setLoading(true);
  setError(null);
  fetch(url, { signal: controller.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject("Failed to fetch")))
    .then((d) => {
      if (!controller.signal.aborted) {
        setData(d);
        onData?.(d);
      }
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err?.message || String(err));
    })
    .finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

  return () => controller.abort();
}, [shouldFetch, url]);
```

**Note:** The `onData` callback also has a stale closure issue. Use `useRef(onData)` to keep it fresh without triggering re-fetches.

**Verification:** Navigate away while lazy-fetch is in-flight — no console warnings.

---

### A4: Replace `@import "./themes.css"` with Direct Import

**Files:**
- `src/styles/globals.css` (line 43)
- `src/app/layout.tsx` (line 18)

**Problem:** `@import "./themes.css"` inside `globals.css` is render-blocking. Browser must fetch and parse `themes.css` before rendering any content.

**Solution:**

1. Remove from `globals.css`:
   ```css
   /* Delete line 43: */
   /* @import "./themes.css"; */
   ```

2. Add direct import in `layout.tsx`:
   ```tsx
   // Add alongside existing globals.css import (line 18)
   import "../styles/globals.css";
   import "../styles/themes.css";  // ← Add this
   ```

**Why this works:** Next.js CSS loader handles `import` of `.css` files at build time — it extracts them into separate cacheable files and injects `<link>` tags automatically. This is more optimal than `@import` which is a CSS-level render-blocking directive.

**Risk:** Next.js only allows global CSS imports from app/layout.tsx (or _app.tsx). Since themes.css is already imported via @import from globals.css (which is imported in layout.tsx), moving it to a direct import at the same level is safe.

**Verification:** Build succeeds. Landing page renders with correct theme colors in both light/dark mode.

---

### A5: Lazy-Mount `ReviewPromptModal`

**Files:**
- `src/components/landing/Testimonials.tsx`
- `src/components/landing/ReviewPromptModal.tsx`

**Problem:** `ReviewPromptModal` calls `supabase.auth.getSession()` on **every** landing page visit (lines 39-48), even for anonymous visitors. This is a wasted Supabase network round-trip.

**Solution:**

Use `next/dynamic` to code-split the modal:

```tsx
// In Testimonials.tsx

// Before:
import { ReviewPromptModal } from "./ReviewPromptModal";

// After:
import dynamic from "next/dynamic";
const ReviewPromptModal = dynamic(
  () => import("./ReviewPromptModal").then(m => ({ default: m.ReviewPromptModal })),
  { ssr: false }
);
```

**How it works:**
- The component (and its Supabase client dependency) is bundled as a separate chunk
- It only loads when `Testimonials` renders (i.e., when the user scrolls to the testimonials section)
- If the user never scrolls that far — no network request, no Supabase auth call

**Additional improvement:** Add a delay before mounting to avoid hydration priority contention:

```tsx
const [showReview, setShowReview] = useState(false);
useEffect(() => {
  const t = setTimeout(() => setShowReview(true), 5000);
  return () => clearTimeout(t);
}, []);

// In JSX:
{showReview && <ReviewPromptModal />}
```

**Verification:** Open landing page, check Network tab — no Supabase `getSession()` call. Only fires when testimonials section enters viewport.

---

## 4. Phase B: Reports Before Proceeding

After completing Phase A, generate the following reports:

---

### B1: Puter.js Complete Usage Map

Search the entire codebase for:

| Pattern | Purpose |
|---------|---------|
| `puter` | All references |
| `window.puter` | Runtime access pattern |
| `js.puter.com` | CDN script source |
| `global.d.ts` | Type declarations |
| Any dynamic import of Puter | Lazy loading patterns |

**For each match, determine:**
1. File path and line number
2. What Puter API is used (AI chat, AI image, TTS, broker/pubsub, model list)
3. Which route group the file belongs to (admin, social, student, chat, student-clean, public/landing)
4. Whether the usage is direct (requires script loaded beforehand) or indirect (just a config string)

**Expected output:** Table with columns: File | Line | API Used | Route Group | Direct/Indirect | Safe to Relocate?

---

### B2: Prisma Mismatch Report

Based on preliminary TS error analysis, the following model/field references don't match the current `schema.prisma`:

| Code Reference | File(s) | Expected Model/Field | Actual Schema | Likely Classification |
|----------------|---------|---------------------|---------------|----------------------|
| `youtubeUploadTask` | `app/api/admin/youtube-sync/` | Prisma model | ❌ Not found | Uncertain |
| `libraryResource` | `app/api/mobile/library-resources/route.ts` | Prisma model | ❌ Not found | Uncertain |
| `sourceBook` | `app/api/mobile/source-books/route.ts` | Prisma model | ❌ Not found | Uncertain |
| `userId_roomId` | `app/api/mobile/rooms/[id]/join/route.ts` | `@@unique([...])` | Schema has `@@unique([roomId, userId])` | Renamed (order swapped) |
| `assignedTo` | `app/api/mobile/rooms/[id]/tasks/route.ts` | `StudyRoomTask` field | ❌ Not in model | Likely obsolete |
| `createdById` | `app/api/mobile/rooms/[id]/tasks/route.ts` | `StudyRoomTask` field | ❌ Not in model | Likely obsolete |
| `metadata` on `EngagementLog` | `app/api/mobile/account/route.ts` | `EngagementLogCreateInput` field | ❌ Not in model | Obsolete |
| `password` in `GenerateLinkParams` | `app/api/mobile/auth/register/route.ts` | Auth link params | ❌ Type mismatch | Obsolete code |
| `inviteCode` in `StudyRoomCreateInput` | `app/api/mobile/rooms/route.ts` | Required for create | ✅ Schema has it | Code bug (missing in create call) |
| `universityId` in `StudyRoomCreateInput` | `app/api/mobile/rooms/route.ts` | Required for create | ✅ Schema has it | Code bug (missing in create call) |

**For each mismatch, provide:**
- Exact error message from `npx tsc --noEmit`
- File path and line number
- Current code snippet (the failing line)
- Classification: `obsolete_code`, `missing_schema_entity`, `renamed_field`, `code_bug`, `uncertain_review_required`
- Recommended fix strategy

---

### B3: TypeScript Error Category Report

Group all 90 TS errors (across 51 files) into:

| Category | Count | Description |
|----------|-------|-------------|
| Prisma model not found | ~20 | Reference to model that doesn't exist |
| Prisma field not found | ~15 | Reference to field that doesn't exist on a model |
| Nullable check needed | ~15 | `possibly 'null'` / `string | null` → `string` |
| Type mismatch | ~10 | Incorrect type assignment |
| Duplicate properties | 2 | Same property declared twice |
| Missing required fields | ~8 | Required field not provided in create/update |
| Other | ~20 | Misc errors (Cloudinary, auth, etc.) |

**Expected output for each file:**
- File path
- Error count
- Error codes (TS\d+)
- Brief description
- Suggested fix category

---

## 5. Phase C: Awaiting Approval

These tasks **STOP** after Phase B. The reports above must be reviewed before proceeding.

---

### C1: Puter.js Relocation

- Only proceed if **all** Puter consumers are confirmed inside authenticated route groups
- Create `src/components/system/PuterScript.tsx` using `next/script`:
  ```tsx
  "use client";
  import Script from "next/script";

  export function PuterScript() {
    return (
      <Script
        src="https://js.puter.com/v2/"
        strategy="afterInteractive"
        onError={() => console.warn("[Puter] Failed to load")}
        onLoad={() => console.info("[Puter] Loaded")}
      />
    );
  }
  ```
- Remove `<script>` from `src/app/layout.tsx:317-323`
- Add `<PuterScript />` to each authenticated group layout
- If any public page needs Puter: keep in root layout OR create more granular strategy

---

### C2: TS Error Fixes (incl. Prisma Mismatches)

- Fix nullable checks (Category B) — easiest, ~30 min
- Fix duplicate properties (Category D) — trivially, 5 min
- Fix type mismatches (Category C) — moderate, ~1 hour
- Fix code bugs like missing fields (Category E) — moderate, ~1 hour
- Fix Prisma mismatches (Category A) — based on review:
  - **If `obsolete_code`**: Delete or fix the reference
  - **If `renamed_field`**: Update code to match schema
  - **If `missing_schema_entity`**: Report with recommendation — **DO NOT** modify schema without approval
  - **If `code_bug`**: Fix the code (add missing required field)

**Policy:**
- Default: fix code to match existing schema
- Only modify `schema.prisma` with clear evidence and explicit approval
- No migrations generated without approval

---

### C3: Remove Build Error Suppression

- Delete from `next.config.js:82-83`:
  ```js
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  ```
- Verify: `npx tsc --noEmit` returns 0
- Verify: `npx next build` completes with 0 errors

---

## 6. Risk Assessment Summary

| Task | Risk | Reason |
|------|------|--------|
| A1: useId() | 🟢 None | React 18+ stable API |
| A2: setTimeout cleanup | 🟢 None | Standard pattern |
| A3: AbortController | 🟢 Low | Well-known pattern, only affects unmount edge case |
| A4: themes.css import | 🟢 Low | Same import, different mechanism |
| A5: Lazy ReviewPromptModal | 🟢 Low | Dynamic import, js only, no layout shift |
| C1: Puter relocation | 🟡 Medium | Risk if any public page uses it |
| C2: TS error fixes | 🟠 High | Prisma schema changes could affect DB |
| C3: Remove suppression | 🟡 Medium | Must come after all errors are fixed |

---

## 7. Measurement Plan (Before/After)

| Metric | Before | After (target) | Who Measures |
|--------|--------|----------------|-------------|
| Landing page JS bundles | ~285KB to parse | ~270KB | Chrome DevTools |
| Puter.js network request | On every page | Only auth pages (Phase C) | Network tab |
| Supabase auth call on landing | Every visit | After scroll + 5s delay | Network tab |
| Unmounted setState warnings | Possible | None | Console |
| SVG ID collisions | Possible | Impossible | React DevTools |
| `@import` render blocking | Yes | No | Lighthouse |
| TS errors at build | 90 suppressed | 0 | `npx tsc --noEmit` |

---

## 8. File Change Summary

| File | Action |
|------|--------|
| `src/components/landing/ReviewModal.tsx` | Edit (useId, setTimeout ref) |
| `src/components/landing/ReviewPromptModal.tsx` | Edit (useId) |
| `src/hooks/useLazyFetch.ts` | Edit (AbortController) |
| `src/styles/globals.css` | Edit (remove @import) |
| `src/app/layout.tsx` | Edit (add themes.css import) |
| `src/components/landing/Testimonials.tsx` | Edit (dynamic import) |
| `src/components/system/PuterScript.tsx` | **Create** (Phase C) |
| `next.config.js` | Edit (Phase C) |
| 51 files with TS errors | Edit (Phase C) |
