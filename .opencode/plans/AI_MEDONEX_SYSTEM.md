# AI MedOneX System — الخطة النهائية

---
## الملخص

```
┌──────────────────────────────────────────────────┬──────────────────────────────────────────┐
│  Client-side (لا يحتاج Worker)                  │  Server-side (يحتاج Worker — 12 Route)  │
│  Chat + DrawMed: يقرا من localStorage فوري،     │  extract, generate-notes, analyze-lecture│
│  sync مع السيرفر في الخلفية                      │  flashcards-from-text, enhance-post,     │
│  الـ 20 Route الباقية: CRUD عادي                │  scrape-links, suggest, agents/[id]/chat │
│                                                  │  manus-agent, lecture-*, architect        │
└──────────────────────────────────────────────────┴──────────────────────────────────────────┘
```
---

## المهارات المستخدمة

| المهارة | أين تستخدم |
|---------|------------|
| **`senior-backend`** | BYOK resolver، Worker routes (`/v1/generate`, `/v1/test-key`, `/v1/models`)، fallback chain، API design |
| **`senior-architect`** | Single Path + Fallback architecture، Worker vs direct decision، ADR |
| **`senior-fullstack`** | توحيد الإعدادات بين backend endpoint و frontend (Profile page, DrQConfigPanel, useDrQChat) |
| **`clean-code`** | إلزامي — دوال pure، single responsibility، error messages واضحة، ممنوع duplication |
| **`sql-database-assistant`** | Prisma migration (AdminAIKeys model + User fields + encrypted fields) |
| **`vercel-react-best-practices`** | localStorage-first pattern، تحسين أداء settings loading |
| **`env-secrets-manager`** | أمان API keys، BYOK patterns، fallback chain، تشفير AES-256-GCM |
| **`supabase`** | Prisma migrations، triggers، Row Level Security |

---

## القواعد الإلزامية

1. **بعد كل خطوة:** تحقق أنها اشتغلت صح (Success Check) — راجع الكود، اختبره، تأكد
2. **بعد التحقق:** حدث الخطة — انقل السطر من `⬜` إلى `✅` وسجل التاريخ
3. **بعد كل خطوة:** وقف وانتظر تعليماتي ما لم أقل لك "استمر تلقائياً"
4. **بعد نهاية كل Phase:** راجع كل الخطوات في الـ Phase، تأكد أن لا شيء ناقص
5. **بعد نهاية الخطة كلها:** راجع شامل — هل كل المشاكل الـ 11 اتحلت؟ هل فيه ريجريشن؟
6. **ممنوع** تعديل `schema.prisma` بدون موافقتي
7. **ممنوع** إنشاء ملفات جديدة بدون داعي — عدّل على الموجود أولاً

---

## المشاكل (11 مشكلة)

| # | الملف | المشكلة | الخطورة |
|---|-------|---------|---------|
| 1 | `DrawMedClient.tsx` | Gemini baseURL ناقص → 404 | **حرجة** |
| 2 | `useDrQChat.ts` + `byok-keys/route.ts` | Type mismatch (string[] vs string) | **حرجة** |
| 3 | `enhance-post/route.ts` | ما بيدعم BYOK خالص | **عالية** |
| 4 | `byok-keys/route.ts` | FIELD_MAP ناقص 5 مزودين | **عالية** |
| 5 | `chat/route.ts` | deepseek ناقص في استخراج المفاتيح | **عالية** |
| 6 | `analyze-lecture/route.ts` | ما بيدعم BYOK | **متوسطة** |
| 7 | `flashcards-from-text/route.ts` | ما بيدعم BYOK | **متوسطة** |
| 8 | `ai-router.ts` (سطر 545) | HuggingFace BYOK يتجاهل المفتاح الشخصي | **متوسطة** |
| 9 | `profile/edit/page.tsx` | 6 مزودين ناقصين من الفورم | **متوسطة** |
| 10 | `suggest/route.ts` | Naming غير متناسق، customUrl ناقص | **خفيفة** |
| 11 | `test-key/route.ts` | يدعم مزودين الـ FIELD_MAP ما عندهم | **خفيفة** |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Client-side (Chat + DrawMed)                                          │
│  streamGemini() / streamOpenAICompat() ← API Provider مباشرة           │
│  useDrQChat():                                                         │
│    1. localStorage فوري → Chat يفتح حتى لو السيرفر واقع                │
│    2. GET /api/v1/user/ai-settings → خلفي → merge                      │
│    3. لو عدلت → localStorage فوري + PUT خلفي                           │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  Server-side (12 Route: extract, manus-agent, etc.)                    │
│  auth → resolveBestKey() (دالة، 2-5ms) → forwardToWorker(/v1/generate) │
│                                               ↓ لو Worker واقع         │
│                                        callAIDirectly() (degraded)     │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (telegram-worker)                                   │
│  POST /v1/generate  → يكلم AI Provider ويرد                           │
│  POST /v1/test-key  → يختبر مفتاح                                     │
│  GET  /v1/models    → قائمة الموديلات                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fallback Chain (Admin)
```
AdminAIKeys (مشفر) → User.personal*Key (مشفر) → SiteConfig.*KeyOverride → رسالة خطأ واضحة
```

