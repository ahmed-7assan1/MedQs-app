# Skill-First Workflow

## قبل أي مهمة برمجية

1. **افهم المطلوب** — اقرأ طلب المستخدم جيداً
2. **ابحث عن Skill** — استخدم `skill` tool لتحميل السكيل المناسب من `.opencode/skills/`:
   - Frontend/UI work → `senior-frontend`, `ui-design-system`, `ux-researcher-designer`
   - Backend/API → `senior-backend`, `api-design-reviewer`, `senior-fullstack`
   - Database/Supabase → `database-designer`, `database-schema-designer`, `sql-database-assistant`
   - DevOps/CI-CD → `ci-cd-pipeline-builder`, `senior-devops`, `aws-solution-architect`
   - Architecture → `senior-architect`, `tech-stack-evaluator`
   - Medical compliance → `quality-manager-qms-iso13485`, `mdr-745-specialist`, `fda-consultant-specialist`
   - Security/Privacy → `gdpr-dsgvo-expert`, `soc2-compliance`, `risk-management-specialist`
   - QA/Debugging → `focused-fix`, `pr-review-expert`, `performance-profiler`
   - Product/Design → `product-manager-toolkit`, `product-analytics`, `landing-page-generator`
3. **خطة** — لو المهمة معقدة (3+ خطوات)، حط `todowrite` قبل ما تبدأ
4. **نفّذ** — استخدم السكيل loaded في السياق

## السكيلز المتاحة (37)

موجودة في `.opencode/skills/` — استخدم `skill` tool باسم المجلد.

---

## نظام الثيم (Light/Dark Mode) — القواعد

### ألوان Tailwind المسموحة (استخدمها دايمًا بدل الـ hardcoded):

| الاستخدام | الألوان |
|-----------|---------|
| خلفية الصفحة | `bg-background` |
| خلفية الكارد | `bg-card` |
| خلفية muted (inputs, secondary) | `bg-muted` |
| النص الأساسي | `text-foreground` |
| النص الثانوي | `text-muted-foreground` |
| البوردر | `border-border` |
| البوردر في الـ inputs | `border-input` |
| لون الـ ring (focus) | `ring-ring` |
| الألوان الأساسية | `bg-primary`, `text-primary-foreground` |
| الألوان الثانوية | `bg-secondary`, `text-secondary-foreground` |
| الألوان المائلة | `bg-accent`, `text-accent-foreground` |
| ألوان التدمير | `bg-destructive`, `text-destructive-foreground` |
| ألوان النجاح | `text-success`, `bg-success/10` |
| ألوان التحذير | `text-warning`, `bg-warning/10` |

### ممنوعات:
- ❌ **`bg-white`**, **`bg-black`**, **`text-black`**, **`text-white`** بدون `dark:` variant
- ❌ **inline styles** للألوان (ممنوع `style={{ color: "#..." }}`)
- ❌ ألوان hex/hex مكتوبة مباشرة (زي `#f8f9ff`, `#e5e7eb`, إلخ)

### الاستثناءات المسموحة:
- أيقونات SVG بـ `stroke="currentColor"` / `fill="currentColor"` (تأخذ لون النص تلقائيًا)
- Media overlays زي `bg-black/40` على الصور (يجب أن تظل سوداء)
- `bg-white/10` ونظائرها كـ glass effects مع `dark:` variant
- ألوان الـ gradient: `bg-gradient-to-r from-primary to-accent`
- ألوان الـ badge/role زي `bg-yellow-100 text-yellow-700` بشرط وجود `dark:` مضاف
- الـ landing page (`src/app/page.tsx`) له تصميمه المستقل

### المتغيرات (CSS custom properties):
معرفة في `src/styles/globals.css` — لا تعيد تعريفها. لو محتاج قيمة جديدة استخدم `hsl(var(--x))`.

### تبديل الثيم:
يتم عبر إضافة `data-theme="dark"` أو `.dark` class على `<html>` — ممنوع آليات تبديل متعددة.

---

## الدروس المستفادة (من اخطائك.md)

### 1. استخدام replaceAll بدون وعي كافٍ
**الخطأ:** استخدمت `replaceAll: true` في ملف كبير (2670+ سطر) فتغيرت قيم كثيرة خارج النطاق المستهدف.
**الدرس:** حدّد الـ oldString بسياق فريد كافي، أو استخدم replace بدون replaceAll.

### 2. إدخال escaped quotes في JSX
**الخطأ:** الـ edit tool كتب `\"14px 18px\"` بدل `"14px 18px"` — وهذا يكسر JSX.
**الدرس:** تأكد إن القيمة الجديدة فيها quotes منتظمة مش escaped. لو ظهرت `\"` في الناتج، صلحها فوراً.

### 3. التقدير الخاطئ لـ maxHeight
**الخطأ:** قدرت الـ maxHeight بدون حسابات دقيقة (340 وكان صغير جداً — المفروض 450+).
**الدرس:** احسب الحجم المطلوب: padding العنصر × عدد العناصر + gaps + header + container padding.

