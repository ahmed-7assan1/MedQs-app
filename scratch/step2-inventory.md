# Step 2: AI Feature Inventory

## Legend
- **Key source**: `env` = server env var / site config / admin key; `user_BYOK` = user's personal key from DB; `Puter.js` = client-side third-party SDK
- **Side**: `server` = Next.js API route; `client` = direct browser fetch
- **Trigger**: `user_action` = explicit button/message; `page_load` = fires on mount; `admin_action` = admin-triggered only

---

## 1. Medical AI Chat (Dr. Q Chat) — PRIMARY FEATURE
| | |
|---|---|
| **File** | `src/hooks/useDrQChat.ts` (client) + `src/app/api/v1/ai/chat/route.ts` (server) |
| **Providers** | ALL: gemini, openai, groq, openrouter, xai, anthropic, deepseek, siliconflow, mistral, cloudflare, huggingface, together, github, cerebras |
| **Key source** | **Dual path**: user_BYOK (client-side direct) or env/admin keys via server fallback chain (siliconflow→proxy→huggingface→duckduckgo) |
| **Side** | **Both**: BYOK users call providers directly from browser (client); free tier calls server API route |
| **Trigger** | `user_action` — send message button |
| **Notes** | Supports streaming, multi-agent super-expert mode, smart engine consensus. Full BYOK for all 14 providers. |

