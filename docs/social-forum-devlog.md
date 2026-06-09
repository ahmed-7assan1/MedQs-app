# سجل تطوير المنتدى (Community / Social Features)

> أنشئ: 2026-06-09  
> آخر تحديث: 2026-06-09  
> يستهدف: `OneXCommunity.tsx`، `PostComposer.tsx`، `PostCard.tsx`، `PostComposerModal`، API routes، Firebase Realtime

---

## 1. هيكلة المكونات (Component Architecture)

### المكونات الرئيسية

| المكون | الموقع | الوظيفة |
|--------|--------|---------|
| `PostComposerModal` | `OneXCommunity.tsx:1290` | المودال الرئيسي لإنشاء بوست (text + media + poll + quiz + Q&A) |
| `handlePost` | `OneXCommunity.tsx:2483` | الدالة المسؤولة عن إرسال البوست للـ API (بعد رفع الملفات من المودال) |
| `PostCard` | `PostCard.tsx` | بطاقة عرض البوست (Desktop) |
| `PostDetailModal` | `PostDetailModal.tsx` | مودال تفاصيل البوست + التعليقات |
| `MobileReelsView` | `OneXCommunity.tsx:1609` | عرض Reels (موبايل) |
| `PostComposer` | `PostComposer.tsx:69` | الـ composer الصغير المضمن في أعلى الفيد (طريقة قديمة) |

### تدفق الـ Data

```
PostComposerModal
  → handleSubmit() 
    → uploadFile() ← XHR مع progress
    → onPost() = handlePost()
      → fetch(`/api/v1/forums/${circleId}/posts`) ← POST
      → broadcastPost() ← Firebase Realtime
```

**قاعدة مهمة**: الـ `PostComposerModal` هو المسؤول عن رفع الملفات وعرض التقدم. الـ `handlePost` يستقبل البيانات جاهزة (imageUrl + attachments).

---

## 2. قرارات معماريّة (Architecture Decisions)

### 2.1 رفع الملفات → انتقل من `handlePost` إلى `PostComposerModal`

**قبل**: `handlePost` كان يرفع الملفات باستخدام `fetch()` (بدون progress) ويستقبل `mediaItems` كملفات خام.

**بعد**: `PostComposerModal` يرفع الملفات باستخدام `XMLHttpRequest` مع `xhr.upload.onprogress` ويعرض percentage لكل ملف. `handlePost` يستقبل `imageUrl` و `attachments` كراوابط جاهزة.

**السبب**: عرض percentage حقيقي للمستخدم أثناء الرفع + Mock preview فوري.

**توقيع `handlePost` الجديد:**
```typescript
const handlePost = async (
  content: string,
  circleId: string,
  extra?: {
    imageUrl?: string;
    attachments?: { url: string; name?: string; type?: string; size?: number }[];
    pollOptions?: string[];
    quizData?: any;
  }
): Promise<boolean>
```

**ملاحظة**: `ReelsCreateSheet` و `MobileReelsView` لا يستخدمان mediaItems،所以他们 unaffected.

### 2.2 Q&A / Quiz → التوافق مع Zod Schema

**المشكلة**: "Failed to fetch" عند نشر سؤال.

**السبب**: الـ API يستخدم Zod schema `POST_SCHEMA` في `route.ts:25` ويقبل `postType` و `poll` و `qaAnswer` — لكن الكود كان يبعت `type` و `options` و `correctAnswer` (فيلدز مش موجودة في الـ schema فتتشال).

**الحل**:
- `body.type = "qa"` → `body.postType = "qa"`
- `body.options = [...]` → `body.poll = { question: content, options: [...] }`
- `body.correctAnswer = "..."` → `body.qaAnswer = "..."`

**مكان الفكس**: `handlePost` في `OneXCommunity.tsx` السطور 2503-2506.

**ملاحظة**: `body.content` لازم يكون موجود (حتى لو سؤال) لأن الـ Zod refinement بيتأكد من `Boolean(v.content?.trim())`.

### 2.3 الـ optimistic post لازم يشمل `quizData`

عشان السؤال/الكويز يظهر فوراً بعد الضغط على Post، لازم الـ optimistic post يتضمن `quizData`:

```typescript
...(extra?.quizData ? {
  quizData: { type: "qa", options: extra.quizData.options, correctAnswer: extra.quizData.correctAnswer }
} : {}),
```