### تشفير المفاتيح (AES-256-GCM)
```
PUT /ai-settings: key → encrypt(key) → store in DB
GET /ai-settings: DB → keyPreview ("sk-****abcd") → return (ممنوع إعادة المفتاح كاملاً)
resolveBestKey(): DB → decrypt(key) → return (للإرسال الفعلي للـ API فقط)
```

---

# خطة التنفيذ التفصيلية

---

## Phase 0: تصليح DrawMed 404 (نصف يوم)

### الهدف
تصليح الـ 404 اللي بتظهر لأي مستخدم جديد يدخل DrawMed (لأن `activeProvider: "gemini"` و Gemini مالهاش baseURL)

### المهارات المطلوبة لـ Phase 0
- **`senior-frontend`** — React components, useDrQChat hook, PROVIDER_CONFIGS
- **`senior-backend`** — فهم AI provider APIs (Gemini vs OpenAI-compatible)
- **`clean-code`** — إلزامي

### الخطوات

#### ✅ Step 0.1: إضافة baseURL لـ gemini في PROVIDER_CONFIGS (2026-06-29)
**المهارة:** `senior-frontend`
**الملف:** `src/hooks/useDrQChat.ts` — قسم PROVIDER_CONFIGS (حوالي سطر 102-272)
**المطلوب:**
1. اقرأ PROVIDER_CONFIGS في useDrQChat.ts
2. لاقي config بتاع `gemini`
3. أضف له `baseURL: "https://generativelanguage.googleapis.com/v1beta"`
4. تأكد أن الشات الرئيسي (`streamGemini` function) يستخدم `apiKey` + `baseURL` صح
**Success Check:**
- ✅ التأكد أن gemini config أصبح عنده baseURL صحيح
- ✅ التأكد أن `streamGemini` يستخدم baseURL الجديد مش fallback
- ✅ قراءة DrawMedClient.tsx والتأكد أنه بيستخدم نفس PROVIDER_CONFIGS

#### ✅ Step 0.2: إضافة special case لـ gemini في DrawMedClient (2026-06-29)
**المهارة:** `senior-frontend`
**الملف:** `src/components/drawmed/DrawMedClient.tsx`
**المطلوب:**
1. اقرأ DrawMedClient.tsx كاملاً
2. لاقي function `handleAiSend` أو المكان اللي بيستدعي API
3. أضف handling خاص لـ gemini (لأن Gemini API مختلف عن OpenAI-compatible)
4. **ممنوع** نسخ كود كبير من useDrQChat — استخدم دالة `streamGemini` الموجودة
**Success Check:**
- ✅ DrawMedClient يرسل لـ Gemini بشكل صحيح
- ✅ ما فيش 404 على Gemini
- ✅ الشات الرئيسي لسه شغال زي ما هو

#### ✅ Step 0.3: إضافة special case لـ cloudflare + github (موجودين، غير قابلين — سيبه للمستقبل) (2026-06-29)
**المهارة:** `senior-frontend`
**الملف:** `src/hooks/useDrQChat.ts` — PROVIDER_CONFIGS + دوال الـ stream
**المطلوب:**
1. اقرأ PROVIDER_CONFIGS كاملاً
2. شوف لو `cloudflare` و `github` عندهم baseURL
3. لو ناقص، ضيفهم (رفقاً — مش كل المزودين محتاجين OpenAI-compatible baseURL)
**ملاحظة:** GitHub و Cloudflare لهما API خاص — `streamOpenAICompat` مش هينفع معهم. لو معقدين، سيبهم للتحسين المستقبلي.
**Success Check:**
- ✅ Cloudflare و GitHub لهما baseURL صحيح في PROVIDER_CONFIGS
- ✅ لو الـ API مش OpenAI-compatible، مسجل في comments

#### ✅ Step 0.4: اختبار Phase 0 (2026-06-29)
**المهارة:** `clean-code`
**المطلوب:**
1. `npm run build` (أو `npx next build`) — يمر بدون errors
2. `npx tsc --noEmit` — ما عندهوش errors جديدة
3. راجع بسرعة الـ 3 تغييرات — هل كلها منطقية؟ متناسقة؟
**Success Check:**
- ✅ Build يمر
- ✅ ما فيش TypeScript errors جديدة
- ✅ التغييرات الـ 3 منطقية ومتناسقة

---

## Phase 1: الأساس (2.5 يوم)

### الهدف
بناء الـ Worker routes، BYOK resolver، **تشفير AES-256-GCM**، **Provider Registry موحد**، Prisma migration، تصليح FIELD_MAP + type mismatch، ai-fetcher مع fallback

