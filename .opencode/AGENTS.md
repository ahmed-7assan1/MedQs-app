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
