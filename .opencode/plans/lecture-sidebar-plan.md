# Lecture Sidebar — MedOneX Chat Embedded Mode

## Goal
Replace `AIAssistantPanel` in the lecture page sidebar with `MedOneXChat` running in `embedded` mode, bringing all MedOneX Chat features (voice, super expert, file uploads, provider switching, etc.) to the lecture sidebar while adding lecture context to the AI system prompt.

## Constraints
- All pre-existing TS errors (8 total, in `ai/analyze-lecture`, `ai/chat`, `ai/enhance-post`, `telegram-worker`) must remain unchanged
- Zero new TS errors after every phase
- `MedOneXChat` itself (`src/components/ai/MedOneXChat.tsx`) must continue to work identically in full-page mode at `/ai-chat`
- The lecture page sidebar must not regress in functionality

---

## Phase 1 — Add lecture context support to `useDrQChat` hook

**Skill**: `senior-backend`, `supabase`
**File**: `src/hooks/useDrQChat.ts` (1636 lines)
**Baseline**: 0 TS errors in this file

### What to do

1. **Add `lectureContext` parameter to `sendMessage`**:
   - Line 966: Change `sendMessage` signature from:
     ```ts
     async (content: string, files: FileAttachment[] = [], replyToId?: string, webSearch?: boolean)
     ```
     to:
     ```ts
     async (
       content: string,
       files: FileAttachment[] = [],
       replyToId?: string,
       webSearch?: boolean,
       lectureContext?: {
         lectureId: string;
         lectureTitle: string;
         lectureContent?: string;
         selectedText?: string;
       }
     )
     ```

2. **Inject lecture context into the system prompt**:
   - Around line 1161, after the MedOneX Identity Context block ends (the `${systemPrompt}` template literal closes), add:
   ```ts
   // ─── Lecture Context Injection ───
   if (lectureContext) {
     systemPrompt += `\n\nYou are currently helping with the lecture: "${lectureContext.lectureTitle}" (ID: ${lectureContext.lectureId}).`;
     if (lectureContext.lectureContent) {
       systemPrompt += `\n\nHere is the lecture content for reference. Use it to answer questions about this lecture:\n${lectureContext.lectureContent.slice(0, 10000)}`;
     }
     if (lectureContext.selectedText) {
       systemPrompt += `\n\nThe user has selected the following text from the lecture:\n"${lectureContext.selectedText}"\nIf the user asks about this, prioritize answering based on this selected text in the context of the lecture.`;
     }
   }
   ```

3. **TypeScript check**:
   - The `lectureContext` parameter is optional -> all existing callers continue working
   - No new types needed (use inline type)

### ✅ Review after Phase 1
```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS"
```
- Expect: same 8 pre-existing errors, ZERO new errors
- Also grep for `lectureContext` in the file to verify it's wired

---

## Phase 2 — Add `embedded` lecture props to `MedOneXChat`

**Skill**: `senior-frontend`, `vercel-react-best-practices`
**File**: `src/components/ai/MedOneXChat.tsx` (2392 lines)
**Baseline**: 0 TS errors in this file

### What to do

#### A. Add Props Interface (line 47)
Change from:
```tsx
export function MedOneXChat() {
```
to:
```tsx
export function MedOneXChat({
  embedded = false,
  onClose,
  lectureId,
  lectureTitle,
  lectureContent,
  selectedText,
  activeSection,
  onClearSelectedText,
}: {
  embedded?: boolean;
  onClose?: () => void;
  lectureId?: string;
  lectureTitle?: string;
  lectureContent?: string;
  selectedText?: string;
  activeSection?: string;
  onClearSelectedText?: () => void;
}) {
```

#### B. Store lecture context in a ref for handleSend access
Add after the existing state declarations (around line 70-85):
```tsx
const lectureContextRef = useRef<{
  lectureId?: string;
  lectureTitle?: string;
  lectureContent?: string;
  selectedText?: string;
}>({});
lectureContextRef.current = { lectureId, lectureTitle, lectureContent, selectedText };
```