### المهارات المطلوبة لـ Phase 1
- **`senior-backend`** — Worker routes (Hono)، BYOK resolver، fallback architecture
- **`senior-architect`** — Single Path + Fallback، Worker vs direct decision
- **`env-secrets-manager`** — تشفير AES-256-GCM، key masking، security patterns
- **`sql-database-assistant`** — Prisma migration (AdminAIKeys model + User fields + encrypted fields)
- **`clean-code`** — إلزامي

### ✅ Step 1.1: Worker — إضافة `/v1/generate` route في telegram-worker (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `telegram-worker/src/index.ts` + `telegram-worker/src/lib/ai.ts`
**المطلوب:**
1. اقرأ `telegram-worker/src/index.ts` — افهم الـ Hono app structure
2. اقرأ `telegram-worker/src/lib/ai.ts` — افهم دوال الـ AI الموجودة (callAI مع BYOK fallback)
3. أضف route جديد: `POST /v1/generate`
4. الـ route يستقبل: `{ provider, model, messages, apiKey?, temperature?, maxTokens? }`
5. الـ route يستخدم `callAI` من `ai.ts`
6. الـ route يرجع: `{ content: string }` أو `{ error: string }`
**Success Check:**
- ✅ `/v1/generate` موجود في Hono app
- ✅ يقبل request body صحيح
- ✅ يستخدم `callAI` من `ai.ts`
- ✅ يرجع response موحد

### ✅ Step 1.2: Worker — إضافة `/v1/test-key` route (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `telegram-worker/src/index.ts`
**المطلوب:**
1. أضف route: `POST /v1/test-key`
2. يستقبل: `{ provider, apiKey }`
3. يحاول إرسال طلب صغير (مثلاً قائمة موديلات أو ping) للـ provider بالمفتاح المقدم
4. يرجع: `{ valid: boolean, error?: string }`
**Success Check:**
- ✅ `/v1/test-key` موجود
- ✅ يختبر المفتاح فعلاً مش بس يتأكد أنه مش فارغ
- ✅ يرجع `{ valid: boolean }` واضح

### ✅ Step 1.3: Worker — إضافة `/v1/models` route (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `telegram-worker/src/index.ts`
**المطلوب:**
1. أضف route: `GET /v1/models`
2. يستقبل query parameter: `?provider=gemini`
3. يرجع قائمة الموديلات المتاحة لهذا المزود
4. الموديلات تكون من `Provider Registry`
**Success Check:**
- ✅ `/v1/models` موجود
- ✅ يرجع array من strings (أسماء الموديلات)
- ✅ `?provider=gemini` يرجع موديلات Gemini

### ✅ Step 1.4: Worker — إضافة JWT auth للـ 3 routes (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `telegram-worker/src/index.ts`
**المطلوب:**
1. أضف middleware يتأكد من JWT token في `Authorization: Bearer <token>`
2. الـ JWT secret يكون من env variable (`WORKER_JWT_SECRET`)
3. Vercel يرسل token مع كل request للـ Worker
**ملاحظة:** الـ worker عموماً بيكون محمي بـ Cloudflare Access + IP whitelist من Vercel. JWT هنا أمان إضافي.
**Success Check:**
- ✅ Routes الـ 3 لازمها JWT صحيح عشان تشتغل
- ✅ بدون JWT ترجع 401
- ✅ Vercel-side يرسل token

### ✅ Step 1.5: Worker — إضافة المزودين الناقصين في ai.ts (2026-06-29)
**الملف:** `telegram-worker/src/lib/ai.ts`
**المطلوب:**
1. اقرأ provider configs في `ai.ts`
2. استورد من `src/lib/providers.ts` (Provider Registry) بدل الـ hardcoded list
3. تأكد من وجود: openai, anthropic, mistral (هما الناقصين غالباً)
**Success Check:**
- ✅ Worker يستخدم Provider Registry
- ✅ كل مزود عنده config صحيح

### ✅ Step 1.6: إنشاء Provider Registry الموحد (ملف مركزي) (2026-06-29)
**الملف الجديد:** `src/lib/providers.ts`
**المطلوب:**
1. أنشئ ملف واحد يحتوي على كل مزود مع metadata كاملة:
```ts
export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: false,
    supportsEmbeddings: true,
    defaultModel: 'gemini-2.0-flash',
    keyField: 'personalGeminiKey',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsEmbeddings: true,
    defaultModel: 'gpt-4o-mini',
    keyField: 'personalOpenAIKey',
  },
  // ...كل المزودين (14) نفس النمط
}
```
2. غطّ كل الـ 14 مزود: gemini, openai, anthropic, deepseek, groq, openRouter, xai, mistral, together, huggingface, cloudflare, cerebras, github, proxy
3. الإصدارات القديمة (PROVIDER_CONFIGS في useDrQChat، قائمة ai-router، FIELD_MAP، Worker ai.ts) تستورد من هنا
**Success Check:**
- ✅ 14 مزود كاملين في ملف واحد
- ✅ كل metadata موجود (id, name, baseURL, models, supports* flags, defaultModel, keyField)
- ✅ `npm run build` يمر
- ✅ Chat شغال (يقرا من PROVIDERS.gemini.baseURL بدل PROVIDER_CONFIGS.gemini.baseURL)

