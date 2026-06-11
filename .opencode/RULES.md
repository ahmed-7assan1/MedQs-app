# قوانين صارمة — يجب الالتزام بها في كل طلب

## ⚠️ قانون التوجيه الأساسي (First Rule)

**قبل أي شيء: حدد نوع المشروع — هل هو ويب (Next.js/shadcn) أم موبايل (Expo/React Native)؟**
ثم اتبع القسم المخصّص له فقط. لا تخلط بينهما أبداً.

---

# 🟢 القسم الأول: قوانين عامة (تنطبق على كل شيء)
====================================================================

1. **اقرأ الملف أولاً قبل تعديله** — لا تعدّل أي ملف دون قراءته.
2. **لا تكتب تعليقات في الكود** — ممنوع `//`, `/* */`, `#` تماماً.
3. **لا تشرح بعد العمل** — نفّذ المطلوب فقط، بدون شروحات.
4. **أجب بأقل من 4 أسطر نصية** (باستثناء استخدام الأدوات وكتابة الكود).
5. **نفّذ الأدوات المستقلة بالتوازي** — Bash/Grep/Glob.
6. **لا تنشئ ملفات جديدة بدون داعٍ — عدّل الموجود.**
7. **لا تنشئ ملفات `*.md` توثيق أبداً** — إلا بطلب صريح.
8. **قبل إضافة مكتبة: تحقق من `package.json` أنها غير موجودة فعلاً.**
9. **صلّح الأخطاء فوراً في نفس السياق.**
10. **احذف ملفات الـ routes القديمة عند إعادة الهيكلة.**
11. **استخدم `kebab-case` لأسماء الملفات** (مثال: `comment-card.tsx`).
12. **استخدم import statements في أعلى الملف دائماً.**
13. **أنهِ الجمل بشكل صحيح** — لا unterminated strings.
14. **استخدم `Promise.all()` للعمليات المستقلة — لا تنتظر ترتيباً.**
15. **استخدم `AbortController` للطلبات التي قد تُلغى.**
16. **لا تستخدم axios** — استخدم `fetch` المدمج.
17. **اختبر `response.ok` قبل `response.json()` دائماً.**
18. **استخدم `@tanstack/react-query` للتخزين المؤقت.**
19. **قبل أي تنفيذ: ابحث عن Skill مناسب من `.opencode/skills/`** — استخدم `skill` tool لتحميل السكيل المناسب للمهمة. لو مفيش skill يناسب بالضبط، اشتغل عادي.
20. **لو مفيش خطة واضحة من المستخدم: حط خطة (todo list) قبل التنفيذ** — حدد الخطوات، الأولويات، والتسلسل المنطقي.

---

# 🔵 القسم الثاني: قوانين تطبيقات الويب (Next.js / shadcn / Tailwind)
====================================================================
> **استخدم هذا القسم فقط إذا كان المشروع Next.js + shadcn/UI**

## قوانين Next.js الأساسية

1. **استخدم `next/image` بدلاً من `<img>`** — تحسين تلقائي.
2. **استخدم `next/font` للخطوط — Google Fonts أو local.**
3. **لا تستخدم `useRouter` أو `useSearchParams` بدون `Suspense` boundary.**
4. **وظّف React Server Components (RSC) حيثما أمكن — قلّل `"use client"`.**
5. **Server Actions: تحقق من authentication داخل الـ action نفسه (ليس middleware فقط).**
6. **استخدم `React.cache()` للـ server-side deduplication (غير fetch).**
7. **استخدم `after()` من `next/server` للـ non-blocking operations (تسجيل، تحليلات).**
8. **لا تضع mutable module-level state في RSC — يؤدي لتسريب البيانات بين المستخدمين.**
9. **استخدم `generateMetadata` للسيو — وليس `<head>` يدوي.**
10. **ابدأ promises مبكراً واستعمل `Promise.all` لتجنب waterfalls.**

## قوانين shadcn/ui