#### C. Modify `handleSend` (line 481-493)
Add `lectureContext` to the `sendMessage` call:
```tsx
const handleSend = () => {
  if ((!input.trim() && files.length === 0) || loading || files.some(f => f.loading)) return;
  const apiKey = settings.byokKeys[settings.activeProvider];
  if (!apiKey) {
    setShowApiAlert(true);
    return;
  }
  sendMessage(input, files, replyContext?.id, webSearchEnabled, {
    lectureId: lectureId!,
    lectureTitle: lectureTitle!,
    lectureContent,
    selectedText,
  });
  setInput("");
  setFiles([]);
  setReplyContext(null);
  scrollLastToTop();
};
```

#### D. Hide full-page chrome when `embedded=true`

For each of the following sections, wrap with `{!embedded && (...)}`:

| Section | Lines | What it is |
|---------|-------|-----------|
| Swipe zone (left edge touch) | 695-704 | Fixed mobile swipe area |
| Top bar (hamburger + global buttons) | 707-764 | Fixed top bar with questions/flashcards/resources buttons |
| Mobile sidebar (swipe) | 766-785 | MobileChatSidebar component |
| Desktop sidebar (threads panel) | 788-892 | Fixed left sidebar with threads list |
| Solid fill below mobile capsule | 1561-1564 | Bottom spacer for mobile |
| Mobile scroll-to-bottom button | 1567-1586 | Fixed scroll button for mobile |
| Mobile floating input | 1589-1876 | Floating input at bottom on mobile |

#### E. Modify main container margins (line 1084-1092)

Change from:
```tsx
<div className={cn(
  "flex flex-col flex-1 min-h-0 pb-24",
  "transition-[margin] duration-200 ease-out",
  showSidebar && "translate-x-[85vw]",
  "md:translate-x-0",
  showSidebar ? "md:ml-[260px]" : "md:ml-[52px]"
)} ref={mainRef}>
```

to:
```tsx
<div className={cn(
  "flex flex-col flex-1 min-h-0",
  embedded ? "" : "pb-24",
  !embedded && "transition-[margin] duration-200 ease-out",
  !embedded && showSidebar && "translate-x-[85vw]",
  "md:translate-x-0",
  !embedded && (showSidebar ? "md:ml-[260px]" : "md:ml-[52px]")
)} ref={mainRef}>
```

#### F. Convert desktop fixed input to inline (around line 1356)

Wrap the entire desktop input section in a conditional:
```tsx
{embedded ? (
  /* ── Embedded inline input ── */
  <div className="flex-shrink-0 border-t border-white/10 bg-[#050505]">
    {/* Selected text badge */}
    {selectedText && (
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10">
        <span className="text-[10px] font-medium text-primary truncate max-w-[250px]">
          &ldquo;{selectedText.slice(0, 80)}...&rdquo;
        </span>
        {onClearSelectedText && (
          <button onClick={onClearSelectedText} className="p-0.5 rounded hover:bg-primary/10">
            <X size={12} weight="bold" className="text-primary" />
          </button>
        )}
      </div>
    )}
    {/* Compact input row */}
    <div className="flex items-end gap-2 p-3">
      <textarea
        ref={inputRef}
        rows={1}
        value={input}
        onChange={e => startTransition(() => setInput(e.target.value))}
        onKeyDown={handleKeyDown}
        placeholder="Ask about this lecture..."
        className="flex-1 bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm resize-none max-h-32 text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
      />
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={handleSend}
        disabled={!input.trim() && files.length === 0}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white text-black hover:bg-gray-200 disabled:bg-white/10 disabled:text-gray-500"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  </div>
) : (
  /* ── Existing Desktop fixed input ── */
  <div className={cn("hidden md:block fixed bottom-0 z-max ...")}>
    /* existing code unchanged */
  </div>
)}
```