### 2.4 Post Type في الـ `handleSubmit` (PostComposerModal)

لما المستخدم يختار Q&A:
- `finalContent = qaQuestion.trim()` (ليس `text.trim()`)
- `mediaItems` بتتصفر (`setMediaItems([])`) → مش ممكن يكون في media مع Q&A

لما المستخدم يختار Quiz:
- `finalContent = quizQuestion.trim()`
- `quizData = { type: "qa", options: [...], correctAnswer }`
- `mediaItems` بتتصفر

---

## 3. سجل التغييرات (Changes Log)

### 3.1 AI Enhancement

**الملف**: `OneXCommunity.tsx` (جوة `PostComposerModal`)

- زودنا زر AI في شريط أدوات الماركداون (بجوار زر Preview)
- يستخدم `POST /api/v1/ai/enhance-post` مع `preferredProvider: "siliconflow"`
- الـ Fallback chain: `["siliconflow", "proxy", "huggingface", "duckduckgo"]`
- `callProxy` مضاف في `runners` داخل `ai-router.ts`

### 3.2 Editor Limits

| الثابت | القيمة | مكان التطبيق |
|--------|--------|-------------|
| `MAX_IMAGES` | 10 | `addFiles` مع type=image/video |
| `MAX_FILES` | 3 | `addFiles` مع type=file |
| `MAX_AUDIO` | 1 | `addFiles` مع type=audio |
| `MAX_POLL_OPTIONS` | 3 | `addPollOption` |
| `MAX_QUIZ_OPTIONS` | 20 | `addQuizOption` |

### 3.3 دمج الأزرار (Merged Dropdowns)

- Photo + Video + Audio → **"Media"** dropdown واحد
- Quiz + Q&A → **"Questions"** dropdown واحد
- إضافة click-outside handling (useEffect مع `mousedown`)

### 3.4 Edit / Preview Toggle

- `showPreview` state (default `true`)
- Preview بيستخدم `marked.parse(text, { async: false })` لعرض الماركداون
- يستورد `marked` من `"marked"`

### 3.5 Post Rendering with Markdown

- `renderMarkdown()` function في `OneXCommunity.tsx` (خارج المكون) تستخدم `marked.parse()`
- استبدال `<p>{renderContent(post.content)}</p>` بـ `<div dangerouslySetInnerHTML>`
- 3 أماكن: `PostCard` (desktop)، `PostDetailModal`، `MobileReelsView`
- معالجة الـ hashtags: نحول `#hashtag` إلى `<a>` links بعد الـ markdown parsing

### 3.6 Quiz/QA Display في البوستات

- `quizData` مضاف إلى `PostData` interface
- عرض في 3 أماكن: `PostCard.tsx`، `PostDetailModal`، `MobileReelsView`
- التنسيق: label "Quiz" أو "Q&A" حسب `correctAnswer` موجود ولا

### 3.7 Upload Progress

- استبدال `fetch()` بـ `XMLHttpRequest` في `uploadFile()` داخل `PostComposerModal`
- `xhr.upload.onprogress` يحدث `mediaItems[idx].progress` و `mediaItems[idx].uploading`
- Overlay على كل media item أثناء الرفع: progress bar + percentage + شفافية
- ✕ button يختفي أثناء الرفع

### 3.8 إزالة "Markdown supported" text

شيلنا النص من toolbar في الـ PostComposerModal.

---

## 4. API Route (`forums/[forumId]/posts/route.ts`)

### POST Schema (Zod)

```typescript
content: z.string().max(5000).optional().default("").transform(s => s.trim())
postType: z.string().optional()        // "qa"
poll: z.object({ question: z.string(), options: z.array(z.string()) }).optional()
qaAnswer: z.string().optional()
```

**تحذير**: لو `postType === 'qa'` ومفيش `poll`، الـ Zod refine هيرفض:
```typescript
.refine(v => Boolean(v.content?.trim()) || ... || (v.postType === 'qa' && v.poll))
```

**تحذير**: `content` بياخد `.default("")` فمش بيبقى undefined أبداً.

### Prisma Create Logic

```typescript
// لو postType === 'qa' والبoll موجود:
sharedQuestionData: {
  question: parsed.data.poll.question,
  options: parsed.data.poll.options,
  type: 'qa',
  correctAnswer: parsed.data.qaAnswer || null
}
```

`sharedQuestionData` هو `Json?` في Prisma schema.

---