1. **استخدم المكونات الموجودة أولاً — لا تعيد اختراع العجلة.**
2. **استخدم `cn()` للـ conditional classes — لا ternary يدوية.**
3. **لا تستخدم `space-x-*` أو `space-y-*` — استخدم `gap-*`.**
4. **استخدم `size-*` عندما العرض = الارتفاع (لا `w-* h-*`).**
5. **لا تضع `dark:` يدوية — استخدم semantic tokens (`bg-background`).**
6. **أيقونات الأزرار: استخدم `data-icon="inline-start"` وليس `size-4`.**
7. **كل `SelectItem` داخل `SelectGroup` — وهكذا لبقية الـ Groups.**
8. **Dialog/Sheet/Drawer: يحتاج `Title` للـ accessibility (استخدم `sr-only` إذا مخفي).**
9. **لا تجلب component code يدوي — استخدم CLI: `npx shadcn@latest add`.**
10. **`TabsTrigger` داخل `TabsList` — وليس مباشرة في `Tabs`.**
11. **استخدم `Sonner` للـ toasts — وليس build custom.**
12. **استخدم `Alert` للـ callouts — وليس custom div.**
13. **استخدم `Skeleton` للـ loading — وليس `animate-pulse` يدوي.**
14. **استخدم `Badge` بدلاً من `<span>` ملوّن.**
15. **استخدم `Separator` بدلاً من `<hr>` أو `border-t`.**
16. **الـ forms: استخدم `FieldGroup` + `Field` — وليس raw div.**

## قوانين Tailwind v4

1. **استخدم `@import "tailwindcss/..."` وليس `@tailwind` directives القديمة.**
2. **استخدم `@theme` في CSS بدلاً من `tailwind.config.js`.**
3. **استخدم `light-dark()` للألوان التي تدعم light/dark.**
4. **لا تحتاج `babel.config.js` لـ Tailwind v4 مع NativeWind v5.**
5. **لـ React Native: لفّ المكونات بـ `useCssElement` لتفعيل className.**

## قوانين React (للويب فقط)

1. **لا تعرّف component داخل component — يسبب remount كل مرة.**
2. **قسّم hooks ذات dependencies مختلفة — لا تخلط مستقلات معاً.**
3. **اشتقّ القيم أثناء render — لا `useState` + `useEffect` للـ derived state.**
4. **استخدم `useTransition` للـ non-urgent updates.**
5. **استخدم `useDeferredValue` للـ expensive derived renders.**
6. **في React 19: استخدم `use()` بدلاً من `useContext()` — وليس `forwardRef`.**
7. **لا تستخدم barrel imports** (`import { X } from 'lucide-react'` يحمّل 1500+ module).
8. **استخدم dynamic imports للمكونات الثقيلة** (`next/dynamic`).
9. **قلّل serialization عند حدود RSC-Client** — مرّر فقط ما يحتاجه العميل.
10. **استخدم compound components بدلاً من boolean props.**

## قوانين UI Design (للويب)

1. **اختر اتجاه جمالي واضح وجريء — نفّذه بدقة.**
2. **لا تستخدم الخطوط المبتذلة (Inter, Roboto, Arial, Space Grotesk).**
3. **لا تستخدم ألواناً مبتذلة (purple gradients على أبيض).**
4. **استخدم CSS variables للتماسك اللوني.**
5. **أضف staggered animations للدخول (30-80ms بين العناصر).**
6. **اجعل exit animation أسرع من enter animation.**
7. **استخدم CSS transitions بدلاً من keyframes للعناصر سريعة التبديل.**
8. **لا تستخدم `transition: all` — حدّد الخاصية.**

## قوانين Animation (للويب, CSS-in-JS)

1. **حرّك فقط `transform` و `opacity`** (GPU-accelerated).
2. **لا تستخدم `ease-in` أبداً في UI** — استخدم `ease-out` أو custom curves.
3. **مدة animation للـ UI: تحت 300ms.**
4. **لا تعمل animation من `scale(0)` — ابدأ من `scale(0.95)` مع `opacity: 0`.**
5. **لا تعمل animation على keyboard actions (تستخدم مئات المرات/day).**
6. **أضف `scale(0.97)` على `:active` للأزرار.**
7. **أضف `@media (hover: hover) and (pointer: fine)` للـ hover.**
8. **للـ popovers: اجعل `transform-origin` مرتبطاً بالـ trigger (لا center).**

## قوانين Testing (للويب)