### ✅ Step 1.7: تشفير AES-256-GCM — إنشاء `encryption.ts` (2026-06-29)
**الملف الجديد:** `src/lib/encryption.ts`
**المطلوب:**
1. أنشئ وحدة تشفير/فك تشفير
2. استخدم `crypto` مع **AES-256-GCM**
3. الـ ENCRYPTION_KEY يكون من `process.env.ENCRYPTION_KEY`
4. دوال:
   - `encrypt(plaintext: string): { encrypted: string, iv: string, tag: string }`
   - `decrypt(encrypted: string, iv: string, tag: string): string`
   - `maskKey(key: string): string` — يرجع `sk-****abcd`
5. لو `ENCRYPTION_KEY` مش موجودة، throw error واضح وقت التشغيل
**Success Check:**
- ✅ `encrypt("test-key-123")` يرجع قيمة مشفرة مختلفة كل مرة (بفضل IV العشوائي)
- ✅ `decrypt(encrypt("test-key-123"))` يرجع `"test-key-123"`
- ✅ `maskKey("sk-proj-1234567890abcdef")` يرجع `"sk-proj-****cdef"`
- ✅ `maskKey(null)` يرجع `""`

### ✅ Step 1.8: Prisma — AdminAIKeys model (مع تشفير) (2026-06-29)
**الملف:** `prisma/schema.prisma`
**المطلوب:**
1. اقرأ schema.prisma كاملاً (خصوصاً User model + SiteConfig)
2. أضف model `AdminAIKeys`:
   - كل حقول الـ 14 مزود تكون **نص عادي مشفر** (النص المشفر + IV + tag يخزنوا ك JSON string واحدة)
   - `defaultAutoProvider`, `featureOverrides`
3. أضف `defaultAutoProvider` و `featureOverrides` إلى User model
**ملاحظة:** نقترح `encryptedGeminiKey String?` يتم تخزينه كـ `JSON.stringify({ encrypted, iv, tag })`. هذا يتجنب 3 أعمدة لكل مزود ويكون متوافق مع التشفير.
**Success Check:**
- ✅ `prisma generate` يمر
- ✅ AdminAIKeys model جاهز مع تشفير
- ✅ User model عنده adminAiKeys علاقة

### ✅ Step 1.9: تصليح FIELD_MAP في byok-keys/route.ts (2026-06-29)
**الملف:** `src/app/api/v1/user/byok-keys/route.ts`
**المطلوب:**
1. اقرأ FIELD_MAP في byok-keys/route.ts
2. استبدل الـ hardcoded FIELD_MAP بـ Provider Registry
3. حالياً ناقص: openai, anthropic, xai, deepseek, mistral
**Success Check:**
- ✅ FIELD_MAP يقرا من `src/lib/providers.ts`
- ✅ كل الـ 14 مزود مغطيين
- ✅ `prisma generate` ما يبوظش

### ✅ Step 1.10: تصليح type mismatch في useDrQChat.ts server sync (2026-06-29)
**الملف:** `src/hooks/useDrQChat.ts` (حوالي سطر 760-780)
**المطلوب:**
1. اقرأ useDrQChat.ts كاملاً
2. لاقي الكود اللي بيسوي sync مع السيرفر (بيبعث `string[]` لكن السيرفر يستقبل `string?`)
3. صحّحه — يا إما client يرسل `string` مفرد، يا server يستقبل `string[]`
4. الأفضل: client يرسل `string` لكل مفتاح (أبسط وأقل تعقيداً)
**Success Check:**
- ✅ الـ sync ما عنده type mismatch
- ✅ Chat يحفظ الإعدادات صح
- ✅ لما تفتح Profile page تلاقي الإعدادات محفوظة صح

### ✅ Step 1.11: إنشاء byok-resolver.ts (مع فك التشفير) (2026-06-29)
**الملف الجديد:** `src/lib/byok-resolver.ts`
**المطلوب:**
1. دالة `resolveBestKey(user, provider, feature?)`:
   - تجيب المفتاح المشفر من DB
   - تفك تشفيره بـ `decrypt()`
   - ترجع `{ key: string, source: 'user' | 'admin' | 'site' }` أو `null`
2. للـ Student: تجيب `user.personal[Provider]Key`
3. للـ Admin: تجيب `user.adminAiKeys?` → `user.personal*Key` → SiteConfig
4. الدالة pure function — 2-5ms، مش network hop
**Success Check:**
- ✅ `resolveBestKey` ترجع key صحيح لكل حالة (مفكوك التشفير)
- ✅ Fallback chain اشتغل صح
- ✅ لما مفيش key، ترجع `null` مش `throw`