### 4. التعديل التقريبي بدل المباشر
**الخطأ:** زدت الـ padding تدريجياً (10 → 12 → 14 → 16) بدل قيمة كبيرة من أول مرة.
**الدرس:** اسأل عن القيمة المستهدفة أو زوّد بخطوة كبيرة مرة وحدة.

### 5. تجاهل الـ minHeight
**الخطأ:** ما ضفتش `minHeight` من أول ما ضفت `maxHeight`.
**الدرس:** لو الفكرة responsive container، أضف minHeight و maxHeight مع بعض من أول مرة.

### 6. عدم كفاية التوسع رغم الطلب المتكرر
**الخطأ:** المستخدم طلب تكبير 3 مرات متتالية — ما صلحتش المشكلة من الجذور.
**الدرس:** لو المستخدم عدّل على نفس الحاجة تاني، يبقى التغيير السابق ما كانش كافي — زوّد بقوة من المرة الجاية.

### 7. تغيير القيم المتكررة بدون تفرد السياق
**الخطأ:** استخدمت replaceAll على قيمة متكررة (28 مرة) فغيرت حاجات خارج المقصود.
**الدرس:** أضف سياق قبل وبعد القيمة المستهدفة في oldString.

### 8. عدم مراعاة الـ Responsiveness من البداية
**الخطأ:** ما اخدتش في الاعتبار responsiveness — grid ثابت بدون breakpoints، container padding ثابت.
**الدرس:** أي صفحة جديدة أو تعديل، اسأل عن responsiveness وضف breakpoints (1200px, 960px, 640px, 480px) من البداية قبل أي تنسيق.
**الإصلاح المرجعي:** breakpoints: ≤1200px grid → `"64px 1fr 280px"`، ≤960px single column، ≤640px container padding 8px، ≤480px container padding 4px + 100dvh.

### 9. الاعتماد على Flex Chain بتاع الـ Layout — مشكلة الإطارين
**الخطأ:** استخدمت `height: 100vh` + `flex: 1` مع layout خارجي عنده `md:pb-8` — فظهر إطارين (الصفحة + layout) والمستخدم شاف scroll مزدوج.
**الدرس:** لو الصفحة محتاجة تملأ الشاشة كاملة (full-page app)، استخدم `position: fixed, inset: 0` + منع scroll على body/html. متعتمدش على flex chain من layout خارجي.
**الإصلاح المرجعي:** outer div: `position: fixed, inset: 0, zIndex: 9999` + `<style>{`html,body{overflow:hidden!important}`}</style>` + `overflow: hidden` على outer div + المودالات عبر Portal.

### 10. عدم التثبت من بقاء الـ imports مستخدمة بعد الاستخراج
**السياق:** بعد استخراج السايدبار بتاع AI Chat في component مستقل (`MobileChatSidebar.tsx`)، نسيت أمسح الـ imports اللي بقت ميتة من الملف الأصلي (`MedOneXChat.tsx`).
**الدرس:** أي استخراج component، لازم بعدها أشوف إيه الـ imports اللي بقت مش مستخدمة في الملف الأصلي وأمسحها. استخدم `Select-String` أو `rg` عشان أتأكد.

### 11. استخراج components كبيرة لتحسين الأداء
**السياق:** السايدبار كان inline في `MedOneXChat.tsx` (200 سطر)، وكل ما يحصل re-render (رسايل جديدة، تغيير حالة) السايدبار كان يترندر معاها حتى وهو مختفي.
**الدرس:** لو في جزء من الصفحة مش محتاج يترندر كل مرة، استخرجه في component مستقل مع `React.memo`. ده يمنع re-renders غير ضرورية ويحسن أداء الموبايل.

### 12. backdrop-blur سبب رئيسي للـ lag على الموبايل
**السياق:** السايدبار بتاع AI Chat كان عنده `backdrop-blur-sm` على الخلفية (overlay) و `backdrop-blur-lg` على اللوحة نفسها.
**الدرس:** `backdrop-blur` بيكلف GPU كتير، خصوصاً على الموبايلات الضعيفة. استبدله بـ `bg-black/40` (أو opacity عادي) لو مش ضروري. الفرق في الشكل بسيط، الفرق في الأداء كبير.

### 13. Telegram Bot — تجنب التوسع المفرط في ملف واحد
**السياق:** بوت التيليجرام كان في ملف واحد (`src/app/api/telegram/route.ts`، 629 سطر) بكل handlers (start, auth, AI, group, media, modules, quiz). أي تعديل كان يسبب ripple effect.
**الدرس:** أي بوت تيليجرام (أو أي integration مشابه) اعمل له `/lib/telegram-bot/` بـ structure:
- `helpers.ts` — دوال DB مشتركة (getLinkedUser, getBotUser, keys)
- `keyboards.ts` — كل keyboards منفصلة (استخدم plain objects بدل Markup builder عشان types)
- `start.ts`, `auth.ts`, `ai.ts`, `group.ts`, `contact.ts`, `modules.ts` — كل feature في ملف
- `index.ts` — singleton + register all handlers
- `route.ts` — webhook نحيف جداً (< 50 سطر)

