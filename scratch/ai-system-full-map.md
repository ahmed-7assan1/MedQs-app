# MedOneX AI System — Full Map

## Legend
| Term | Meaning |
|------|---------|
| **env** | Server env var (GEMINI_API_KEY, GEMINI_API_KEY_2..20, WORKER_JWT_SECRET) or site config `geminiKeyOverride` |
| **resolveBestKey()** | Resolves user→admin→site key for a provider (checks `personal*Key`, then `adminAiKeys`, then env) |
| **callGeminiWithRetry** | Uses `getGeminiApiKeys()` → user personal key → site config override → env vars (GEMINI_API_KEY..20). Round-robins with cooldown tracking |
| **generateAIReplyWithFallback** | Server-side fallback chain: siliconflow → proxy → huggingface → duckduckgo (free/no-cost tier) |
| **generateJsonWithFallback** | Wraps `generateAIReplyWithFallback` — same key resolution |
| **Puter.js** | Client-side third-party SDK (`window.puter`), no platform key |
| **client** | Direct fetch/API call from browser |
| **server** | Next.js API route (server-side) |

---

## 1. Medical AI Chat (Dr. Q Chat)

**Files:** `src/hooks/useDrQChat.ts` (client logic), `src/app/api/v1/ai/chat/route.ts` (server fallback)

**What it does:** Primary medical tutoring chat. Supports 14 AI providers with BYOK. Two modes:
- **BYOK mode:** Client-side direct calls from browser to the AI provider
- **Free tier:** Calls server API route which uses `generateAIReplyWithFallback` (env fallback chain)

**Providers:** ALL 14: gemini, openai, groq, openrouter, xai, anthropic, deepseek, siliconflow, mistral, cloudflare, huggingface, together, github, cerebras

**Models:** Varies by provider — each has a default model in `PROVIDER_CONFIGS`; user can override in settings

**Key source — BYOK mode:** User's keys from `localStorage` (`byokKeys`), stored via `updateSettings()`
**Key source — Free tier:** `generateAIReplyWithFallback` → env chain: siliconflow → proxy → huggingface → duckduckgo
**Key source — Server preferred provider:** Site config `aiPreferredProvider` → falls into free tier chain

**Side:** Both — BYOK = client, free tier = server
**Trigger:** `user_action` — send message button

**Special modes:**
- Smart Engine (consensus): calls secondary provider client-side for analysis, then primary for synthesis
- Super Expert: uses Gemini as orchestrator + N worker providers in parallel (generator/critic/formatter pipeline)

---

## 2. Puter AI Chat (Legacy/Secondary)

**File:** `src/hooks/useAIChat.ts`

**What it does:** Separate chat UI with different personas (Dr. Q Coach, Quiz Master, Flash Coach, Case Solver, Summarizer, Image Analyst). Runs entirely in-browser via Puter.js SDK.

**Providers:** Puter.js SDK (`puter.ai.chat`) — routes through Puter's own AI gateway. Groq models listed in UI selector but only work if Puter.js supports them.

**Key source:** Puter.js SDK (client-side, no platform key needed)
**Side:** Client
**Trigger:** `user_action` — send message

**Notes:** Stores threads in localStorage only (no server sync). Separate from Dr. Q chat threads.

---

## 3. Post Enhancement (Community Forum)

**File:** `src/app/api/v1/ai/enhance-post/route.ts`

**What it does:** Enhances forum post content — fixes grammar, makes it professional, adds emojis. Hardcoded to SiliconFlow.

**Providers:** SiliconFlow (hardcoded `provider = "siliconflow"`)
**Model:** `deepseek-ai/DeepSeek-R1` (default siliconflow model in `PROVIDERS`)

**Key source:** `resolveBestKey(user, "siliconflow")` → user's `personalSiliconFlowKey` → admin AI keys → site key. Then uses `fetchWithFallback()` which tries worker first, then `callAIDirectly()`.

**Side:** Server
**Trigger:** `user_action` — "enhance" button in forum post editor

---

## 4. Video Lecture Summary

**File:** `src/app/api/v1/ai/summary/route.ts`