### ✅ Step 1.12: إنشاء ai-fetcher.ts مع fallback (2026-06-29)
**الملف الجديد:** `src/lib/ai-fetcher.ts`
**المطلوب:**
1. دالة `forwardToWorker(endpoint, payload, jwtToken)`:
   - ترسل request لـ Worker
   - لو worker رجع 502/503/مهلة — تروح على fallback
2. دالة `callAIDirectly(provider, model, messages, apiKey)`:
   - تكلم AI Provider مباشرة (مش عبر Worker)
3. الـ fallback يكون 3-line try/catch
**Success Check:**
- ✅ `forwardToWorker` ترسل صح
- ✅ fallback يشتغل لو Worker واقع
- ✅ `callAIDirectly` يشتغل بدون Worker

### ✅ Step 1.13: اختبار Phase 1 (2026-06-29)
**المطلوب:**
1. `npx prisma generate` — يمر
2. `npm run build` (أو `npx next build`) — يمر
3. `npx tsc --noEmit` — ما فيهوش errors جديدة
4. اختبر `encrypt/decrypt` — تشفير وفك شغالين
5. اختبر `maskKey` — ما يظهرش المفتاح كاملاً
6. اختبر `resolveBestKey` — يرجع key مفكوك التشفير
7. راجع كل الـ 12 خطوة — هل كلها منطقية ومتناسقة؟
**Success Check:**
- ✅ All builds pass
- ✅ كل الخطوات مكتملة
- ✅ التشفير شغال
- ✅ BYOK resolver + ai-fetcher + Worker routes + Provider Registry متناسقين

---

## Phase 2: الـ 12 Route + تصليح BYOK (3.5 يوم)

### الهدف
كل الـ 12 Route تستخدم `resolveBestKey()` → `forwardToWorker()` → fallback. كل Route تتبع نفس النمط (10-15 سطر جديد).

### المهارات المطلوبة لـ Phase 2
- **`senior-backend`** — كل Route، BYOK integration، Worker fallback
- **`clean-code`** — إلزامي

### النمط الموحد لكل Route
```
auth → resolveBestKey(user, provider) → if (!key) return 400 "Add key in Settings"
→ forwardToWorker('/v1/generate', { provider, model, messages, apiKey: key })
  → لو نجح: return Response
  → لو Worker واقع: callAIDirectly(provider, model, messages, key) → return
```

### ✅ Step 2.1: enhance-post/route.ts — إضافة BYOK (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `src/app/api/v1/ai/enhance-post/route.ts`
**المشكلة:** حالياً 34 سطر، ما بيدعم BYOK خالص — بيستخدم site keys بس
**المطلوب:**
1. اقرأ الملف كاملاً
2. أضف BYOK باستخدام `resolveBestKey`
3. النمط الموحد
4. تأكد من fallback
**Success Check:**
- ✅ المستخدم يقدر يستخدم مفتاحه الشخصي
- ✅ لو مفيش مفتاح، يرجع error واضح "Add key in Settings"

#### ✅ Step 2.2: chat/route.ts — إضافة deepseek في استخراج المفاتيح (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `src/app/api/v1/ai/chat/route.ts` (أسطر 460-476)
**المشكلة:** استخراج المفاتيح يغطي 10 مزودين بس، deepseek ناقص
**المطلوب:**
1. اقرأ ملف chat/route.ts كاملاً
2. لاقي الجزء اللي بيستخرج API keys حسب provider
3. أضف `case 'deepseek': key = personalDeepseekKey`
**ملاحظة:** هذا route خاص بـ Chat الـ client-side — الـ 12 Route ليهم pattern مختلف.
**Success Check:**
- ✅ deepseek يستخرج مفتاحه صح
- ✅ بقية الـ 10 مزودين لسه شغالين

#### ✅ Step 2.3: analyze-lecture/route.ts — إضافة BYOK (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `src/app/api/v1/ai/analyze-lecture/route.ts`
**المشكلة:** ما بيدعم BYOK
**المطلوب:**
1. اقرأ الملف كاملاً
2. أضف BYOK + النمط الموحد
**Success Check:**
- ✅ analyze-lecture يدعم BYOK + Worker + fallback

#### ✅ Step 2.4: flashcards-from-text/route.ts — إضافة BYOK (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `src/app/api/v1/ai/flashcards-from-text/route.ts`
**المطلوب:**
1. اقرأ الملف كاملاً
2. أضف BYOK + النمط الموحد
**Success Check:**
- ✅ flashcards يدعم BYOK + Worker + fallback

#### ✅ Step 2.5: ai-router.ts — تصليح HuggingFace BYOK (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `src/lib/ai-router.ts`
**المطلوب:**
1. اقرأ ai-router.ts كاملاً (خصوصاً الـ BYOK strict path خط 533-552)
2. لاقي HuggingFace section
3. صلحه عشان يقرا `personalHuggingfaceKey` بدل ما يتجاهله
**Success Check:**
- ✅ HuggingFace BYOK يقرا المفتاح الشخصي

