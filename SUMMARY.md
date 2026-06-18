# Session Summary

## Goal
تحسين أداء تطبيق MedOneX (سرعة التنقل، زوال الثقل على الجوال) وإصلاح مشاكل اتصال قاعدة البيانات، ثم تعديل واجهة شات الـ AI بالكامل، ثم نقل صفحة السوشيال إلى route group منفصل، ثم تحسين UI شات الـ AI (كبسولة الإرسال، الوايت مود، حجم الخط).

## Constraints & Preferences
- شات AI يكون الصفحة الأساسية بدون layout الطالب (بدون wrappers إضافية)
- صندوق إرسال عائم دائري في الأسفل، والصفحة تنزل من تحته عند الإسكرول
- البوتون بار (الـ tabs) يختفي أثناء الإسكرول ويبقى صندوق الإرسال فقط
- السايد بار يظهر أمام كل شيء (z-index أعلى من صندوق الإرسال)
- خط Cairo للنص العربي في الشات
- أيقونات التفاعل من مكتبة Heroicons (نسخة 16/solid) واضحة
- حواف رسالة المستخدم دائريّة (rounded-2xl)
- السوشيال تكون route group منفصل زي الشات بالضبط مع الاحتفاظ بـ MobileBottomNav
- كل ميزات السوشيال الأصلية محفوظة (forum tabs, filter pills, search, notifications, create post)
- لون خلفية الكبسولة في الوايت مود: `#F7F7F7`
- لون خلفية الشات في الوايت مود: `#FCFCFC`
- لون الأيقونات والنصوص في الوايت مود: `#050505`
- زر الإرسال دائرة ثابتة لا تتغير (`min-w-8 min-h-8`)
- الكبسولة ترتفع للأعلى عند كتابة أسطر متعددة (الأيقونات ثابتة في الأسفل)
- نص ردود الـ AI: 16px مع line-height 1.6 ووزن Medium، خط Sans-serif نظيف