### 14. AI Telegram — BYOK من User model مش BotUser
**السياق:** البوت القديم كان يقرأ `botUser.personalKey` + `preferredProvider` ويرسلهم لـ `generateAIReplyWithFallback`. المشكلة: المستخدمين كانوا يحطوا API keys على المنصة (`User.personalGeminiKey` إلخ) فالبوت كان يقول "No response from" لأن المفاتيح مش في botUser.
**الدرس:** دايماً اقرأ API keys من `User` model (الـ personal[Provider]Key fields) مش من botUser. استخدم `getUserApiKeys(user)` اللي بتجيب كل المفاتيح وترجع `Record<ProviderKey, string | null>`.

### 15. Group Chat — ما تطلبش login من المستخدمين غير المسجلين
**السياق:** البوت القديم كان `if (!linkedUser) return ctx.reply('Please login...')` لكل النصوص حتى في المجموعات. المستخدمين اللي مش مسجلين كانو يشوفوا رسالة تسجيل كل ما يذكروا البوت.
**الدرس:** لو في group chat، استخدم free fallback (Gemini API key من env) للمستخدمين غير المسجلين. كمان استخدم `reply_parameters: { message_id }` بدل `reply_to_message_id` عشان تتوافق مع API الجديد.

### 16. Password Security — احذف password من الذاكرة
**السياق:** لما المستخدم يدخل password في خطوة تسجيل الدخول، استخدم `finally` block عشان تمسح المتغير من الذاكرة بعد المقارنة: `(password as any) = undefined;` في `finally`.
**الدرس:** أي حاجة sensitive (password, token, key) تمر من خلال المتغيرات في الـ handler، احذفها ب `finally` block عشان تمنع تسربها في stack traces أو logs.

---

## مشروع LibreChat — القواعد الإلزامية

### المبدأ الأول: العمل من PLAN.md

- **اقرأ `PLAN.md` أولاً** قبل أي تنفيذ — هذا هو المصدر الوحيد للحقيقة عن التقدم
- كل الخطوات موثقة في `PLAN.md` — اتبعه بدقة
- **بعد نهاية أي خطوة:** حدث `PLAN.md` — انقل السطر من ⏳ إلى ✅ وسجل التاريخ

### المبدأ الثاني: كل شيء من الصفر

- **ممنوع استخدام** أي component من الملفات التالية:
  - `src/components/ai/DrQChat.tsx`, `DrQMessage.tsx`, `DrQComposer.tsx`, `DrQSidebar.tsx`, `DrQConfigPanel.tsx`, `DrQPersonas.ts`, `DrQWorkspaces.ts`
  - `src/components/ai/MedOneXChat.tsx`
  - `src/hooks/useDrQChat.ts`
  - `src/components/ai/` بأكمله
- **المسموح به فقط:**
  - Firebase config (الموجود)
  - Supabase Auth (الموجود)
  - APIs: `/api/v1/ai/chat`, `/api/v1/ai/agents`
  - Firebase Firestore collections (new subcollections للـ librechat)
- كل components, hooks, utils جديدة تكتب من الصفر في:
  - `src/components/librechat/`
  - `src/hooks/` (hooks جدد)
  - `src/utils/` (utils جدد)

### المبدأ الثالث: Task Breakdown

- **كل خطوة = Task واحد** باستخدام `todowrite`
- **قسم كل خطوة إلى sub-tasks** (3-10 sub-tasks حسب التعقيد)
- مثال: الخطوة 1 تنقسم إلى:
  1. إنشاء مجلدات + page route
  2. إنشاء LibreChatShell layout
  3. إنشاء useChat hook
  4. إنشاء useThreads hook
  5. إنشاء Composer
  6. إنشاء MessageList + MessageBubble
  7. إنشاء LoadingDots + EmptyState
  8. اختبار وتجربة

### المبدأ الرابع: المراجعة بعد كل خطوة

بعد نهاية أي خطوة:
1. **راجع** الـ code المنفذ — تأكد إنه يعمل
2. **حدث** `PLAN.md` — انقل الخطوة إلى ✅ وسجل التاريخ
3. **أبلغ المستخدم** بما تم إنجازه + اطلب الموافقة على الخطوة التالية

### المبدأ الخامس: الالتزام بالخطة

- لا تتعدى على خطوة لم يحن وقتها
- لا تضيف features خارج الخطة بدون سؤال المستخدم
- لا تستخدم مكونات قديمة حتى لو وفرت وقت — الالتزام بـ "من الصفر" إجباري