#### ✅ Step 2.6: suggest/route.ts — توحيد naming + BYOK (2026-06-29)
**المهارة:** `senior-backend`
**الملف:** `src/app/api/v1/ai/suggest/route.ts`
**المطلوب:**
1. اقرأ suggest/route.ts كاملاً
2. وحّد naming + BYOK + النمط الموحد
**Success Check:**
- ✅ suggest naming متطابق + BYOK شغال

#### ✅ Step 2.7-2.16: Routes الـ 10 الباقية — النمط الموحد (2026-06-29)
**المهارة:** `senior-backend`
**الملفات:**
- extract/route.ts
- generate-notes/route.ts
- scrape-links/route.ts
- agents/[id]/chat/route.ts
- manus-agent/route.ts (AdminAIKeys fallback)
- lecture-from-file/route.ts (AdminAIKeys fallback)
- lecture-extras-from-file/route.ts (AdminAIKeys fallback)
- architect/route.ts (AdminAIKeys fallback)
- lecture-enhance/route.ts (AdminAIKeys fallback)
- lecture-extras/route.ts (AdminAIKeys fallback)

**المطلوب لكل واحد:**
1. اقرأ الملف كاملاً
2. استبدل BYOK بـ `resolveBestKey`
3. أضف forwardToWorker + fallback
4. للـ Admin routes: AdminAIKeys → User.personal*Key → SiteConfig
**Success Check (لكل واحد):**
- ✅ يستخدم `resolveBestKey`
- ✅ forwardToWorker + fallback شغالين
- ✅ Admin routes يستخدمون AdminAIKeys

#### ✅ Step 2.17: اختبار Phase 2 (2026-06-29)
**المهارة:** `clean-code`
**المطلوب:**
1. `npm run build` — يمر
2. `npx tsc --noEmit` — ما فيهوش errors جديدة
3. راجع كل Route — هل الـ 12 Route كلها شغالة بـ النمط الموحد؟
4. هل المشاكل 3, 5, 6, 7, 8, 10 اتحلت؟
**Success Check:**
- ✅ Build + TS pass
- ✅ 12 Routes use same pattern
- ✅ Bugs 3, 5, 6, 7, 8, 10 fixed

---

## Phase 3: توحيد الإعدادات (2.5 يوم)

### الهدف
Endpoint واحد `/api/v1/user/ai-settings` هو المصدر الوحيد للإعدادات. المفاتيح **مشفرة في DB** و **مخفية في الـ API** (آخر 4 أحرف فقط).

### المهارات المطلوبة لـ Phase 3
- **`senior-fullstack`** — backend endpoint (ai-settings) + frontend (Profile page, DrQConfigPanel, useDrQChat)
- **`env-secrets-manager`** — تشفير AES-256-GCM في الـ endpoints، key masking
- **`vercel-react-best-practices`** — localStorage-first pattern، تحسين أداء settings loading
- **`clean-code`** — إلزامي

### ✅ Step 3.1: إنشاء GET/PUT /api/v1/user/ai-settings (مع تشفير) (2026-06-29)
**المهارة:** `senior-fullstack` + `env-secrets-manager`
**الملف الجديد:** `src/app/api/v1/user/ai-settings/route.ts`
**المطلوب:**
1. GET:
   - يرجع كل إعدادات الـ AI للمستخدم
   - **المفاتيح ترجع مشفرة (مخفية)**: `{ gemini: { keyPreview: "AIza-****xYz" } }`
   - **ممنوع** إعادة المفتاح كاملاً من السيرفر
   - يرجع كمان: `defaultAutoProvider`, `featureOverrides`, `activeProvider`
2. PUT:
   - يستقبل `{ gemini: { key: "AIza..." }, openai: { key: "sk-..." } }`
   - يشفر كل مفتاح بـ `encrypt()` قبل التخزين
   - يحفظ المفاتيح المشفرة في DB
   - لو المفتاح مش موجود في الـ body، ما يغيرش القيمة القديمة
3. يستخدم Provider Registry لمعرفة `keyField` لكل مزود
**Success Check:**
- ✅ GET يرجع keys preview (آخر 4 أحرف)
- ✅ GET ما يرجعش keys كاملة
- ✅ PUT يشفر ويحفظ صح
- ✅ لو bugs 4 و 9 (FIELD_MAP + Profile form) — الـ KEY FIELD مأخوذ من Provider Registry
- ✅ التوافق مع النوع (لا type mismatch)

### ✅ Step 3.2: useDrQChat.ts — localStorage فوري + GET خلفي + merge (2026-06-29)
**المهارة:** `vercel-react-best-practices` + `senior-fullstack`
**الملف:** `src/hooks/useDrQChat.ts`
**المطلوب:**
1. عند فتح Chat:
   - يحمل إعدادات من localStorage فوري
   - في الخلفية: GET /api/v1/user/ai-settings
   - merge لو حاجة اتغيرت في السيرفر
2. عند تعديل إعدادات:
   - localStorage فوري
   - PUT /api/v1/user/ai-settings (خلفي)