1. **استخدم Playwright مع `sync_playwright()` للتست.**
2. **انتظر `networkidle` قبل فحص الـ DOM.**
3. **استخدم `scripts/with_server.py --help` أولاً.**
4. **أغلق الـ browser في النهاية.**
5. **صوّر screenshots للتأكّد من الـ UI.**

---

# 🟠 القسم الثالث: قوانين تطبيقات الموبايل (Expo / React Native)
====================================================================
> **استخدم هذا القسم فقط إذا كان المشروع Expo + React Native**

## قوانين Expo الأساسية

1. **ابدأ بـ `npx expo start` + Expo Go — لا تنشئ custom builds إلا للضرورة.**
2. **لا تستخدم `expo-av`** — استخدم `expo-audio` و `expo-video`.
3. **لا تستخدم `@expo/vector-icons`** — استخدم `expo-image` مع `source="sf:name"`.
4. **لا تستخدم `Platform.OS`** — استخدم `process.env.EXPO_OS`.
5. **لا تستخدم `Dimensions.get()`** — استخدم `useWindowDimensions`.
6. **لا تستخدم `SafeAreaView`** — استخدم `contentInsetAdjustmentBehavior="automatic"`.
7. **لا تستخدم `StyleSheet.create`** — استخدم inline styles.
8. **لا تستخدم `elevation` / `shadowColor` القديمة** — استخدم `boxShadow` كـ CSS string.
9. **لا تستخدم `AsyncStorage` للتوكين** — استخدم `expo-secure-store`.
10. **المتغيرات البيئية: استخدم `EXPO_PUBLIC_` prefix.**
11. **استخدم `borderCurve: 'continuous'` مع أي `borderRadius`.**
12. **استخدم `gap` للتباعد — وليس `margin`.**

## قوانين المكونات (React Native)

1. **أول عنصر في Stack route: `ScrollView` مع `contentInsetAdjustmentBehavior="automatic"`.**
2. **استخدم `<Text selectable />` لكل بيانات مهمة/أخطاء.**
3. **استخدم `{ fontVariant: 'tabular-nums' }` للعدادات.**
4. **لا تستخدم `&&` مع `0` أو `""` في JSX — استخدم ternary أو `!!` (يسبب crash).**
5. **أي نص خارج `<Text>` يسبب crash — لفّ النصوص دومًا.**
6. **استخدم `Pressable` بدلاً من `TouchableOpacity`/`TouchableHighlight`.**
7. **استخدم `expo-image` بدلاً من `Image` الافتراضي من RN.**
8. **استخدم `Gesture.Tap()` من Gesture Handler للـ press animations — وليس `Pressable`.**
9. **استخدم `useDerivedValue` بدلاً من `useAnimatedReaction` كلما أمكن.**
10. **Shared Values: استخدم `.get()` و `.set()` — وليس `.value` (لـ React Compiler).**

## قوانين Lists (للموبايل — FlashList/LegendList)

1. **استخدم `LegendList` أو `FlashList` — وليس `ScrollView` + `.map()`.**
2. **لا تنشئ objects/objects داخل `renderItem` (يكسّر memoization).**
3. **مرّر primitives للـ list items — strings, numbers, booleans.**
4. **استخدم `getItemType` للقوائم غير المتجانسة.**
5. **استخدم صور مضغوطة (thumbnails) داخل القوائم.**
6. **لا تضع `useState` للـ scroll position — استخدم Shared Values.**
7. **قلّل hooks داخل list items — لا useQuery, لا Context.**
8. **استخدم Zustand selectors بدلاً من React Context داخل القوائم.**

## قوانين Animation (للموبايل — Reanimated)

1. **حرّك فقط `transform` و `opacity`** (GPU-accelerated).
2. **لا تحرك `height`/`width`/`top`/`left` — تسبب layout recalculation.**
3. **احفظ STATE (pressed, isOpen) وليس visual values (scale, opacity) في shared values.**
4. **اشتقّ visual values بـ `interpolate()` أو `useDerivedValue()`.**
5. **استخدم `runOnJS()` للـ callbacks من worklets.**
6. **استخدم `withTiming()` أو `withSpring()` — تجنب `withDecay` إلا للـ gestures.**