## Progress
### Done
- إضافة `unstable_cache` لـ `fetchDashboardData()` في `src/lib/dashboard-queries.ts` مع `revalidate: 60`
- تحديث `src/app/(student-clean)/dashboard-app/page.tsx` لاستخدام `getCachedDashboardData`
- تحويل أنيمشنز `MobileDashboardHero` من framer-motion إلى CSS keyframes مع `will-change`
- إضافة `will-change: stroke-dashoffset` لـ SVG rings في `DashboardShell.tsx`
- تقليل Confetti في `StreakCelebration` من 40 قطعة ← 8 قطع، والمدة من 3.5s ← 2.5s
- إضافة `rootMargin: "200px"` إلى `useInView` في `RedesignedComponents.tsx`
- تخفيف `staggerChildren` من 0.08 ← 0.04 في `DashboardShell.tsx`
- إضافة `prefetch={false}` لروابط /videos و /podcasts و /community في `QuickLinkCompact`
- تحويل `DailyQuote` من Client Component ← Server Component
- إضافة `loading="lazy"` لجميع صور avatars في `CommunityPostsCarousel.tsx`
- إضافة CSS keyframes جديدة في `globals.css` (flame-glow, flame-pulse, shimmer-slide, trophy-glow)
- تعديل `src/lib/prisma.ts`: إضافة `connection_limit=5` و `pool_timeout=10` مع `withRetry()`
- لفّ بيانات الـ dashboard بـ `withRetry(..., 2)`
- جعل صندوق الإرسال `rounded-full` بدل `rounded-xl` مع `shadow-lg`
- جعل Super Expert أيقونة فقط (بدون "Super Expert" text) في الموبايل والديسكتوب
- فصل `AiChatInput` عن الـ tab bar المنزلق في `MobileBottomNav.tsx`
- إزالة خلفية التركيز البيضاء من صندوق الإرسال (border ثابت `border-white/10`)
- استبدال أيقونة الإرسال `ArrowUp` بأيقونة `PaperPlaneRight` (دائريّة)
- تغيير لون زر الإرسال من `bg-black` إلى `bg-[#141414]`
- جعل صندوق الإرسال عائم بدون خلفية (bg-[#141414]/90) مع صفحة تنزل تحته
- تغيير خلفية الشات إلى `#050505`
- تحسين تباين نص الـ AI (`text-white/90` → `text-white`)
- استبدال أيقونات التفاعل (Like/Dislike/Copy/Regenerate/Share/Flashcard) من Phosphor إلى `@heroicons/react/16/solid`
- إزالة "You" وصورة المستخدم من رسالة المستخدم نهائياً
- تغيير حواف رسالة المستخدم إلى `rounded-2xl`
- إضافة `font-arabic` لحاوية markdown لعرض خط Cairo في النص العربي
- إخفاء `GlobalTopBar` في صفحة `/ai-chat`
- إخفاء الـ Top Island Bar جوه `MedOneXChat.tsx` (ملفوف بـ `{false && ...}`)
- تقليل `pt-[60px]` → `pt-0` في الـ main element
- إزالة الفجوة العلوية (`padding-top: var(--mobile-header-offset)`) عبر CSS في `MedOneXChat.css`
- إصلاح double-height (حذف `h-screen w-screen` الزائد من `MedOneXChat`)
- تعديل `MobileSwipeLayout` وإزالة `h-screen` من page wrapper
- إنشاء route group جديد `(chat)` بـ layout مينيمال (بدون StudentLayout) ونقل `/ai-chat` إليه
- نقل `AiChatInput` من `MobileBottomNav.tsx` إلى `MedOneXChat.tsx` مباشرة وإلغاء `useChatInputBridge`
- حذف مجلد `src/app/(student)/ai-chat/` بالكامل
- إنشاء `(social)/layout.tsx` مع GlobalTopBar + MobileBottomNav + كل providers (بدون StudentLayout)
- نقل `social/page.tsx` و `social/loading.tsx` إلى `(social)/social/` بنفس logic (auth, SocialMobileWrapper, OneXCommunity)
- تضمين PostComposer في CommunityFeed مباشرة (FAB + dynamic import) بدل GlobalPostComposer bridge
- إزالة GlobalPostComposer من `(student)/layout.tsx` و `(student-clean)/layout.tsx` وحذف الملف
- حذف مجلد `(student)/social/` بالكامل
- تصغير أزرار الموبايل في الكبسولة من `w-9`→`w-8` مع `min-w-8 min-h-8` لضمان دائرة ثابتة
- تغيير محاذاة الكبسولة من `items-center`→`items-end` عشان الأيقونات تثبت في الأسفل والنص ينمو للأعلى
- استبدال `rounded-full` بـ `rounded-2xl` عشان الكبسولة تحافظ على شكلها المستطيلي عند زيادة الأسطر
- إضافة زر Provider Picker (أيقونة المزود النشط) جنب زر الإرسال في الكبسولة
- إضافة الـ White mode للـ chat بالكامل: خلفية `#FCFCFC`، كبسولة `#F7F7F7`، نصوص وأيقونات `#050505`
- تغيير نص ردود AI: `prose-base` مع `prose-p:text-[16px] prose-p:font-medium prose-p:leading-[1.6]`
- تعديل `DrQMessage.tsx`: `fontSize` prop يُمرّر من `settings.fontSize` (الافتراضي الآن 16px)
- مسح build cache (.next) لحل conflict route groups
- إصلاح Gemini parse stream: استبدال SDK `sendMessageStream` بـ `fetch` مباشر مع SSE parser مرن (يدعم single `\n` و `\n\n` و `\r\n`)
- إضافة `dir="auto"` و `font-arabic` لـ textarea (ديسكتوب وموبايل) لدعم الكتابة بالعربي في صندوق الإرسال
- تغيير `text-left` → `text-start` في sidebar thread items و suggestion buttons لتحترم RTL
- تغيير `text-left` → `text-start` في جداول markdown بـ DrQMessage
- تغيير `text-left` → `text-start` و `text-right` → `text-end` في checklist و quiz cards بـ DrQMessage
- تعديل hamburger button: خلفية بيضاء في الوضع الفاتح (`bg-white`) وسوداء في الوضع الغامق (`bg-black`)
- تعديل اللوجو في السايد بار: `brightness-0` في الوضع الفاتح (أسود) و `brightness-0 invert` في الغامق (أبيض)
- تغيير لون أيقونات السايد بار من `text-indigo-500` → `text-gray-900` في الوضع الفاتح (أسود)
- إضافة زر تبديل المود (Dark/Light Mode) في السايد بار تحت الإعدادات
- تغيير السايد بار من Overlay Drawer إلى Push Drawer (DeepSeek style): إزالة backdrop، تحويل العرض إلى `w-[80vw]`، إضافة shadow، تطبيق `translateX(80vw) + scale(0.92)` على المحتوى الرئيسي، إغلاق السايد بار بالضغط على الـ 20% الظاهر

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **Push Drawer بدل Overlay Drawer**: السايد بار يزق المحتوى لليمين (80vw) مع scale(0.92) بدل ما يغطيه بالـ backdrop. العناصر `fixed` (modals, mobile input) توضع خارج `motion.div` عشان ما يتأثروش بـ CSS transform
- استخدام `unstable_cache` بدل SWR/React Query – مدمج مع Next.js ويعمل في server components
- تحويل framer-motion infinite animations إلى CSS animations لأنها تشتغل على GPU compositor thread
- `connection_limit=5` بدل 30 لمنع استنزاف Supabase connection pool
- `withRetry` مع exponential backoff للتعامل مع connection drops المؤقتة
- إنشاء route group `(chat)` منفصل عن `(student)` ليكون الشات صفحة أساسية بدون wrappers إضافية
- نقل `AiChatInput` من `MobileBottomNav` إلى `MedOneXChat` مباشرة وإلغاء الـ bridge لأن bridge زائد عن الحاجة بعد توحيد المكونات
- استخدام `@heroicons/react/16/solid` لأيقونات التفاعل (أوضح وأصغر حجم)
- استخدام `font-arabic` بدل الاعتماد على `[dir="rtl"]` CSS لأن auto-detection لا يفعّل المتغيرات بشكل صحيح
- إنشاء route group `(social)` منفصل عن `(student)` للسوشيال — نفس pattern الـ chat لكن مع الاحتفاظ بـ MobileBottomNav + GlobalTopBar
- تضمين PostComposer في CommunityFeed مباشرة بدل GlobalPostComposer bridge — نفس pattern الـ AiChatInput
- إبقاء `/community` في `(student)` layout للتوافق مع التنقل القديم (CommunityPageClient يعيد التوجيه إلى `/social`)
- استخدام `flex-1 min-w-0` في textarea بدل `w-full` لمنع زحام الأزرار في الكبسولة
- استخدام `min-w-8 min-h-8` للأزرار لضمان دائرة ثابتة غير قابلة للانضغاط
- `items-end` في flex container لترسيخ الأيقونات في الأسفل أثناء نمو textarea للأعلى
- `rounded-2xl` للكبسولة بدل `rounded-full` لمنع التشوه البصري عند زيادة الارتفاع
- AI response text: 16px مع leading 1.6 ووزن Medium لمنح النص مظهراً أنظف وأكثر احترافية (مستوحى من Grok)

## Next Steps
1. اختبار build: `npm run build` والتحقق من عدم وجود أخطاء (تم إزالة import `@google/generative-ai`)
2. اختبار شات جيمناي بعد الإصلاح (خاصةً في الحالات اللي كانت تفشل فيها الـ parse stream)
2. اختبار تدفق الشات كامل (إرسال رسالة، ظهور الرد، التفاعلات، السايد بار، الإعدادات)
3. اختبار التنقل بين السوشيال والأقسام الأخرى (التأكد من عمل MobileBottomNav في `(social)` layout)

## Critical Context
- **الشات الآن في مسار:** `src/app/(chat)/ai-chat/page.tsx` — route group منفصل عن `(student)`
- **السوشيال الآن في مسار:** `src/app/(social)/social/page.tsx` — route group منفصل عن `(student)`
- **الـ layout بتاع السوشيال:** `src/app/(social)/layout.tsx` — يحتوي GlobalTopBar + MobileBottomNav + FirebaseProvider + SiteConfigProvider + MobileChromeController + TelegramBlocker + CookieConsentBanner (بدون StudentLayout, بدون Sidebar, بدون FloatingIslandNavbar, بدون GlobalPostComposer)
- **الـ layout بتاع الشات:** `src/app/(chat)/layout.tsx` — يحتوي فقط FirebaseProvider + SiteConfigProvider + MobileChromeController + TelegramBlocker + CookieConsentBanner
- **صندوق الإرسال:** موجود مباشرة في `MedOneXChat.tsx` لكل من الموبايل والديسكتوب — لا يوجد bridge بعد الآن
- **السوشيال CommunityFeed:** يحتوي FAB للإنشاء + PostComposer مباشر (بدون GlobalPostComposer)
- **Copied files conflict:** Next.js build فشل بسبب وجود `/social` في مسارين — تم حذف `(student)/social/` + مسح `.next` cache
- **السايد بار:** `z-[10010]` فوق كل شيء (بما في ذلك صندوق الإرسال `z-[10003]`)
- **الـ tab bar:** يختفي أثناء الإسكرول على الموبايل (في `MobileBottomNav.tsx`)، غير موجود في `(chat)` layout لكن موجود في `(social)` layout
- **الفجوة العلوية:** تم إصلاحها عبر `main#main-content { padding-top: 0 !important; }` في `MedOneXChat.css`
- **مكتبة الأيقونات:** `@heroicons/react` (نسخة 16/solid للتفاعل، 24/solid للـ sidebar)
- **الخط العربي:** Cairo عبر `font-arabic` class + `var(--font-cairo)`
- **ألوان الوايت مود في الشات:** خلفية `#FCFCFC`، كبسولة الإرسال `#F7F7F7`، نصوص `#050505`، زر الإرسال `bg-[#050505] text-white`
- **AI response text:** 16px (افتراضي)، `prose-p:font-medium`, `prose-p:leading-[1.6]` عبر Tailwind Typography

## Relevant Files
- `src/app/(chat)/layout.tsx`: layout مينيمال لصفحة الشات
- `src/app/(chat)/ai-chat/page.tsx`: صفحة الشات (منقولة من student)
- `src/app/(social)/layout.tsx`: layout جديد للسوشيال مع GlobalTopBar + MobileBottomNav
- `src/app/(social)/social/page.tsx`: صفحة السوشيال (منقولة من student)
- `src/app/(social)/social/loading.tsx`: loading للسوشيال
- `src/app/(student)/social/`: تم حذفه بالكامل
- `src/components/ai/MedOneXChat.tsx`: مكون الشات الرئيسي – يحتوي AiChatInput للموبايل والديسكتوب مع white mode، السايد بار، وإعدادات الشات
- `src/components/ai/MedOneXChat.css`: CSS مع `padding-top: 0 !important;` و Super Expert glow
- `src/components/ai/DrQMessage.tsx`: مكون الرسائل – يستخدم Heroicons للتفاعل، font-arabic للعربي، حواف rounded-2xl للمستخدم، prose-base + prose-p:text-[16px] prose-p:font-medium prose-p:leading-[1.6]
- `src/hooks/useDrQChat.ts`: إعدادات الشات (fontSize الافتراضي 16px)
- `src/components/layout/GlobalTopBar.tsx`: يرجع null في `/ai-chat`، شغال في `/social`
- `src/components/layout/MobileBottomNav.tsx`: tab bar منزلق بدون AiChatInput، شغال في `(student)` و `(social)` layouts
- `src/components/community-mobile/CommunityFeed.tsx`: فيه FAB + PostComposer مباشر
- `src/components/layout/GlobalPostComposer.tsx`: تم حذفه بالكامل
- `src/app/(student)/layout.tsx`: تم إزالة GlobalPostComposer منه
- `src/app/(student-clean)/layout.tsx`: تم إزالة GlobalPostComposer منه
- `src/lib/dashboard-queries.ts`: `fetchDashboardData()` مع `getCachedDashboardData`
- `src/lib/prisma.ts`: اتصال Prisma مع `connection_limit=5` و `withRetry()`
- `src/styles/globals.css`: keyframes CSS + `.app-shell`, `#main-content` قواعد الـ layout