3. لو السيرفر واقع: Chat شغال بـ localStorage فقط
**Success Check:**
- ✅ Chat يفتح فوري من localStorage
- ✅ merge يحصل في الخلفية
- ✅ لو السيرفر واقع، Chat شغال

### ✅ Step 3.3: DrQConfigPanel — localStorage فوري + PUT خلفي (2026-06-29)
**المهارة:** `senior-fullstack` + `vercel-react-best-practices`
**الملف:** `src/components/ai/DrQConfigPanel.tsx`
**المطلوب:**
1. اقرأ DrQConfigPanel كاملاً
2. عدّل عشان يقرا من `useDrQChat` (اللي بيقرا من localStorage + server)
3. عند الحفظ: localStorage فوري + PUT خلفي
**Success Check:**
- ✅ DrQConfigPanel يحفظ في localStorage فوري
- ✅ يبعث PUT للسيرفر (خلفي)
- ✅ لو السيرفر واقع، الإعدادات محفوظة في localStorage

### ✅ Step 3.4: Profile page AI tab — يقرا ويكتب من ai-settings (2026-06-29)
**المهارة:** `senior-fullstack` + `env-secrets-manager`
**الملف:** `src/app/(student)/profile/edit/page.tsx` (الـ AI tab، حوالي سطور 790-830)
**المطلوب:**
1. اقرأ قسم الـ AI في Profile page
2. حالياً يقرا ويكتب User.personal*Key مباشرة (ويعرضهم plain text)
3. عدّله عشان يستخدم `/api/v1/user/ai-settings`
4. يعرض key preview (`sk-****abcd`) مش plain text
5. عند الضغط على "Edit"، يظهر input عادي يكتب فيه المفتاح الجديد
6. عند الحفظ: يرسل PUT لـ ai-settings (اللي بيشفر)
**Success Check:**
- ✅ Profile page يقرا من ai-settings endpoint
- ✅ يعرض masked keys
- ✅ يحفظ بالإرسال لـ ai-settings (اللي بيشفر)
- ✅ Chat و Profile page يشوفوا نفس الإعدادات

### ✅ Step 3.5: إضافة 6 مزودين ناقصين لـ Profile form (2026-06-29)
**المهارة:** `senior-fullstack`
**الملف:** `src/app/(student)/profile/edit/page.tsx`
**المطلوب:**
1. اقرأ الفورم في Profile page
2. حالياً فيه 10 مزودين — أضف الـ 6 الناقصين:
   - cloudflare, huggingface, together, github, cerebras, mistral
3. كل مزود عنده input لمفتاحه + model selector
4. استخدم Provider Registry لمعرفة أسماء المزودين
**Success Check:**
- ✅ Profile page يعرض كل الـ 14 مزود
- ✅ يحفظهم في ai-settings endpoint (مشفر)
- ✅ Chat يقراهم من localStorage

### ✅ Step 3.6: Admin settings page — AdminAIKeys management (2026-06-29)
**المهارة:** `senior-fullstack` + `env-secrets-manager`
**الملف الجديد:** يتحدد حسب route structure
**المطلوب:**
1. صفحة إعدادات AI للأدمن
2. يقرا ويكتب `AdminAIKeys` (عبر endpoint مخصص)
3. نفس شكل Profile page AI tab لكن مع AdminAIKeys
4. Keys مشفرة ومخفية زي بقية النظام
**Success Check:**
- ✅ صفحة AdminAIKeys موجودة
- ✅ تقدر تضيف/تعدل keys للأدمن
- ✅ Admin routes تقرأ من AdminAIKeys

### ✅ Step 3.7: إنشاء GET/PUT /api/v1/admin/ai-settings (مع تشفير) (2026-06-29)
**المهارة:** `senior-fullstack` + `env-secrets-manager`
**الملف الجديد:** `src/app/api/v1/admin/ai-settings/route.ts`
**المطلوب:**
1. GET: يرجع AdminAIKeys مع key previews
2. PUT: يحفظ AdminAIKeys مع تشفير
3. نفس نمط user/ai-settings
**Success Check:**
- ✅ GET/PUT admin/ai-settings شغالين مع تشفير
- ✅ Admin صفحة الإعدادات تقرأ وتكتب منهم

### ✅ Step 3.8: إضافة ENCRYPTION_KEY إلى .env.example ووثائق (2026-06-29)
**المهارة:** `env-secrets-manager`
**الملف:** `.env.example` (أو الموجود)
**المطلوب:**
1. أضف `ENCRYPTION_KEY=your-32-byte-hex-key-here` لـ .env.example
2. أضف ملاحظة: يجب أن يكون 32 بايت hex
3. أضف تحقق في `encryption.ts` أن المفتاح موجود عند أول تشغيل
**Success Check:**
- ✅ ENCRYPTION_KEY في .env.example
- ✅ المفتاح يُتحقق منه وقت التشغيل