#### G. Add embedded header with lecture badge

Add this after the existing Top Bar section (after the `{!embedded && (...)}` that hides it). Around line 765 area:
```tsx
{embedded && (
  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#050505] shrink-0">
    <div className="flex items-center gap-2 min-w-0">
      <Sparkle size={18} weight="fill" className="text-primary shrink-0" />
      <span className="text-sm font-bold truncate text-white">MedOneX Expert</span>
      {lectureId && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary truncate max-w-[120px] border border-primary/20">
          {lectureTitle || "Lecture"}
        </span>
      )}
    </div>
    <div className="flex items-center gap-1">
      {onClose && (
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={16} weight="bold" />
        </button>
      )}
    </div>
  </div>
)}
```

#### H. Handle mobile input in embedded mode
In embedded mode, mobile and desktop are the same layout (a 420px sidebar). So we should also hide the mobile floating input when `embedded`:
```tsx
{!embedded && (
  <motion.div className="md:hidden fixed ...">
    /* existing mobile input */
  </motion.div>
)}
```

### ✅ Review after Phase 2
```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS"
```
- Expect: same 8 pre-existing errors
- Manual check: navigate to `/ai-chat` - must work exactly as before
- Build should pass: `npx next build`

---

## Phase 3 — Update `LectureExperienceClient.tsx`

**Skill**: `senior-frontend`
**File**: `src/components/content/LectureExperienceClient.tsx` (717 lines)
**Baseline**: 0 TS errors in this file

### What to do

#### A. Replace dynamic import of AIAssistantPanel (lines 20-23)
Change from:
```tsx
const AIAssistantPanel = dynamic(() => import("@/components/ai/AIAssistant").then(m => m.AIAssistantPanel), {
  loading: () => <div className="h-96 w-full animate-pulse bg-white/5 rounded-3xl" />,
  ssr: false
});
```
to:
```tsx
const MedOneXChat = dynamic(() => import("@/components/ai/MedOneXChat").then(m => m.MedOneXChat), {
  loading: () => <div className="h-96 w-full animate-pulse bg-white/5 rounded-3xl" />,
  ssr: false
});
```

#### B. Add `useLectureCache` import (around line 16)
```tsx
import { useLectureCache } from "@/hooks/useLectureCache";
```

#### C. Add hook call (after line 209, after `selectedText` state)
```tsx
const { lecture: cachedLecture } = useLectureCache(lecture.id);
```

#### D. Replace `AIAssistantPanel` usage (line 674)
Change from:
```tsx
<AIAssistantPanel embedded fullPage lectureId={lecture.id} lectureTitle={lecture.title} />
```
to:
```tsx
<MedOneXChat
  embedded
  lectureId={lecture.id}
  lectureTitle={lecture.title}
  lectureContent={cachedLecture?.content}
  selectedText={selectedText}
  activeSection={active}
  onClose={() => setSidebarOpen(false)}
  onClearSelectedText={() => setSelectedText("")}
/>
```

#### E. (Optional) Clean up unused imports
- If `AIAssistantPanel` was the only usage of `Sparkles` in the import, keep it - it's used in the toggle button (lines 297, 411)
- Remove `AIAssistantPanel` dynamic import only if we're replacing it with `MedOneXChat`

### ✅ Review after Phase 3
```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS"
```
- Expect: same 8 pre-existing errors
- Verify no unused import warnings

---

## Phase 4 — Create `lecture-prompt-builder.ts` (optional utility)

**Skill**: `clean-code`
**File**: `src/lib/lecture-prompt-builder.ts` (NEW - ~30 lines)

### What to do

Create a standalone utility function that builds a lecture-aware system prompt. This keeps the logic clean and testable:

