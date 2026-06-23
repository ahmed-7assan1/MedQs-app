import {
  Rocket, Database, MessageSquareText, Gauge, Shield, Sparkles,
  type LucideIcon,
} from "lucide-react";

export type Milestone = {
  commit: string;
  type: "triumph" | "struggle" | "pivot";
};

export type Chapter = {
  id: string;
  period: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  narrative: string;
  struggle: string;
  narrativeAr: string;
  struggleAr: string;
  titleAr: string;
  subtitleAr: string;
  milestones: Milestone[];
  commitCount: number;
};

export type BrandValue = {
  icon: LucideIcon;
  title: string;
  desc: string;
  titleAr: string;
  descAr: string;
  color: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "spark",
    period: "4 ابريل — 11 ابريل 2026",
    icon: Rocket,
    title: "The Spark",
    subtitle: "A single deploy commit and a dream",
    narrative:
      "It started with a single deploy. No fancy UI, no big plan — just a bare server and the belief that medical students deserve better tools. Forums went live, the AI started chatting, study spaces appeared. In one week, the foundation was built.",
    struggle:
      "The database kept locking up during builds. Every time we tried to update, Windows would freeze files mid-operation. We had to split the database commands — a duct-tape fix, but it kept us moving.",
    narrativeAr:
      "بدأت بحاجة بسيطة: أول deploy على السيرفر. مفيش حاجة فخمة، مجرد فكرة إن الطلاب بتوع الطب يستاهلوا أدوات أحسن. في خلال ساعات، الفورم اشتغلت، الذكاء الاصطناعي بدأ يتكلم، وحتة المذاكرة اتكونت. في أسبوع واحد، الأساس اتبنى.",
    struggleAr:
      "قاعدة البيانات كانت بتقفل كل ما نعمل build. كل ما نحاول نحدث حاجة، ويندوز كان بيعمل lock للملفات. الحل كان إننا فضينا أوامر قاعدة البيانات على بعض — رقعة مؤقتة، بس خلصتنا.",
    milestones: [
      { commit: "Initial deploy", type: "triumph" },
      { commit: "feat: AI reliability, fonts, landing motion, admin question placement", type: "triumph" },
      { commit: "feat: study space, Dr. Q threads, DMs, forum saves, question uploads", type: "triumph" },
      { commit: "chore: split db:push from db:generate for Windows EPERM", type: "struggle" },
      { commit: "feat: study assistant, OCR, PWA icon, guest quiz, v2 APIs", type: "triumph" },
    ],
    commitCount: 18,
  },
  {
    id: "foundation",
    period: "12 ابريل — 24 ابريل 2026",
    icon: Database,
    title: "Foundation Wars",
    subtitle: "Upload services, landing iterations, and the first scale wall",
    narrative:
      "The real battles started here. Image uploads changed providers three times — each migration triggered by Vercel's 10-second timeout. The landing page was redesigned 7 times in one day. A single escaped quote in JSX broke the production build at 3 AM. But the foundation held.",
    struggle:
      "Vercel's 10-second function limit meant every upload system had to be rebuilt. A tiny quote error in JSX caused a silent build failure at 3 AM. The lesson: never trust a build that passes locally — it will break on the server.",
    narrativeAr:
      "المعارك الحقيقية بدأت هنا. رفع الصور غير بروفايدر 3 مرات — كل تغيير بسبب حد 10 ثواني بتاع Vercel. اللاندينج بيج اتعدلت 7 مرات في يوم واحد. علامة تنصيص غلط في ملف JSX خربت الموقع على البرودكشن الساعة 3 الفجر. بس الأساس صمد.",
    struggleAr:
      "حد الـ 10 ثواني بتاع Vercel خلانا نعيد بناء نظام رفع الصور بالكامل. مشكلة سخيفة في علامة تنصيص في JSX عملت build failure صامت الساعة 3 الفجر. الدرس: أي build يشتغل عندك محلياً هيبوظ على السيرفر.",
    milestones: [
      { commit: "Visual overhaul, bug fixes, logo updates, site config context", type: "triumph" },
      { commit: "feat: Cloudinary for image uploads, UploadThing for PDFs only", type: "pivot" },
      { commit: "fix: avatar upload via client-side UploadThing to bypass Vercel 10s timeout", type: "struggle" },
      { commit: "fix: escaped quote in jsx causing vercel build failure", type: "struggle" },
      { commit: "feat: redesign landing page to match dashboard design system", type: "triumph" },
      { commit: "feat: UI/UX overhaul — video player, dashboard cards, lecture hub", type: "triumph" },
    ],
    commitCount: 42,
  },
  {
    id: "telegram",
    period: "26 ابريل — 10 مايو 2026",
    icon: MessageSquareText,
    title: "The Telegram Campaign",
    subtitle: "YouTube sync, Colab workers, and the 50-commit day",
    narrative:
      "The Telegram Bot started as a simple AI chat. Within two weeks it became a full ecosystem: YouTube video migration via Google Colab, automated content delivery, quiz polls, voice support, and a dedicated Mini App. May 7 saw 50 commits in a single day — the most intense day of development. The bot now serves thousands of students daily.",
    struggle:
      "Colab workers crashed mid-transfer constantly. Cookies expired, Chrome drivers didn't match, the entire pipeline broke repeatedly. The webhook security required 3 complete rewrites to pass Telegram's strict validation.",
    narrativeAr:
      "بوت التليجرام بدأ كشات ذكاء اصطناعي بسيط. في أسبوعين بقى نظام متكامل: ترحيل فيديوهات يوتيوب عن طريق Google Colab، توصيل المحتوى بشكل أوتوماتيك، اختبارات، صوت، و Mini App كامل. يوم 7 مايو عملنا 50 commit في يوم واحد — أطول يوم شغل في المشروع. النهاردة البوت بيخدم آلاف الطلاب يومياً.",
    struggleAr:
      "سيرفرات Colab كانت بتقع في نص الترحيل باستمرار. الكوكيز بتنتهي صلاحيتها، مشغلات Chrome مش متوافقة، كل حاجة كانت بتتكسر. الأمان بتاع الـ webhook اتكتب من الصفر 3 مرات عشان يعدي اختبارات تليجرام الصارمة.",
    milestones: [
      { commit: "feat: implement AI-to-Colab youtube video migration logic", type: "triumph" },
      { commit: "feat: complete bulk telegram transfer system with file support", type: "triumph" },
      { commit: "feat: enable selenium uploader with cookies in colab worker", type: "triumph" },
      { commit: "fix: robust selenium setup for google colab", type: "struggle" },
      { commit: "Add Telegram bot integration with Dr. Q AI", type: "triumph" },
      { commit: "Major Bot Upgrade: English-first UI, Academic Navigation Tree, Voice Support", type: "triumph" },
      { commit: "Full rewrite of Telegram command handlers", type: "pivot" },
      { commit: "feat: implement premium Telegram Mini App (TMA)", type: "triumph" },
    ],
    commitCount: 87,
  },
  {
    id: "performance",
    period: "10 مايو — 12 مايو 2026",
    icon: Gauge,
    title: "Performance or Death",
    subtitle: "50k CCU, Firebase migration, and the 5.2MB logo",
    narrative:
      "The platform hit a wall. The database was drowning under load. We migrated to Firebase real-time infrastructure with P2P failover. A 5.2MB logo file was found and removed. Antd and grok-chat libraries were uninstalled. The Supabase migration began. Load times dropped from 3 seconds to under 200ms.",
    struggle:
      "A 5.2MB logo was loading on every single page visit — nobody noticed until the audit. Database queries hit 2000/minute during peak hours. The Firebase cutover had to run with zero downtime, both databases working simultaneously.",
    narrativeAr:
      "الموقع وصل لحائط مسدود. قاعدة البيانات كانت بتغرق من الضغط. هاجرنا لـ Firebase مع P2P failover عشان الموقع يفضل شغال لو حاجة وقعت. لقينا ملف لوجو حجمه 5.2MB بيتحمّل في كل صفحة — اتمسح فوراً. مكاتب كتير اتعملها uninstall. الهجرة لـ Supabase بدأت. وقت تحميل الصفحة نزل من 3 ثواني لأقل من 200 جزء من الثانية.",
    struggleAr:
      "لوجو حجمه 5.2MB كان بيتحمّل في كل زيارة لأي صفحة — محدش لاحظ غير لما عملنا المراجعة. استعلامات قاعدة البيانات وصلت 2000 في الدقيقة في أوقات الذروة. الهجرة لـ Firebase تمت بدون أي توقف — كلتا قاعدتي البيانات كانت شغالة في نفس الوقت.",
    milestones: [
      { commit: "feat: modernize real-time infrastructure with Firebase, Aggressive Caching, and P2P Failover", type: "triumph" },
      { commit: "perf: completely eliminate intensive postgres polling across forum, chat, and notifications", type: "triumph" },
      { commit: "perf: major performance audit and cleanup. removed 5.2MB logo, uninstalled antd/grok-chat", type: "triumph" },
      { commit: "perf: optimize Time to First Byte (TTFB) and frontend latency", type: "triumph" },
      { commit: "feat: infrastructure migration to Supabase, performance optimizations, and content sync completed", type: "pivot" },
      { commit: "fix: resolve ESM import issue for next-auth/jwt and optimize Prisma for Vercel build", type: "struggle" },
    ],
    commitCount: 28,
  },
  {
    id: "auth-vortex",
    period: "13 مايو — 22 مايو 2026",
    icon: Shield,
    title: "The Auth Vortex",
    subtitle: "Infinite redirects, Cosmic Glassmorphism, and the Excalidraw nightmare",
    narrative:
      "Auth nearly broke the team. What started as a simple login redesign turned into 30+ commits of redirect loop debugging. Middleware, layout guards, client-side checks — everything failed. The team had to revert to an older version just to breathe. Meanwhile, the DrawMed whiteboard needed 10 consecutive fixes — from Webpack aliases to hand-vendoring 2000 lines of code.",
    struggle:
      "The infinite redirect loop consumed 3 days. A commit message said 'temporarily disable middleware firewall redirects' — the confession of defeat. Excalidraw's package was so broken it had to be manually vendored into a 2000-line file.",
    narrativeAr:
      "تسجيل الدخول كاد يكسر الفريق. اللي بدأ كتجميل لصفحة الدخول تحول لـ 30+ commit من تصليح redirect loop. الـ middleware، الـ layout guards، client-side checks — كل حاجة فشلت. الفريق رجع لنسخة قديمة عشان ياخد نفسه. وفي نفس الوقت، السبورة البيضاء DrawMed احتاجت 10 تعديلات متتالية — من Webpack aliases لإنشاء ملف 2000 سطر بالعافية.",
    struggleAr:
      "الـ redirect loop اللانهائي أكل 3 أيام. رسالة commit قالت 'temporarily disable middleware firewall redirects' — اعتراف بالهزيمة. مكتبة Excalidraw كانت مكسورة جداً لدرجة إننا اضطرينا ننسخها يدوي في ملف 2000 سطر عشان تشتغل.",
    milestones: [
      { commit: "feat(auth): Massive UI overhaul for auth with Cosmic Glassmorphism", type: "triumph" },
      { commit: "fix(auth): resolve redirect loop root causes + add forgot/reset password system", type: "struggle" },
      { commit: "fix(middleware): resolve infinite redirect loop and merge full auth logic", type: "struggle" },
      { commit: "chore: temporarily disable middleware firewall redirects", type: "struggle" },
      { commit: "chore: revert to stable post-migration state (9e70eae)", type: "pivot" },
      { commit: "fix: vendor excalidraw bundle into src/vendor to bypass exports field", type: "struggle" },
      { commit: "fix: inline all npm deps into vendor.mjs (except react/react-dom)", type: "struggle" },
    ],
    commitCount: 55,
  },
  {
    id: "rebirth",
    period: "25 مايو — النهاردة",
    icon: Sparkles,
    title: "The MedOneX Rebirth",
    subtitle: "BYOK revolution, voice mode, and brand identity",
    narrative:
      "The final chapter is still being written. Students can now use their own API keys across 15+ AI providers. Voice mode with continuous listening turned the AI into a real conversation partner. The brand evolved from MedQs to MedOneX. After 17 landing page redesigns, we stopped trying to look perfect and started telling the truth.",
    struggle:
      "Voice mode forced three separate technologies to work together: browser speech recognition (flaky), server-side text-to-speech (WebSocket limitations), and an echo cancellation system built from scratch. Every brand decision was questioned — until the story became more important than the logo.",
    narrativeAr:
      "الفصل الأخير لسه بيتكتب. دلوقتي الطلاب يقدر يستخدموا مفاتيح API بتاعتهم على 15+ مزود ذكاء اصطناعي. وضع الصوت مع الاستماع المستمر خلّى الذكاء الاصطناعي شريك محادثة حقيقي. العلامة التجارية اتحولت من MedQs لـ MedOneX. بعد 17 إعادة تصميم للاندينج بيج، وقفنا نحاول نكون مثاليين وبدأنا نقول الحقيقة.",
    struggleAr:
      "وضع الصوت اضطرنا إننا نخلي 3 تقنيات مختلفة تشتغل مع بعض: التعرف على الكلام في المتصفح (مش مضمون)، تحويل النص لكلام على السيرفر (مشكلات WebSocket)، ونظام إلغاء الصدى اللي اتبنى من الصفر. كل قرار خاص بالعلامة التجارية كان محل تساؤل — لحد ما القصة بقت أهم من الشعار.",
    milestones: [
      { commit: "feat: MedOneX Expert AI redesigned with floating island, persona-locked roles", type: "triumph" },
      { commit: "feat: AI response cache (IndexedDB + server), fuzzy matching, MedOneX rebrand", type: "triumph" },
      { commit: "feat: voice chat mode with 6 personas + read-aloud TTS with voice selector", type: "triumph" },
      { commit: "feat: AEC echo cancellation + fix edge-tts-universal build error", type: "triumph" },
      { commit: "feat: replace landing page with marketing design", type: "triumph" },
      { commit: "fix: replace hardcoded SVG with MedOneXLogoMark for actual custom logo", type: "struggle" },
    ],
    commitCount: 65,
  },
];