**What it does:** Summarizes YouTube medical lecture videos into Arabic bullet points. Caches in Redis (24h). Rate-limited (10/hour).

**Providers:** gemini, openai, groq, openrouter, xai, anthropic, deepseek, siliconflow (via `generateAIReplyWithFallback`)

**Key source — BYOK path:** If user has `useCustomKey=true`, calls `resolveBestKey()` → personal key for their chosen provider
**Key source — Free path:** `generateAIReplyWithFallback` with `preferredProvider: "gemini"` → env keys via fallback chain

**Side:** Server
**Trigger:** `user_action` — click "summarize" on a video
**Timeout:** 60s

---

## 5. YouTube Transcript → Summary (Lecture Notes)

**File:** `src/app/api/v1/youtube/transcript/route.ts`

**What it does:** Fetches YouTube transcript, sends to Gemini for Arabic medical summary, saves result as lecture `notesMarkdown`.

**Providers:** Gemini only (hardcoded via `callGeminiWithRetry`)
**Model:** `gemini-1.5-flash`

**Key source:** `callGeminiWithRetry()` → env Gemini keys only (`GEMINI_API_KEY`, `GEMINI_API_KEY_2..20`, site config override). Does NOT check user's personal Gemini key.

**Side:** Server
**Trigger:** `user_action` — submit YouTube URL for transcription

**Notes:** Does NOT use user's personal Gemini key, unlike Atlas/Notebook routes which do pass it.

---

## 6. AI Anatomy Tutor (Atlas Bot Chat)

**File:** `src/app/api/v1/bot-chat/atlas/route.ts`

**What it does:** Chat interface within the Anatomy Atlas. Context-aware: injects structure/system data from DB into prompt.

**Providers:** Gemini only (via `callGeminiWithRetry`)
**Model:** `gemini-1.5-flash`

**Key source:** `callGeminiWithRetry(callFn, (session.user as any).personalGeminiKey)` — passes user's personal Gemini key first, falls back to env keys.

**Side:** Server
**Trigger:** `user_action` — send message in atlas bot chat

---

## 7. Atlas Quiz Generator

**File:** `src/app/api/v1/atlas/quiz/route.ts`

**What it does:** Generates 5 clinical MCQs from atlas structure/system data. Falls back to static questions if AI fails.

**Providers:** Gemini only (via `callGeminiWithRetry`)
**Model:** `gemini-1.5-flash`

**Key source:** `callGeminiWithRetry(callFn, persistentGeminiKey)` — user's personal Gemini key → env keys

**Side:** Server
**Trigger:** `user_action` — "generate quiz" on atlas page

---

## 8. Notebook AI (Summarize + Flashcards)

**File:** `src/app/api/v1/notebook/ai/route.ts`

**What it does:** Two actions on student notes: `summarize` (text summary) and `flashcards` (JSON array of front/back). Called from the notebook/notes UI.

**Providers:** Gemini only (via `callGeminiWithRetry`)
**Model:** `gemini-1.5-flash`

**Key source:** `callGeminiWithRetry(callFn, (session.user as any).personalGeminiKey)` — user's personal Gemini key → env keys

**Side:** Server
**Trigger:** `user_action` — click "summarize" or "flashcards" on notes

---

## 9. Essay Grading

**File:** `src/app/api/v1/questions/[id]/grade/route.ts`

**What it does:** Grades student's essay answer against `question.essayReference`. Returns score (0-100), feedback, strengths/weaknesses, missing key points. Only for `ESSAY` type questions.

**Providers:** Gemini only (via `callGeminiWithRetry`)
**Model:** `gemini-1.5-flash`

**Key source:** `callGeminiWithRetry(callFn, (session.user as any).personalGeminiKey)` — user's personal Gemini key → env keys

**Side:** Server
**Trigger:** `user_action` — submit essay answer

---

## 10. Question Explanation (AI-generated)

**Files:** `src/app/api/v1/questions/[id]/explain/route.ts` (web), `src/app/api/mobile/questions/[id]/explain/route.ts` (mobile)

**What it does:** Generates AI explanation for any question. Cached in Redis (1h). Persists to `question.aiExplanation` column. Admin-written explanation takes priority.