## 5. Firebase Realtime

بعد كل بوست ناجح، بنعمل:
```typescript
const { broadcastPost } = await import("@/lib/firebase/realtime-service");
if (circleId) broadcastPost(circleId, newPost);
```

**ملاحظة**: الـ dynamic import ممكن يفشل لو الـ chunk مش موجود (يسبب "Failed to fetch").

---

## 6. أخطاء واجهناها (Pitfalls & Solutions)

### "Failed to fetch" عند نشر سؤال
- **السبب 1**: فيلدز مش match للـ Zod schema (`type` بدل `postType`، `options` مباشرة بدل `poll.options`)
- **السبب 2**: Dynamic import لـ Firebase chunk ممكن تفشل (لكن مش common)
- **الحل**: تأكد أن `body.postType = "qa"` و `body.poll = { question, options }`

### Upload progress مش شغال
- **السبب**: كان في `handlePost` وبيستخدم `fetch()` اللي مافيهوش progress events
- **الحل**: نقلنا الرفع إلى `PostComposerModal` مع `XMLHttpRequest`

### Post بيظهر بدون quizData
- **السبب**: optimistic post كان فيه `...{...quizData}` بس `correctAnswer` ممكن يكون `undefined`
- **الحل**: `JSON.stringify` مشكلة مع `undefined` — بس في JavaScript object عادي مش مشكلة

### الماركداون مش شغال في البوست
- **السبب**: كنا بنستخدم `<p>{renderContent(post.content)}</p>` والـ `marked.parse()` output لا يصلح جوة `<p>`
- **الحل**: استخدم `<div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />`

### الـ hashtags بتظهر ككود ماركداون
- **السبب**: `marked.parse()` يحول `#hashtag` إلى `<h1>` heading
- **الحل**: post-process الـ HTML بعد الـ markdown: `html.replace(/<h([1-6])>#(\w+)<\/h[1-6]>/g, '<a href="/search?q=$2">#$2</a>')`

---

## 7. نصائح للتعديل المستقبلي

1. **قبل ما تغير أي حاجة في الـ Zod schema**، تأكد إن الـ Client side (handlePost) matches.
2. **أي feature جديدة للبوستات** لازم تضيفها في 3 أماكن: optimistic post, API schema, Prisma create.
3. **لو ضفت type جديد للبوست** (غير text/poll/qa)، تأكد من الـ Zod refine عشان ميرفضش.
4. **الـ upload files لازم يكون في المودال** مش في handlePost عشان progress.
5. **الـ preview يفضل يكون default `true`** عشان المستخدم يشوف الشكل النهائي.
6. **لا تضف أزرار للـ toolbar بدون مراجعة** — كل زر له `wrapSelection()` pattern.
7. **استخدم `drop-shadow` بدل `box-shadow`** في البوستات عشان ما يأثرش على الـ layout.
8. **الـ emojis** — استخدم `HTML entities` أو `unicode`، مش `React components`.

---

## 8. الملفات المتأثرة

| المسار | التغيير |
|--------|---------|
| `src/components/social/OneXCommunity.tsx` | PostComposerModal + handlePost + renderMarkdown + عرض quiz/QA + upload progress + Edit/Preview |
| `src/components/social/PostCard.tsx` | عرض quizData + markdown rendering |
| `src/components/forum/PostDetailModal.tsx` | عرض quizData + markdown rendering + تعليقات |
| `src/app/api/v1/forums/[forumId]/posts/route.ts` | Zod schema (postType, poll, qaAnswer) |
| `src/app/api/v1/ai/enhance-post/route.ts` | AI enhancement endpoint |
| `src/lib/ai-router.ts` | Fallback providers + callProxy mapping |
| `src/components/social/PostComposer.tsx` | طريقه قديمه (method 1) |
| `src/components/forum/PostCardRedesigned.tsx` | Redesigned post card |

---

## 9. Testing Checklist

- [ ] Post text only
- [ ] Post with images
- [ ] Post with video
- [ ] Post with file attachment
- [ ] Post with poll
- [ ] Post with Q&A
- [ ] Post with Quiz (مع correct answer)
- [ ] Upload progress percentage visible
- [ ] Preview toggle shows correct markdown
- [ ] #hashtags تتحول إلى links
- [ ] AI enhancement شغال
- [ ] optimistic post يظهر فوراً
- [ ] broadcast realtime للـ Firebase