export const BRAND_VALUES: BrandValue[] = [
  {
    icon: Rocket,
    title: "Ship First, Fix Later",
    desc: "Every feature starts as a rough commit. Polish comes after proof of concept. Perfect code that never ships is worse than shipped code that breaks.",
    titleAr: "اشتغل الأول، ظبط بعدين",
    descAr: "أي ميزة بتبدأ commit وحش. التنظيف بيجي بعد ما نعرف إن الفكرة بتشتغل. كود مثالي محدش استخدمه أسوأ من كود بيشتغل وبيتكسّر ويتصلح.",
    color: "#405a8d",
  },
  {
    icon: Database,
    title: "Infrastructure Honesty",
    desc: "We don't pretend the tech is flawless. EPERM errors, vendor bundling nightmares, and infinite redirect loops are part of the story.",
    titleAr: "الصراحة في التقنية",
    descAr: "مش بندّعي إن الحتة التقنية مثالية. أخطاء قاعدة البيانات، مشاكل المكتبات، redirect loops اللي مخلصش — كلها جزء من القصة.",
    color: "#10b981",
  },
  {
    icon: MessageSquareText,
    title: "Community First",
    desc: "The Telegram bot wasn't built because it was trendy. It was built because students asked. Every feature exists because a user needed it.",
    titleAr: "الطلاب أولاً",
    descAr: "بوت التليجرام اتبنى مش لأنه موضة — اتبنى لأن الطلاب طلبوه. كل ميزة في الموقع موجودة لأن في طالب احتاجها.",
    color: "#06b6d4",
  },
  {
    icon: Shield,
    title: "Security Without Ego",
    desc: "We broke auth 47 times before it worked reliably. Each break taught us something. All born from failure, not theory.",
    titleAr: "أمان من غير كبرياء",
    descAr: "التسجيل اتكسر 47 مرة قبل ما يشتغل صح. كل عُطلة علمتنا حاجة. مفيش حاجة اتبنت من النظري — كلها من الفشل.",
    color: "#8b5cf6",
  },
  {
    icon: Sparkles,
    title: "Progress Over Polish",
    desc: "The landing page was redesigned 17 times. Perfection is a direction, not a destination. We ship, we learn, we iterate.",
    titleAr: "التقدم أهم من الكمال",
    descAr: "اللاندينج بيج اتعدلت 17 مرة. الكمال اتجاه، مش وجهة. بننشر، بنتعلم، بنظبط.",
    color: "#f59e0b",
  },
];