**Providers:** gemini, openai, anthropic, deepseek (via `generateExplanationWithMeta` → `generateJsonWithFallback`)

**Key source:** Site config `aiPreferredProvider` → `generateAIReplyWithFallback` (fallback chain). No `resolveBestKey()` call. Does NOT check user BYOK keys.

**Side:** Server
**Trigger:** `user_action` — click "explain" on a question

---

## 11. AI Question Extraction (Admin — File → MCQs)

**File:** `src/app/api/v1/ai/extract/route.ts`

**What it does:** Upload PDF/DOCX/image → OCR (Gemini multimodal + pdf-parse + Tesseract) → extract structured MCQs/essays via Gemini → validate questions via second AI pass. Admin-only (requires `requireAdminWriter`).

**Providers:** Gemini for OCR, then preferred provider for extraction/validation (via `extractQuestionsFromTextByModeWithMeta`/`validateQuestionsWithMeta` → `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key for the preferred provider. Falls back to env keys via `generateAIReplyWithFallback` if no key resolved.

**Side:** Server
**Trigger:** `admin_action` — upload file
**Timeout:** 60s

---

## 12. AI Suggestions (Admin — Question Details)

**File:** `src/app/api/v1/ai/suggest/route.ts`

**What it does:** Generates complete question details (choices, explanation, subject/lecture mapping) from a question body. Admin-only.

**Providers:** gemini, openai, anthropic, deepseek, groq, openrouter, xai (via `suggestQuestionDetailsWithMeta` → `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key for the preferred provider. Falls back to env keys via `generateAIReplyWithFallback`.

**Side:** Server
**Trigger:** `admin_action` — click "AI suggest" in question editor
**Rate limit:** 20/hour

---

## 13. AI Flashcard Generation (From pasted text)

**File:** `src/app/api/v1/ai/flashcards-from-text/route.ts`

**What it does:** Takes pasted medical text (80-12000 chars) → generates Anki-style flashcards. Student-accessible (not admin-only).

**Providers:** gemini, openai, anthropic, deepseek, groq, openrouter, xai (via `generateFlashcardsFromPastedTextWithMeta` → `generateJsonWithFallback`)

**Key source:** `resolveBestKey(user, effectiveProvider)` — checks user's BYOK keys first, then admin keys, then env. Passes resolved key to the function.

**Side:** Server
**Trigger:** `user_action` — paste text and request flashcards

---

## 14. AI Note Generation (From file)

**File:** `src/app/api/v1/ai/generate-notes/route.ts`

**What it does:** Upload PDF/DOCX/image → extract text (pdf-parse/OCR) → generate structured medical study notes with title. Admin-only.

**Providers:** gemini, openai, anthropic, deepseek, groq, openrouter, xai (via `generateStudyNotesWithMeta` → `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key for the preferred provider. Falls back to env keys via `generateAIReplyWithFallback`.

**Side:** Server
**Trigger:** `admin_action` — upload file
**Rate limit:** 5/hour

---

## 15. AI Study Plan Generator

**File:** `src/app/api/v1/study-assistant/generate-plan/route.ts`

**What it does:** Generates personalized 7-day weekly study schedule from user's `StudyAssistantProfile` (schedule, hobbies, daily minutes, worship, routines).

**Providers:** gemini, openai, anthropic, deepseek (via `generateWeeklyStudyPlanWithMeta` → `generateJsonWithFallback`)

**Key source:** `aiOptionsFromSiteProvider(site?.aiPreferredProvider)` → passes `{ preferredProvider: "gemini" }` (or undefined = auto) to `generateWeeklyStudyPlanWithMeta`. The underlying `generateJsonWithFallback` → `generateAIReplyWithFallback` uses env fallback chain (siliconflow→proxy→huggingface→duckduckgo). **No `resolveBestKey()` call. Does NOT check user BYOK or admin keys.**

**Side:** Server
**Trigger:** `user_action` — generate weekly plan

---

## 16. AI Study Week Review

**File:** `src/app/api/v1/study-assistant/week-review/route.ts`

**What it does:** Analyzes planned vs actual progress for the week. Returns feedback, learning gaps, and next-week focus areas.

**Providers:** gemini, openai, anthropic, deepseek (via `generateStudyWeekReviewWithMeta` → `generateJsonWithFallback`)

**Key source:** Same as #15 — `aiOptionsFromSiteProvider()` → `generateJsonWithFallback` → env fallback chain. **No `resolveBestKey()` call.**

**Side:** Server
**Trigger:** `user_action` — request week review

---

## 17. Admin: Lecture Enhancements (Notes + Flashcards)

**File:** `src/app/api/v1/admin/ai/lecture-enhance/route.ts`

**What it does:** Generates lecture notes (markdown) and/or flashcards from lecture metadata (title, subject, module). Writes results to DB. Admin-only.

**Providers:** gemini, openai, anthropic, deepseek (via `generateLectureEnhancementsWithMeta` → `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key for the preferred provider. Falls back to env keys.

**Side:** Server
**Trigger:** `admin_action` — click "generate notes/flashcards" on lecture

---

## 18. Admin: Lecture from File (PDF/DOCX → Lecture)

**File:** `src/app/api/v1/admin/ai/lecture-from-file/route.ts`

**What it does:** Upload file + URL → scrape URL content → process PDF/DOCX → generate complete lecture extras (overview cards, mnemonics, clinical cases, mind maps). Admin-only.

**Providers:** gemini, openai, groq, ... (via `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key or custom API key provided in form. Falls back to env keys.

**Side:** Server
**Trigger:** `admin_action` — upload file + URL
**Timeout:** 300s

---

## 19. Admin: Manus Agent (URL Scrape → Architecture)

**File:** `src/app/api/v1/admin/ai/manus-agent/route.ts`

**What it does:** Scrapes a URL, searches Open-I medical image database, generates structured curriculum architecture with sample flashcards and questions. Admin-only.

**Providers:** gemini, openai, groq, ... (via `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key or custom API key. Falls back to env keys.

**Side:** Server
**Trigger:** `admin_action` — submit URL
**Timeout:** 300s

---

## 20. Admin: AI Architect (Multi-file Curriculum Builder)

**File:** `src/app/api/v1/admin/ai/architect/route.ts`

**What it does:** Uploads multiple files → processes each (scrapes URLs from text) → generates full curriculum module/subject/lecture hierarchy with flashcards and sample questions. Admin-only.

**Providers:** gemini, openai, groq, ... (via `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key or custom API key. Falls back to env keys.

**Side:** Server
**Trigger:** `admin_action` — upload multiple files
**Complexity:** 280 (most complex route in codebase)

---

## 21. Admin: Colab/Telegram Content Analyzer

**File:** `src/app/api/v1/admin/colab/analyze/route.ts`

**What it does:** Pastes Telegram post URL → scrapes content via embed → extracts all links → AI classifies each resource (type, title, subject/module/lecture scope). SUPER_ADMIN only.

**Providers:** gemini, openai, groq, ... (via `generateJsonWithFallback`)

**Key source:** `generateJsonWithFallback(prompt, [] as any[])` with no custom options → env fallback chain. **No `resolveBestKey()` call.**

**Side:** Server
**Trigger:** `admin_action` — analyze Telegram link

---

## 22. Admin: Library Book Analyzer (PDF → Subject Extraction)

**File:** `src/app/api/v1/admin/library/book-analyze/route.ts`

**What it does:** Uploads medical textbook PDF → extracts text → AI determines title, author, subjects, and topics. Saves to `SourceBook` table. Admin-only.

**Providers:** gemini, openai, groq, ... (via `generateJsonWithFallback`)

**Key source:** `generateJsonWithFallback(prompt, fallback)` with no custom options → env fallback chain. **No `resolveBestKey()` call.**

**Side:** Server
**Trigger:** `admin_action` — upload PDF book
**Timeout:** 300s

---

## 23. Admin: Scrape Links → AI Architecture

**File:** `src/app/api/v1/ai/scrape-links/route.ts`

**What it does:** Takes text + optional URLs → scrapes each URL → generates curriculum architecture with sample flashcards and questions. Admin+ route.

**Providers:** gemini, openai, groq, ... (via `generateJsonWithFallback`)

**Key source:** Admin's `resolveBestKey()` key or custom key. Falls back to env keys.

**Side:** Server
**Trigger:** `admin_action` — submit text/URLs

---

## 24. Key Test Utility

**File:** `src/app/api/v1/user/test-key/route.ts`

**What it does:** Validates a user-provided API key against a specific provider's API. Returns `{ ok: true }` or error. No storage, no logging.

**Providers:** ALL 14: gemini, openai, groq, openrouter, anthropic, xai, siliconflow, cloudflare, huggingface, together, github, cerebras

**Key source:** User-provided in request body (transient — never stored)
**Side:** Server
**Trigger:** `user_action` — "test key" button in settings

---

## 25. Text-to-Speech (Edge TTS)

**File:** `src/app/api/tts/route.ts`

**What it does:** Converts text to spoken audio using Microsoft Edge TTS. Arabic voice default (`ar-EG-SalmaNeural`). Caches for 1h.

**Providers:** Microsoft Edge TTS (NOT an LLM — included for completeness)
**Key source:** None (no API key needed — uses edge-tts-universal library)
**Side:** Server
**Trigger:** `user_action` — play audio on text

---

## 26. Puter.js Image Generation

**File:** `src/hooks/useAIChat.ts` (`callPuterImage`)

**What it does:** Generates images from text prompts using Puter.js SDK.

**Providers:** Puter.js `puter.ai.txt2img`
**Key source:** Puter.js SDK (client-side, no platform key)
**Side:** Client
**Trigger:** `user_action` — generate image button

---

## 27. Puter.js Text-to-Speech

**File:** `src/hooks/useAIChat.ts`

**What it does:** Speaks AI response text aloud using Puter.js SDK.

**Providers:** Puter.js `puter.ai.txt2speech`
**Key source:** Puter.js SDK (client-side, no platform key)
**Side:** Client
**Trigger:** `user_action` — play audio button

---

# Shared/Duplicated Logic

## `callGeminiWithRetry` — Used by:
- Feature #5 (YouTube Transcript) — env keys only, no user personal key
- Feature #6 (Atlas Bot Chat) — with user personal key
- Feature #7 (Atlas Quiz) — with user personal key
- Feature #8 (Notebook AI) — with user personal key
- Feature #9 (Essay Grading) — with user personal key
- (Feature #4: also calls it indirectly via `generateAIReplyWithFallback` → `callGemini`)

## `generateJsonWithFallback` (wraps `generateAIReplyWithFallback`) — Used by:
- Feature #10 (Question Explanation) — via `generateExplanationWithMeta`
- Feature #11 (Question Extraction) — via `extractQuestionsFromTextByModeWithMeta`, `validateQuestionsWithMeta`
- Feature #12 (AI Suggestions) — via `suggestQuestionDetailsWithMeta`
- Feature #13 (Flashcard gen) — via `generateFlashcardsFromPastedTextWithMeta`
- Feature #14 (Note gen) — via `generateStudyNotesWithMeta`
- Feature #15 (Study Plan) — via `generateWeeklyStudyPlanWithMeta`
- Feature #16 (Week Review) — via `generateStudyWeekReviewWithMeta`
- Feature #17 (Lecture Enhance) — via `generateLectureEnhancementsWithMeta`
- Feature #18 (Lecture from File) — directly
- Feature #19 (Manus Agent) — directly
- Feature #20 (Architect) — directly
- Feature #21 (Colab Analyzer) — directly
- Feature #22 (Book Analyzer) — directly
- Feature #23 (Scrape Links) — directly

## `generateAIReplyWithFallback` — Used by:
- Feature #1 (Dr. Q Chat free tier) — primary fallback chain
- Feature #4 (Video Summary) — when user has BYOK key
- Feature #11 (Question Extraction) — for OCR assist
- Feature #14 (Note Gen) — for OCR assist
- Feature #10, #12-#23 (indirectly via `generateJsonWithFallback`)
- Also used as the underlying engine for all `*WithMeta` functions in `lib/gemini.ts`

## `resolveBestKey` — Used by:
- Feature #1 (Dr. Q Chat server route) — selects key when BYOK active
- Feature #3 (Post Enhancement) — siliconflow key
- Feature #4 (Video Summary) — when user has `useCustomKey=true`
- Feature #11 (Question Extraction) — admin key
- Feature #12 (AI Suggestions) — admin key
- Feature #13 (Flashcard gen) — user/admin key
- Feature #14 (Note Gen) — admin key
- Feature #17 (Lecture Enhance) — admin key
- Feature #18 (Lecture from File) — admin key
- Feature #19 (Manus Agent) — admin key
- Feature #20 (Architect) — admin key
- Feature #23 (Scrape Links) — admin key

## `getGeminiApiKeys` — Used by:
- `callGeminiWithRetry` (internal to that function)
- Feature #1 (Dr. Q Chat server route) — directly for preferredProvider resolution
- Feature #5 (YouTube Transcript) — directly
- Feature #6 (Atlas Bot Chat) — via `callGeminiWithRetry`
- Feature #7 (Atlas Quiz) — via `callGeminiWithRetry`
- Feature #8 (Notebook AI) — via `callGeminiWithRetry`
- Feature #9 (Essay Grading) — via `callGeminiWithRetry`

---

# Dependency Map

```
generateAIReplyWithFallback (env fallback chain: siliconflow → proxy → huggingface → duckduckgo)
├── generateJsonWithFallback (JSON wrapper)
│   ├── lib/gemini.ts functions (14 features)
│   │   ├── generateExplanationWithMeta → Feature #10
│   │   ├── suggestQuestionDetailsWithMeta → Feature #12
│   │   ├── extractQuestionsFromTextByModeWithMeta → Feature #11
│   │   ├── validateQuestionsWithMeta → Feature #11
│   │   ├── generateFlashcardsFromPastedTextWithMeta → Feature #13
│   │   ├── generateStudyNotesWithMeta → Feature #14
│   │   ├── generateWeeklyStudyPlanWithMeta → Feature #15
│   │   ├── generateStudyWeekReviewWithMeta → Feature #16
│   │   ├── generateLectureEnhancementsWithMeta → Feature #17
│   │   └── 4 more (lecture extras, essay grading, etc.)
│   └── Direct calls → Features #18, #19, #20, #21, #22, #23
└── Feature #1 (Dr. Q free tier), Feature #4 (summary)

callGeminiWithRetry (env Gemini keys pool)
├── Feature #5 (YouTube Transcript) — env only
├── Feature #6 (Atlas Bot Chat) — user key + env
├── Feature #7 (Atlas Quiz) — user key + env
├── Feature #8 (Notebook AI) — user key + env
└── Feature #9 (Essay Grading) — user key + env

resolveBestKey (user→admin→site key chain)
├── Feature #1 (Dr. Q chat server, BYOK path)
├── Feature #3 (Post Enhancement)
├── Feature #4 (Video Summary, BYOK path)
├── Features #11, #12, #13, #14, #17, #18, #19, #20, #23

client-side direct (browser fetches AI APIs)
├── Feature #1 (Dr. Q Chat BYOK mode) — streamGemini / streamOpenAICompat
└── Feature #2 (Puter AI Chat) — Puter.js SDK
```

---

# Inconsistencies

## 1. Two separate chat systems, no shared state
Dr. Q Chat (useDrQChat.ts) and Puter AI Chat (useAIChat.ts) are completely independent. Different thread storage (IndexedDB+Firestore vs localStorage only), different persona systems, different key management. A user's conversation in one is invisible in the other. No clear reason for maintaining both.

## 2. Two flashcard generators, different routes, different key sources
- **Feature #8 (Notebook AI `action=flashcards`):** Uses `callGeminiWithRetry` → Gemini only, user's personal Gemini key + env
- **Feature #13 (Flashcard gen from pasted text):** Uses `generateJsonWithFallback` → multi-provider, uses `resolveBestKey()` for key
Both produce front/back flashcards but use completely different AI pipelines.

## 3. Gemini key resolution inconsistency across similar features
- Features #6, #7, #8, #9 (Atlas bot, Atlas quiz, Notebook, Essay grading): pass `(session.user as any).personalGeminiKey` to `callGeminiWithRetry`
- Feature #5 (YouTube Transcript): calls `callGeminiWithRetry` without any personal key — env only
All are "submit content → Gemini processes it" features but #5 ignores the user's key.

## 4. YouTube vs Video Summary: different approaches to same problem
- Feature #5 (YouTube Transcript): hardcoded Gemini, Arabic summary, saves to `notesMarkdown`
- Feature #4 (Video Summary): multi-provider with BYOK support, Arabic summary, Redis cache
Both summarize YouTube lecture videos but Feature #5 is more deeply integrated (saves to DB) while Feature #4 is more modern (BYOK, fallback, caching).

## 5. `lib/gemini.ts` naming: not actually Gemini-only
Despite being named `gemini.ts`, most functions in this file (`generateExplanationWithMeta`, `generateStudyNotesWithMeta`, etc.) use `generateJsonWithFallback` which supports gemini, openai, anthropic, deepseek, groq, openrouter, xai, siliconflow. The file processes AI options passed from routes — it's provider-agnostic. The name is misleading.

## 6. `aiOptionsFromSiteProvider` limits providers
The function `aiOptionsFromSiteProvider()` in `site-ai-options.ts` only maps site config to gemini/openai/anthropic/deepseek. But `generateAIReplyWithFallback` supports many more (siliconflow, proxy, huggingface, duckduckgo). When routes use `aiOptionsFromSiteProvider`, they're artificially restricted to 4 providers even though the underlying engine supports more.

## 7. Some admin routes skip `resolveBestKey` entirely
Features #21 (Colab analyzer) and #22 (Book analyzer) call `generateJsonWithFallback` with no custom options — they rely entirely on the env fallback chain. Features #18, #19, #20 (similar admin tools) use `resolveBestKey()`. No clear reason for the difference.

## 8. Study plan/week review don't use user or admin keys
Features #15 and #16 pass `aiOptionsFromSiteProvider()` which returns the provider name only — no API key. The underlying `generateAIReplyWithFallback` runs on free-tier fallback chain. For a logged-in user, this means the platform potentially pays for these calls via free tier quotas instead of using the user's own BYOK key (if set), or even the admin's configured key.

---

# Gaps Confirmed (NEEDS VERIFICATION items resolved)

| # | Feature | Key path | Resolved |
|---|---------|----------|----------|
| 12 | AI Suggestions | `resolveBestKey(admin)` → `suggestQuestionDetailsWithMeta` → `generateJsonWithFallback` | ✅ Confirmed |
| 13 | Flashcard gen (pasted text) | `resolveBestKey(user, provider)` → `generateFlashcardsFromPastedTextWithMeta` → `generateJsonWithFallback` | ✅ Confirmed |
| 14 | Note gen (file) | `resolveBestKey(admin)` → `generateStudyNotesWithMeta` → `generateJsonWithFallback` | ✅ Confirmed |
| 15 | Study plan | `aiOptionsFromSiteProvider()` → `generateWeeklyStudyPlanWithMeta` → `generateJsonWithFallback` → env fallback chain. **No user/admin key used.** | ✅ Confirmed |
| 16 | Week review | Same as #15 — `aiOptionsFromSiteProvider()` → env fallback chain only. **No user/admin key used.** | ✅ Confirmed |
| 21 | Colab analyzer | `generateJsonWithFallback` with no custom options → env fallback chain. **No `resolveBestKey()` call.** | ✅ Confirmed |
| 22 | Book analyzer | Same as #21 — env fallback chain only. **No `resolveBestKey()` call.** | ✅ Confirmed |

---

# Raw Counts

- **Total features:** 27
- **Uses `resolveBestKey()`:** 12 features
- **Uses `callGeminiWithRetry`:** 5 features
- **Uses `generateJsonWithFallback` / `generateAIReplyWithFallback`:** 17 features
- **Env-only (no BYOK, no `resolveBestKey`):** 5 features (#5, #15, #16, #21, #22)
- **Client-side:** 3 features (#1 BYOK mode, #2, #26, #27)
- **Server-side:** 24 features
- **Admin-only:** 9 features
- **Student-facing:** 18 features