## قوانين Navigation (للموبايل — Expo Router)

1. **كل Stack له `_layout.tsx` منفصل.**
2. **لا تضع components داخل `app/` directory (anti-pattern).**
3. **تأكد من وجود route يطابق `"/"`.**
4. **استخدم `headerSearchBarOptions` بدلاً من custom search bar.**
5. **استخدم `Link.Preview` مع روابط iOS.**
6. **أضف context menus (long press) للروابط.**
7. **استخدم native stack (`expo-router/stack`) وليس JS stack.**
8. **استخدم native tabs (`NativeTabs`) وليس `@react-navigation/bottom-tabs`.**
9. **استخدم native modals (`presentation: "formSheet"`) بدلاً من JS bottom sheets.**
10. **استخدم zeego للـ menus — وليس custom JS menus.**

## قوانين التفاعل (Haptics — للموبايل)

1. **استخدم `expo-haptics` بشكل مشروط على iOS فقط.**
2. **أضف haptics للإجراءات المهمة (إرسال، حذف، تبديل).**
3. **استخدم `<Switch />` المدمج الذي يأتي مع haptics أصلاً.**

---

# 🟣 القسم الرابع: قوانين مشتركة (لكل من الويب والموبايل)
====================================================================

## Supabase

1. **فعّل RLS على كل جدول — ولا تستخدم `auth.role()` (قديم).**
2. **استخدم `TO authenticated` + `USING (auth.uid() = user_id)` معاً.**
3. **لا تستخدم `SECURITY DEFINER` لحل مشاكل permissions.**
4. **لا تضع `user_metadata` في JWT authorization decisions.**
5. **عند عمل migration: `supabase migration new <name>` أولاً.**
6. **لا تستخدم `apply_migration` للتجربة — استخدم `execute_sql` أولاً.**
7. **Views تتخطى RLS — استخدم `security_invoker = true`.**
8. **UPDATE policy يحتاج `USING` و `WITH CHECK` معاً.**

## Debugging

1. **ابنِ feedback loop سريع (<2 ثانية) قبل أي hypothesising.**
2. **أعد إنتاج البق (reproduce) قبل أن تفترض أي شيء.**
3. **ولّد 3-5 فرضيات مرتبة قبل اختبار أي منها.**
4. **غيّر متغيراً واحداً فقط في كل مرة.**
5. **وسم كل debug log بـ `[DEBUG-xxxx]` فريد، واحذفهم كلهم بالنهاية.**
6. **اكتب regression test قبل الـ fix (عند توفر seam مناسب).**
7. **إذا لم تستطع بناء feedback loop: قف واطلب المساعدة.**

## تحسين بنية الكود (Architecture)

1. **طبق "Deletion Test": احذف الوحدة — إذا اختفت التعقيدات، كانت Pass-through.**
2. **الواجهة (Interface) هي سطح الاختبار.**
3. **محوّل واحد = hypothetical seam. محوّلان = real seam.**
4. **الوحدة العميقة (Deep module) = سلوك كثير خلف واجهة صغيرة.**
5. **استخدم أسماء المجال (Domain language) من CONTEXT.md — لا تبتكر.**

## Vercel Composition (React العام)

1. **لا تستخدم boolean props للتخصيص — استخدم compound components.**
2. **استخدم `children` بدلاً من `renderX` props.**
3. **ولّد explicit variant components بدلاً من Boolean modes.**
4. **افصل State Management عن UI — Provider هو الوحيد الذي يدير الحالة.**
5. **عرّف generic interface: `state`, `actions`, `meta`.**

---

## 🧠 كيفية الاختيار بين القسمين

| إذا قال المستخدم | استخدم |
|---|---|
| Expo, React Native, mobile app, iOS/Android | **الموبايل** |
| Next.js, shadcn, Tailwind, web app, website | **الويب** |
| Supabase, database, API, RLS | **المشترك** |
| "run the app", "test", "dev server" | تحقق من `package.json` أولاً: هل فيه `next` أم `expo`؟ |

**في حال الشك: اقرأ `package.json` أو `app.json` لتحديد نوع المشروع.**

---

**IMPORTANT**: هذه القوانين ملزمة تماماً. ارجع لها قبل كل خطوة.