## 2. Puter AI Chat (Legacy / Secondary Chat)
| | |
|---|---|
| **File** | `src/hooks/useAIChat.ts` (client) |
| **Providers** | Puter.js (third-party SDK — routes through Puter's own AI gateway) + Groq models listed in UI |
| **Key source** | `Puter.js` SDK (client-side, no platform key) |
| **Side** | `client` — direct from browser |
| **Trigger** | `user_action` — send message |
| **Notes** | Separate chat UI from Dr. Q. Supports image generation via `puter.ai.txt2img`. TTS via `puter.ai.txt2speech`. Uses localStorage for thread persistence. |

## 3. Post Enhancement (Community Forum)
| | |
|---|---|
| **File** | `src/app/api/v1/ai/enhance-post/route.ts` |
| **Providers** | SiliconFlow (hardcoded) |
| **Key source** | `resolveBestKey()` → user BYOK → admin BYOK → site key. Uses `fetchWithFallback` which tries worker first, then direct. |
| **Side** | `server` |
| **Trigger** | `user_action` — "enhance post" button in forum editor |
| **Notes** | System prompt focuses on medical community post improvement. |

## 4. Video Lecture Summary
| | |
|---|---|
| **File** | `src/app/api/v1/ai/summary/route.ts` |
| **Providers** | gemini, openai, groq, openrouter, xai, anthropic, deepseek, siliconflow (via `generateAIReplyWithFallback`) |
| **Key source** | Prefers user_BYOK if `useCustomKey=true`, else env/admin keys via standard fallback chain |
| **Side** | `server` |
| **Trigger** | `user_action` — explicit "summarize" action on a video |
| **Notes** | Cached in Redis (24h). Rate-limited (10/hour). Produces Arabic summaries. 60s timeout. |

## 5. YouTube Transcript → Summary (Lecture Notes)
| | |
|---|---|
| **File** | `src/app/api/v1/youtube/transcript/route.ts` |
| **Providers** | Gemini only (hardcoded via `callGeminiWithRetry`) |
| **Key source** | `env` — Gemini API keys from env vars (GEMINI_API_KEY, GEMINI_API_KEY_2..20) + site config override. Does NOT use user BYOK. |
| **Side** | `server` |
| **Trigger** | `user_action` — submit YouTube URL for transcription |
| **Notes** | Fetches transcript via youtube-transcript library, then AI summarizes. Saves result as lecture `notesMarkdown`. Arabic output. |

## 6. AI Anatomy Tutor (Atlas Bot Chat)
| | |
|---|---|
| **File** | `src/app/api/v1/bot-chat/atlas/route.ts` |
| **Providers** | Gemini only (hardcoded via `callGeminiWithRetry`) |
| **Key source** | User's personal Gemini key first (`(session.user as any).personalGeminiKey`), falls back to env GEMINI_API_KEY. |
| **Side** | `server` |
| **Trigger** | `user_action` — chat message in anatomy atlas |
| **Notes** | Uses `callGeminiWithRetry`. Atlas-specific system prompt. Context injection from structure/system DB data. |

## 7. Atlas Quiz Generator
| | |
|---|---|
| **File** | `src/app/api/v1/atlas/quiz/route.ts` |
| **Providers** | Gemini only (via `callGeminiWithRetry`) |
| **Key source** | User's personal Gemini key first, falls back to env GEMINI_API_KEY. |
| **Side** | `server` |
| **Trigger** | `user_action` — generate quiz on atlas structure/system page |
| **Notes** | Generates 5 MCQs. Falls back to static questions if AI fails. Uses `gemini-1.5-flash`. |

## 8. Notebook AI (Summarize + Flashcards)
| | |
|---|---|
| **File** | `src/app/api/v1/notebook/ai/route.ts` |
| **Providers** | Gemini only (via `callGeminiWithRetry`) |
| **Key source** | User's personal Gemini key first, falls back to env GEMINI_API_KEY. |
| **Side** | `server` |
| **Trigger** | `user_action` — "summarize" or "flashcards" action on student notes |
| **Notes** | Two actions: `summarize` (returns text summary) and `flashcards` (returns JSON array of front/back pairs). |

## 9. Essay Grading
| | |
|---|---|
| **File** | `src/app/api/v1/questions/[id]/grade/route.ts` |
| **Providers** | Gemini only (via `callGeminiWithRetry`) |
| **Key source** | User's personal Gemini key first, falls back to env GEMINI_API_KEY. |
| **Side** | `server` |
| **Trigger** | `user_action` — submit essay answer |
| **Notes** | Grades against `question.essayReference`. Returns score, feedback, strengths/weaknesses JSON. |

## 10. Question Explanation (AI-generated)
| | |
|---|---|
| **File** | `src/app/api/v1/questions/[id]/explain/route.ts` (server) + `src/app/api/mobile/questions/[id]/explain/route.ts` (mobile) |
| **Providers** | gemini, openai, anthropic, deepseek (via `generateExplanationWithMeta` which uses `generateJsonWithFallback`) |
| **Key source** | Site config preferred provider → falls back to env/admin keys via `generateAIReplyWithFallback`. User BYOK not used. |
| **Side** | `server` |
| **Trigger** | `user_action` — click "explain" on a question |
| **Notes** | Cached in Redis (1h). Persists `aiExplanation` on Question record. Admin-written explanation takes priority. |

## 11. AI Question Extraction (Admin — PDF/DOCX/Image → MCQs)
| | |
|---|---|
| **File** | `src/app/api/v1/ai/extract/route.ts` |
| **Providers** | gemini (for OCR), then preferred provider for question extraction via `generateJsonWithFallback` |
| **Key source** | Admin's resolved key via `resolveBestKey()`. Admin-only route. |
| **Side** | `server` |
| **Trigger** | `admin_action` — upload file |
| **Notes** | Extracts questions from PDF/DOCX/images using OCR (Gemini multimodal) + pdf-parse fallback. Then extracts structured MCQs/essays. Validates via second AI pass. |

## 12. AI Suggestions (Question Details Generator — Admin)
| | |
|---|---|
| **File** | `src/app/api/v1/ai/suggest/route.ts` |
| **Providers** | gemini, openai, anthropic, deepseek (via `suggestQuestionDetailsWithMeta` → `generateJsonWithFallback`) |
| **Key source** | Site config preferred provider → `generateAIReplyWithFallback`. `NEEDS VERIFICATION` for exact key path. |
| **Side** | `server` |
| **Trigger** | `admin_action` — "AI suggest" when creating questions |
| **Notes** | Suggests choices, explanation, subject/lecture for a given question body. |

## 13. AI Flashcard Generation (From pasted text)
| | |
|---|---|
| **File** | `src/app/api/v1/ai/flashcards-from-text/route.ts` |
| **Providers** | gemini, openai, anthropic, deepseek (via `generateFlashcardsFromPastedTextWithMeta` → `generateJsonWithFallback`) |
| **Key source** | Site config preferred provider → `generateAIReplyWithFallback`. `NEEDS VERIFICATION` for exact key path. |
| **Side** | `server` |
| **Trigger** | `user_action` — paste text and request flashcards |
| **Notes** | User-facing feature (not admin-only based on route permissions check needed). |

## 14. AI Note Generation
| | |
|---|---|
| **File** | `src/app/api/v1/ai/generate-notes/route.ts` |
| **Providers** | gemini, openai, anthropic, deepseek (via `generateStudyNotesWithMeta` → `generateJsonWithFallback`) |
| **Key source** | Site config preferred provider → `generateAIReplyWithFallback`. `NEEDS VERIFICATION` for exact key path. |
| **Side** | `server` |
| **Trigger** | `user_action` — request structured notes from text |
| **Notes** | Student-facing. Produces formatted medical study notes. |

## 15. AI Study Plan Generator
| | |
|---|---|
| **File** | `src/app/api/v1/study-assistant/generate-plan/route.ts` |
| **Providers** | gemini, openai, anthropic, deepseek (via `generateWeeklyStudyPlanWithMeta` → `generateJsonWithFallback`) |
| **Key source** | `NEEDS VERIFICATION` — uses `generateJsonWithFallback`, likely env keys via fallback chain |
| **Side** | `server` |
| **Trigger** | `user_action` — generate weekly study plan |
| **Notes** | Generates personalized 7-day study schedule. |

## 16. AI Study Week Review
| | |
|---|---|
| **File** | `src/app/api/v1/study-assistant/week-review/route.ts` |
| **Providers** | gemini, openai, anthropic, deepseek (via `generateStudyWeekReviewWithMeta` → `generateJsonWithFallback`) |
| **Key source** | `NEEDS VERIFICATION` — likely same as study plan |
| **Side** | `server` |
| **Trigger** | `user_action` — request week review |
| **Notes** | Analyzes plan vs progress, returns feedback and gaps. |

## 17. Admin: Lecture Enhancements (Notes + Flashcards)
| | |
|---|---|
| **File** | `src/app/api/v1/admin/ai/lecture-enhance/route.ts` |
| **Providers** | gemini, openai, anthropic, deepseek (via `generateLectureEnhancementsWithMeta` → `generateJsonWithFallback`) |
| **Key source** | Admin's resolved key via `resolveBestKey()`. Admin-only route. |
| **Side** | `server` |
| **Trigger** | `admin_action` |
| **Notes** | Generates/updates lecture notes and flashcards from lecture metadata. |

## 18. Admin: Lecture from File (PDF/DOCX → Lecture Data)
| | |
|---|---|
| **File** | `src/app/api/v1/admin/ai/lecture-from-file/route.ts` |
| **Providers** | gemini, openai, groq, ... (via `generateJsonWithFallback`) |
| **Key source** | Admin's resolved key via `resolveBestKey()` or custom API key. Admin-only route. |
| **Side** | `server` |
| **Trigger** | `admin_action` — upload file |
| **Notes** | Scrapes URLs, processes PDF/DOCX, generates lecture extras (overview cards, mnemonics, clinical cases, mind maps). 300s timeout. |

## 19. Admin: Manus Agent (URL Scrape → Architecture)
| | |
|---|---|
| **File** | `src/app/api/v1/admin/ai/manus-agent/route.ts` |
| **Providers** | gemini, openai, groq, ... (via `generateJsonWithFallback`) |
| **Key source** | Admin's resolved key via `resolveBestKey()` or custom API key. Admin-only route. |
| **Side** | `server` |
| **Trigger** | `admin_action` — submit URL |
| **Notes** | Scrapes URL, searches Open-I medical images, generates structured curriculum architecture. |

## 20. Admin: AI Architect (Multi-file Curriculum Builder)
| | |
|---|---|
| **File** | `src/app/api/v1/admin/ai/architect/route.ts` |
| **Providers** | gemini, openai, groq, ... (via `generateJsonWithFallback`) |
| **Key source** | Admin's resolved key via `resolveBestKey()` or custom API key. Admin-only route. |
| **Side** | `server` |
| **Trigger** | `admin_action` — upload multiple files |
| **Notes** | Complex route (280 complexity). Processes multiple uploaded files, generates full curriculum architecture. |

## 21. Admin: Colab/Telegram Content Analyzer
| | |
|---|---|
| **File** | `src/app/api/v1/admin/colab/analyze/route.ts` |
| **Providers** | gemini, openai, groq, ... (via `generateJsonWithFallback`) |
| **Key source** | Env keys via standard fallback. SUPER_ADMIN only route. `NEEDS VERIFICATION` — no `resolveBestKey()` call visible. |
| **Side** | `server` |
| **Trigger** | `admin_action` — analyze Telegram post URL |
| **Notes** | Scrapes Telegram posts, extracts links and resources, AI-classifies them. Checks for duplicate lecture videos. |

## 22. Admin: Library Book Analyzer (PDF → Subject Extraction)
| | |
|---|---|
| **File** | `src/app/api/v1/admin/library/book-analyze/route.ts` |
| **Providers** | gemini, openai, groq, ... (via `generateJsonWithFallback`) |
| **Key source** | Env keys via standard fallback. Admin-only route. `NEEDS VERIFICATION` — no `resolveBestKey()` call visible. |
| **Side** | `server` |
| **Trigger** | `admin_action` — upload PDF book |
| **Notes** | Extracts text from PDF, AI determines book title/author/subjects/topics. 300s timeout. |

## 23. Admin: Scrape Links → AI Architecture
| | |
|---|---|
| **File** | `src/app/api/v1/ai/scrape-links/route.ts` |
| **Providers** | gemini, openai, groq, ... (via `generateJsonWithFallback`) |
| **Key source** | Admin's resolved key via `resolveBestKey()` or custom API key. Admin+ route. |
| **Side** | `server` |
| **Trigger** | `admin_action` — submit text/URLs |
| **Notes** | Scrapes provided URLs, extracts content, generates architecture with flashcards and sample questions. |

## 24. Key Test Utility
| | |
|---|---|
| **File** | `src/app/api/v1/user/test-key/route.ts` |
| **Providers** | ALL 14 providers: gemini, openai, groq, openrouter, anthropic, xai, siliconflow, cloudflare, huggingface, together, github, cerebras |
| **Key source** | User-provided key in request body (test only, no storage) |
| **Side** | `server` |
| **Trigger** | `user_action` — test key button in settings |
| **Notes** | Read-only validation. Sends a test request to each provider's API to verify key validity. No storage or logging. |

## 25. Text-to-Speech
| | |
|---|---|
| **File** | `src/app/api/tts/route.ts` |
| **Providers** | Edge-TTS (Microsoft Azure Cognitive Services — NOT an AI LLM provider) |
| **Key source** | None (uses edge-tts-universal library, no API key needed) |
| **Side** | `server` |
| **Trigger** | `user_action` — play audio on text |
| **Notes** | Not an LLM call. Included for completeness. Arabic voice default (`ar-EG-SalmaNeural`). |

## 26. Puter.js Image Generation
| | |
|---|---|
| **File** | `src/hooks/useAIChat.ts` (in `callPuterImage`) |
| **Providers** | Puter.js (third-party SDK) |
| **Key source** | `Puter.js` SDK (client-side) |
| **Side** | `client` — direct from browser |
| **Trigger** | `user_action` — generate image |
| **Notes** | Uses `puter.ai.txt2img`. Not an LLM but an AI-powered image generation feature. |

## 27. Puter.js Text-to-Speech
| | |
|---|---|
| **File** | `src/hooks/useAIChat.ts` |
| **Providers** | Puter.js (third-party SDK) |
| **Key source** | `Puter.js` SDK (client-side) |
| **Side** | `client` — direct from browser |
| **Trigger** | `user_action` — play audio |
| **Notes** | Uses `puter.ai.txt2speech`. Separate from server-side Edge TTS route. |

## Summary Count
- **Primary chat features**: 2 (Dr. Q Chat + Puter AI Chat)
- **Student-facing AI tools**: 8 (summary, transcript, atlas chat, atlas quiz, notebook, essay grading, explanation, flashcard gen, note gen, study plan, week review)
- **Admin AI tools**: 8 (extraction, suggestions, lecture enhance, lecture from file, manus agent, architect, colab analyzer, book analyzer, scrape links)
- **Utilities**: 2 (key test, post enhancement)
- **Non-LLM AI**: 2 (TTS, image gen via Puter.js)
- **Total**: ~22 distinct AI-powered features

## Key Observations
1. **Gemini is the backbone**: Most student-facing features hardcode Gemini (`callGeminiWithRetry`) and don't use the byok-resolver.
2. **Inconsistent key resolution**: Some routes use `resolveBestKey()` (admins), some use `callGeminiWithRetry` (Gemini env keys), some use `generateAIReplyWithFallback` (free tier fallback chain). Student's personal Gemini key only used in a few places.
3. **No single entry point**: Keys are resolved differently in every file — there's no centralized "get the best key for this feature" function.
4. **Admin features bypass BYOK**: Admin routes use `resolveBestKey()` which checks admin AI keys column. Student features don't use BYOK unless they're using Dr. Q Chat with custom keys enabled.
5. **`NEEDS VERIFICATION` items**: Features 12, 13, 14, 15, 16 need deeper code reading to confirm exact key path through `generateJsonWithFallback` → `generateAIReplyWithFallback`.