```ts
export function buildLectureSystemPrompt(opts: {
  lectureTitle?: string;
  lectureContent?: string;
  selectedText?: string;
  activeSection?: string;
}): string {
  const parts: string[] = [
    "You are a medical AI tutor helping a student with their current lecture.",
  ];
  if (opts.lectureTitle) {
    parts.push(`You are helping with the lecture: "${opts.lectureTitle}".`);
  }
  if (opts.lectureContent) {
    parts.push(
      `Here is the lecture content for reference:\n${opts.lectureContent.slice(0, 10000)}`,
    );
  }
  if (opts.selectedText) {
    parts.push(
      `The user has selected this text:\n"${opts.selectedText}"\nPrioritize answering about this selection in the context of the lecture.`,
    );
  }
  if (opts.activeSection) {
    parts.push(
      `The current section/active tab is: ${opts.activeSection}. Use this to understand what part of the lecture the student is viewing.`,
    );
  }
  return parts.join("\n\n");
}
```

**Usage in Phase 1**: Replace the inline lecture context injection in `useDrQChat.ts` with a call to this function:
```ts
import { buildLectureSystemPrompt } from "@/lib/lecture-prompt-builder";
// ...
if (lectureContext) {
  systemPrompt += "\n\n" + buildLectureSystemPrompt(lectureContext);
}
```

### ✅ Review after Phase 4
```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS"
```
- Expect: same 8 pre-existing errors. No errors in new file.

---

## Final Verification (after all phases)

### 1. TypeScript check
```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS"
```
Must be exactly **8 errors**, all pre-existing:
- `src/app/api/v1/ai/analyze-lecture/route.ts(119,20)`
- `src/app/api/v1/ai/chat/route.ts(354,30)`
- `src/app/api/v1/ai/enhance-post/route.ts(18,37)`
- `telegram-worker/src/lib/ai.ts(57,25)`
- `telegram-worker/src/lib/ai.ts(269,13)`
- `telegram-worker/src/lib/ai.ts(284,13)`
- `telegram-worker/src/lib/start.ts(245,85)`
- `telegram-worker/src/lib/start.ts(250,99)`

### 2. Build check
```powershell
npm run build
```
OR
```powershell
npx next build
```
Must succeed with zero errors.

### 3. Full-page regression
- Visit `/ai-chat` - must look and work exactly as before (no missing chrome, all features intact, voice/SuperExpert/threads all present)

### 4. Sidebar regression
- Visit a lecture page - toggle sidebar open/close
- Must see MedOneX Chat in the sidebar with the embedded header showing "MedOneX Expert" + lecture badge
- Must be able to type and send messages
- Must be able to toggle sidebar closed (both via X button in embedded header and via the lecture page toggle)
- Must show file attachment, voice mode, provider buttons in the embedded input (if we keep them)

### 5. Lecture context verification
- Open browser DevTools
- Send a message from the lecture sidebar
- In the Network tab, check the request to the streaming provider
- Verify the `systemInstruction` includes the lecture title/content/selectedText

### 6. Selected text badge
- Select text on the lecture page
- Verify the selected text badge appears above the composer in the sidebar
- Click the X on the badge - verify it clears

### 7. Mobile responsiveness
- Test the lecture page on a narrow viewport (Chrome DevTools mobile mode)
- The sidebar should still render properly as an overlay

### 8. Cleanup
- If `AIAssistant.tsx` is no longer imported anywhere except `AIAssistant()` (the standalone export at line 207), we can leave it as-is
- If `AIAssistant` is truly unused, consider removing it, but not required

---

## Summary of changes

| File | Change | Lines changed |
|------|--------|---------------|
| `src/hooks/useDrQChat.ts` | Add `lectureContext` to `sendMessage`, inject into system prompt | +20 |
| `src/components/ai/MedOneXChat.tsx` | Add props, embedded mode (hide chrome, add header, inline input) | +80 |
| `src/components/content/LectureExperienceClient.tsx` | Replace AIAssistantPanel with MedOneXChat, wire lecture context | +12 |
| `src/lib/lecture-prompt-builder.ts` | NEW - utility for building lecture system prompt | +30 |

**Total**: ~142 lines changed across 4 files