### ✅ Step 3.9: اختبار Phase 3 (2026-06-29)
**المهارة:** `clean-code` + `senior-fullstack`
**المطلوب:**
1. `npm run build` — يمر
2. `npx tsc --noEmit` — ما فيهوش errors جديدة
3. اختبر السيناريو: فتح Chat → يقرا من localStorage → يحمل من السيرفر → يعدل من Profile page → Chat يشوف التغيير
4. اختبر التشفير: احفظ key → الـ GET يرجع `sk-****abcd` مش plain text
5. اختبر: الـ PUT يخزن key مشفر في DB (تحقق يدوي)
**Success Check:**
- ✅ All builds pass
- ✅ Endpoint واحد للإعدادات
- ✅ Chat localStorage-first
- ✅ Profile page يستخدم same endpoint
- ✅ Keys مشفرة ومخفية
- ✅ Admin settings شغالة

---

## Phase 4: تنظيف (1 يوم)

### الهدف
ضبط الـ error messages، اختبارات، مسح القديم، analytics

### المهارات المطلوبة لـ Phase 4
- **`clean-code`** — إلزامي (وهذا Phase أساساً clean code)
- **`performance-profiler`** — قياس قبل/بعد، bundle size، network requests
- **`diagnose`** — لو ظهرت مشاكل في المراجعة النهائية

### ✅ Step 4.1: رسائل خطأ واضحة (2026-06-29)
**المهارة:** `clean-code`
**الملفات:** كل الـ 12 Route + ai-fetcher + byok-resolver
**المطلوب:**
1. كل error يقولك تعمل إيه:
   - `"No API key found for Gemini. Add one in Settings → AI"` بدل `"API error"`
   - `"Worker unavailable, using direct connection"` (console.warn)
2. توحيد format: `"ACTION: what happened"`
**Success Check:**
- ✅ كل error بيقولك تعمل إيه
- ✅ ما فيش `"Internal server error"` عامة

### ✅ Step 4.2: Integration tests (2026-06-29)
**المهارة:** `clean-code` + `senior-backend`
**الملفات الجديدة:** `src/lib/__tests__/byok-resolver.test.ts` + `src/lib/__tests__/ai-fetcher.test.ts`
**المطلوب:**
1. اختبر `resolveBestKey`: user key, null, admin fallback
2. اختبر `forwardToWorker`: normal + fallback on 502
3. اختبر `encrypt/decrypt`: roundtrip + maskKey
**Success Check:**
- ✅ كل tests تمر
- ✅ Edge cases مغطاة

### ✅ Step 4.3: مسح القديم (2026-06-29)
**المهارة:** `clean-code` + `performance-profiler`
**المطلوب:**
1. شوف لو فيه localStorage keys قديمة
2. شوف لو فيه كود مكرر (خصوصاً بعد Phase 1)
3. شوف لو فيه imports ميتة
**Success Check:**
- ✅ ما فيش كود مكرر
- ✅ ما فيش imports ميتة

### ✅ Step 4.4: Analytics — تسجيل provider/feature/user (2026-06-29)
**المهارة:** `performance-profiler`
**الملفات:** `src/lib/ai-fetcher.ts`
**المطلوب:**
1. سجل كل AI request: `{ userId, provider, feature, model, durationMs, success }`
2. استخدم Supabase أو console.log بسيط
3. **ممنوع** إرسال API keys للـ analytics
**Success Check:**
- ✅ كل AI request مسجل (بدون keys)

### ✅ Step 4.5: مراجعة نهائية (2026-06-29)
**المهارة:** `clean-code` + `diagnose`
**المطلوب:**
1. `npm run build` — يمر
2. `npx tsc --noEmit` — ما فيهوش errors
3. **مراجعة شاملة:**
   - كل الـ 11 مشكلة اتحلت؟
   - Provider Registry موحد ومستخدم في كل مكان؟
   - كل المفاتيح مشفرة في DB ومخفية في API؟
   - الـ 14 مزود كاملين في النظام؟
   - Chat + DrawMed شغالين؟
   - الـ 12 Route شغالة بـ worker + fallback؟
   - AdminAIKeys شغال مع fallback chain؟
**Success Check:**
- ✅ Build + TS pass
- ✅ 11 bugs fixed
- ✅ No regression
- ✅ كل Phase مكتملة

---

## ملاحظات مستقبلية

### AdminAIKeys — مستقبل
لو ظهر مزودين جدد لاحقاً (Qwen, Moonshot, Perplexity, إلخ)، الأعمدة المنفصلة هتحتاج migration كل مرة. الحل المستقبلي:
```prisma
model AdminApiKey {
  id        String   @id @default(cuid())
  adminId   String
  provider  String   // qwen, moonshot, etc.
  encryptedKey String // مشفر
  createdAt DateTime @default(now())
  admin     User     @relation(fields: [adminId], references: [id])
}
```
**حالياً:** الأعمدة المنفصلة كويسة — التحسين مؤجل.

---

## التكلفة

$0/شهر — Vercel Hobby + Supabase Free + Cloudflare Workers + Upstash Redis.
