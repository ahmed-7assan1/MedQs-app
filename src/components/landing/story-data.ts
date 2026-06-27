import {
  Sparkles, Code, AlertTriangle, Brain, ArrowLeftRight, Shield,
  MessageSquare, CheckCircle, Star, Lightbulb, Heart, Users,
  type LucideIcon,
} from "lucide-react";

export type Chapter = {
  id: string;
  period: string;
  icon: LucideIcon;
  title: string;
  narrative: string;
  narrativeAr: string;
  milestones: string[];
  commitCount?: number;
};

export type BrandValue = {
  icon: LucideIcon;
  title: string;
  desc: string;
  titleAr: string;
  descAr: string;
  color: string;
};

export type StatItem = {
  num: string;
  labelAr: string;
  labelEn: string;
  theme: string;
  numColor: string;
  detailTitleAr: string;
  detailTitleEn: string;
  itemsAr: string[];
  itemsEn: string[];
};

export type FeatureItem = {
  label: string;
  labelEn: string;
  color: string;
};

export type ReviewItem = {
  q: string;
  qEn: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
};

export const CHAPTER_THEMES = ["blue", "cyan", "coral", "purple", "amber", "coral", "teal", "pink"];

export const DATES = ["2026", "2026", "2026", "2026", "2026", "2026", "2026", "2026"];

export const STATS_DATA: StatItem[] = [
  {
    num: "6+",
    labelAr: "محركات AI",
    labelEn: "AI Engines",
    theme: "s-blue",
    numColor: "#00D4FF",
    detailTitleAr: "محركات الذكاء الاصطناعي",
    detailTitleEn: "AI Engines",
    itemsAr: ["OpenAI (GPT-4, GPT-4o)", "Google (Gemini 1.5 Pro/Flash)", "Anthropic (Claude 3.5)", "Meta (Llama 3)", "Mistral AI", "DeepSeek"],
    itemsEn: ["OpenAI (GPT-4, GPT-4o)", "Google (Gemini 1.5 Pro/Flash)", "Anthropic (Claude 3.5)", "Meta (Llama 3)", "Mistral AI", "DeepSeek"],
  },
  {
    num: "15+",
    labelAr: "ميزة مختلفة",
    labelEn: "Different Features",
    theme: "s-purple",
    numColor: "#A78BFA",
    detailTitleAr: "الميزات",
    detailTitleEn: "Features",
    itemsAr: ["أسئلة MCQ تفاعلية", "فيديوهات شرح", "بطاقات مذاكرة", "Dr. Q AI", "منتدى اجتماعي", "بوت تيليجرام", "لوح رسم طبي", "أطلس تشريح ثلاثي الأبعاد", "تطبيق موبايل", "غرف دراسة", "مسابقات مباشرة"],
    itemsEn: ["MCQ Questions", "Video Lectures", "Flashcards", "Dr. Q AI", "Social Forum", "Telegram Bot", "DrawMed Board", "3D Anatomy Atlas", "Mobile App", "Study Rooms", "Live Quizzes"],
  },
  {
    num: "300+",
    labelAr: "تحديث وإصلاح",
    labelEn: "Updates & Fixes",
    theme: "s-teal",
    numColor: "#00FFB2",
    detailTitleAr: "التحديثات والإصلاحات",
    detailTitleEn: "Updates & Fixes",
    itemsAr: ["تحسينات أداء", "تطوير واجهة المستخدم", "إصلاح أخطاء", "تحديثات أمان", "ميزات جديدة", "تحسين API", "تحديثات الموبايل", "تحديث محتوى"],
    itemsEn: ["Performance Optimization", "UI/UX Improvements", "Bug Fixes", "Security Patches", "New Features", "API Enhancements", "Mobile Updates", "Content Updates"],
  },
];

export const FEATURES: FeatureItem[] = [
  { label: "أسئلة MCQ", labelEn: "MCQ Questions", color: "#1A6BFF" },
  { label: "فيديوهات شرح", labelEn: "Videos", color: "#00D4FF" },
  { label: "بطاقات مذاكرة", labelEn: "Flashcards", color: "#8B5CF6" },
  { label: "Dr. Q AI", labelEn: "Dr. Q AI", color: "#F472B6" },
  { label: "منتدى اجتماعي", labelEn: "Social Forum", color: "#FBBF24" },
  { label: "بوت تيليجرام", labelEn: "Telegram Bot", color: "#00FFB2" },
  { label: "لوح رسم طبي", labelEn: "Medical Board", color: "#1A6BFF" },
  { label: "أطلس تشريح", labelEn: "Anatomy Atlas", color: "#00D4FF" },
  { label: "تطبيق موبايل", labelEn: "Mobile App", color: "#8B5CF6" },
  { label: "غرف دراسة", labelEn: "Study Rooms", color: "#FF6B6B" },
  { label: "مسابقات مباشرة", labelEn: "Live Quizzes", color: "#FBBF24" },
  { label: "نقاط وترتيب", labelEn: "Leaderboard", color: "#00FFB2" },
];

export const FUTURE_ITEMS_AR = [
  "كل كلية طب في مصر تلاقي نفسها على MedOneX",
  "Dr. Q يبقى مساعد طبي حقيقي مدرب على بيانات عربية",
  "امتحانات OSCE افتراضية — الطالب يتدرب مع مريض رقمي",
];

export const FUTURE_ITEMS_EN = [
  "Every medical school in Egypt on MedOneX",
  "Dr. Q becomes a real Arabic-trained medical assistant",
  "Virtual OSCE exams — train with a digital patient",
];

export const REVIEWS: ReviewItem[] = [
  { q: "MedOneX غير طريقة مذاكرتي خالص. النظام بتاع التكرار المتباعد خلاني احتفظ بالمعلومات ٣ أضعاف.", qEn: "MedOneX completely changed my study method. The spaced repetition system helped me retain 3x more.", name: "أحمد علي", nameEn: "Ahmed Ali", role: "جامعة القاهرة", roleEn: "Cairo University" },
  { q: "Dr. Q AI بيفهم أسئلتي بالعربي ويرد بدقة. حرفيًا زي مدرس خصوصي 24 ساعة.", qEn: "Dr. Q AI understands my Arabic questions and responds accurately. Like a 24/7 personal tutor.", name: "سارة محمود", nameEn: "Sara Mahmoud", role: "جامعة عين شمس", roleEn: "Ain Shams University" },
  { q: "البطاقات التفاعلية والأسئلة اليومية خلقت عندي عادة مذاكرة مستمرة. أول مرة أذاكر بانتظام.", qEn: "The flashcards and daily quizzes built a consistent study habit. First time I've studied regularly.", name: "محمد حسن", nameEn: "Mohamed Hassan", role: "جامعة الإسكندرية", roleEn: "Alexandria University" },
  { q: "بفضل MedOneX جبت أول مرة امتحاناتي. التقييمات والتحليل واللي كانوا عايزينه.", qEn: "Thanks to MedOneX I aced my exams for the first time. The analytics showed me exactly what I needed.", name: "نورا إبراهيم", nameEn: "Noura Ibrahim", role: "جامعة المنصورة", roleEn: "Mansoura University" },
  { q: "التجميعات وأسئلة السنوات السابقة متاحة بسهولة. وفّر عليا وقت كبير في البحث.", qEn: "Previous year questions and compilations are easily available. Saved me so much time.", name: "لينا يوسف", nameEn: "Lina Youssef", role: "جامعة الزقازيق", roleEn: "Zagazig University" },
  { q: "غرف الدراسة التفاعلية خلّت المذاكرة الجماعية أسهل من الواتساب.", qEn: "Interactive study rooms made group studying easier than WhatsApp.", name: "عمر عبدالله", nameEn: "Omar Abdullah", role: "جامعة أسيوط", roleEn: "Assiut University" },
  { q: "منصة متكاملة — فيديوهات، أسئلة، بطاقات، و Dr. Q. مش محتاج حاجة تاني.", qEn: "All-in-one platform — videos, questions, flashcards, and Dr. Q. Don't need anything else.", name: "مريم وليد", nameEn: "Mariam Walid", role: "جامعة طنطا", roleEn: "Tanta University" },
  { q: "الترتيب والتنافس بين الطلاب حفزني أذاكر أكتر. نظام النقاط عبقري.", qEn: "The leaderboard competition motivated me to study more. The points system is genius.", name: "خالد أحمد", nameEn: "Khaled Ahmed", role: "جامعة بنها", roleEn: "Benha University" },
  { q: "بوت التيليجرام والموقع متزامنين — أذاكر في أي مكان ومن غير ما افتح الموقع.", qEn: "Telegram bot and site stay in sync — I study anywhere without opening the site.", name: "هدى جمال", nameEn: "Hoda Gamal", role: "جامعة المنوفية", roleEn: "Menoufia University" },
  { q: "أتلس التشريح ثلاثي الأبعاد خلاني أتخيل كل حرفيًا. الحفظ بقى فهم.", qEn: "The 3D anatomy atlas helped me visualize everything. Memorization turned into understanding.", name: "يوسف سامي", nameEn: "Youssef Sami", role: "جامعة بورسعيد", roleEn: "Port Said University" },
  { q: "دعم المجتمع في المنتدى كبير. أي سؤال بتلاقي إجابة من دفعة تانية.", qEn: "The community forum support is massive. Any question gets answered by other batches.", name: "دينا كمال", nameEn: "Dina Kamal", role: "جامعة السويس", roleEn: "Suez University" },
  { q: "حرفيًا حسّن مستوايا في المواد النظرية. بقيت بفهم بدل ما أحفظ.", qEn: "It literally improved my level in theoretical subjects. I understand instead of memorize.", name: "أسماء عاطف", nameEn: "Asma Atef", role: "جامعة قناة السويس", roleEn: "Suez Canal University" },
  { q: "المسابقات المباشرة (Live Quizzes) بتساعدني أراجع بسرعة قبل الامتحان.", qEn: "Live quizzes help me review quickly before the exam.", name: "إسلام ناصر", nameEn: "Islam Nasser", role: "جامعة كفر الشيخ", roleEn: "Kafr El Sheikh University" },
  { q: "التطبيق على الموبايل سهل وسريع. بذاكر في المواصلات.", qEn: "The mobile app is fast and easy. I study during commutes.", name: "منى شريف", nameEn: "Mona Sherif", role: "جامعة الفيوم", roleEn: "Fayoum University" },
  { q: "MedOneX مش مجرد موقع — هو نظام تعليمي متكامل. الطالب دلوقتي عنده كل حاجة.", qEn: "MedOneX isn't just a site — it's a complete education system. Students now have everything.", name: "إيمان رجب", nameEn: "Eman Ragab", role: "جامعة بني سويف", roleEn: "Beni Suef University" },
];

export const CHAPTERS: Chapter[] = [
  {
    id: "beginning",
    period: "البداية",
    icon: Sparkles,
    title: "مشكلة حقيقية في حياة طالب حقيقي",
    narrative:
      "Imagine a second-year medical student. 400 questions to study. The exam is in two weeks. Resources are scattered — a video here, a PDF there, notes from a friend, questions from last year in a messy WhatsApp group. 'Why isn't there one place for everything? Questions, videos, files — in one spot?' That simple question was the starting point. Not a company idea, not a business plan, not a meeting. Just a feeling that something was missing.",
    narrativeAr:
      "تخيل طالب طب في السنة الثانية. أمامه 400 سؤال للمذاكرة. الامتحان بعد أسبوعين. المصادر مبعثرة — فيديو هنا، PDF هناك، ملاحظات من زميل، وأسئلة من سنة فاتت في مجموعة واتساب مش مرتبة.\n\n\"ليه مفيش مكان واحد فيه كل حاجة؟ الأسئلة، الفيديوهات، الملفات — في نفس المكان؟\"\n\nهذا السؤال البسيط كان نقطة البداية. مش فكرة شركة، مش خطة عمل، مش اجتماع. مجرد إحساس بإن في حاجة ناقصة.",
    milestones: [
      "ولادة فكرة MedQs — اختصاراً لـ Medical Questions",
      "سؤال واحد: ليه مفيش مكان واحد لكل حاجة؟",
      "بداية 2025 — الفكرة كانت مجرد صفحة فاضية",
    ],
  },
  {
    id: "first-step",
    period: "الخطوة الأولى",
    icon: Code,
    title: "صفحة فاضية وحلم كبير",
    narrative:
      "The beginning was very simple. A website that shows questions and answers. Nothing more. The idea: a student opens the site, answers questions, sees their results. That's it. The first name: MedQs — short for Medical Questions. But after the first week, new questions started appearing... 'What if the student could track their progress? See what they got wrong?' 'What about explanation videos next to questions?' 'Flashcards like Anki? PDF files? A forum?' Each question opened a door to a new idea. And the new idea opened two more doors.",
    narrativeAr:
      "البداية كانت بسيطة جداً. موقع بيعرض أسئلة وإجاباتها. مش أكتر. الفكرة إن الطالب يفتح الموقع، يجاوب أسئلة، يشوف إجاباته. خلاص.\n\nالاسم الأول كان: MedQs — اختصار لـ \"Medical Questions\"\n\nلكن بعد أول أسبوع من الشغل، بدأت أسئلة جديدة تطرح نفسها...\n\n\"طب وإيه رأيك لو الطالب يقدر يتابع تقدمه؟ ويشوف غلط في إيه؟\"\n\"وإيه رأيك لو فيه فيديوهات شرح جنب الأسئلة؟\"\n\"وبطاقات مذاكرة زي Anki؟ وملفات PDF؟ ومنتدى للأسئلة؟\"\n\nكل سؤال كان يفتح باب لفكرة جديدة. والفكرة الجديدة كانت تفتح باب لفكرتين. هكذا بدأ الموقع يكبر — فكرة فوق فكرة.",
    milestones: [
      "MedQs: مجرد أسئلة وإجاباتها",
      "من سؤال لجواب — أول user flow",
      "فكرة تجر فكرة: فيديوهات، Flashcards، PDF",
    ],
  },
  {
    id: "first-crisis",
    period: "الأزمة الأولى",
    icon: AlertTriangle,
    title: "لما الموقع وقع في أول ليلة",
    narrative:
      "The site was deployed online. The link was shared. The first users arrived. And then... the site stopped. The database refused to connect. Errors appeared that no one understood. 2 AM. The problem was that the site was trying to talk to the database the wrong way — imagine calling someone with the wrong number. Same idea. The problem was fixed after 4 hours of searching. The lesson: everything working alone doesn't mean it'll work together.",
    narrativeAr:
      "تم رفع الموقع على الإنترنت. تم مشاركة الرابط. جاء أول مستخدمين. وبعدين...\n\nالموقع وقف. قاعدة البيانات رفضت الاتصال. الأكواد بدأت تبعت رسائل خطأ بالعربي ما بفهمهاش حد. الساعة 2 الصبح.\n\nالمشكلة كانت إن الموقع كان بيحاول يكلم قاعدة البيانات بطريقة غلط. تخيل إنك بتحاول تكلم حد بالتليفون بس الرقم غلط — نفس الفكرة بالظبط.\n\nالمشكلة اتحلت بعد 4 ساعات من البحث.\nالدرس: كل حاجة بتشتغل لوحدها، مش معناه هتشتغل مع بعض.",
    milestones: [
      "أول رفع على الإنترنت — أول مستخدمين",
      "الموقع وقع الساعة 2 الصبح",
      "4 ساعات بحث عشان نعرف المشكلة",
    ],
  },
  {
    id: "ai-revolution",
    period: "الفكرة اللي غيرت كل حاجة",
    icon: Brain,
    title: "لما الذكاء الاصطناعي دخل الصورة",
    narrative:
      "At some point, an idea came: 'What if there was an AI assistant that understands medicine and can explain questions?' Dr. Q was born — a digital doctor that explains, asks, and trains you on clinical questions. The idea was brilliant. The execution was... very hard. AI services cost money, and the site is free. The solution? Connect 6 different AI companies. If one stops, the second works. If the second stops, the third works. Result: Dr. Q never stops. No matter what happens in the background, the student keeps asking and answering.",
    narrativeAr:
      "في مرحلة معينة، جاءت فكرة: \"إيه لو في مساعد ذكاء اصطناعي بيفهم في الطب ويقدر يشرح الأسئلة؟\"\n\nوُلد Dr. Q — دكتور رقمي بيشرح، بيسأل، بيتدرب معاك على أسئلة الكلينيك.\n\nالفكرة كانت رائعة. التنفيذ كان... صعب جداً. المشكلة إن خدمات الذكاء الاصطناعي بتكلف فلوس، والموقع مجاني. الحل؟\n\n\"نربط بـ 6 شركات ذكاء اصطناعي مختلفة. لو واحدة وقفت، التانية تشتغل. لو التانية وقفت، التالتة تشتغل.\"\n\nالنتيجة: Dr. Q مابيوقفش. مهما حصل في الخلفية، الطالب بيفضل يسأل ويجاوب.",
    milestones: [
      "د. Q: دكتور رقمي بيشرح الأسئلة",
      "6 شركات ذكاء اصطناعي في الخلفية",
      "المستخدم مش بيلاحظ لو شركة وقعت",
    ],
  },
  {
    id: "rebrand",
    period: "لحظة التحول الكبير",
    icon: ArrowLeftRight,
    title: "MedQs مات. MedOneX وُلد.",
    narrative:
      "After months of work, something strange happened. The site was no longer a 'question site'. It had become 6+ AI engines, 15+ features, 300+ updates. The name 'MedQs' no longer expressed the truth. The decision came quickly: MedOneX — everything medical in one place. The 'X' represents the future, expansion, the beautiful unknown. 'We didn't just change the name. We changed the entire identity. The logo, the colors, the message. It was like baptizing the site anew.'",
    narrativeAr:
      "بعد شهور من الشغل، حدث شيء غريب. الموقع لم يعد \"موقع أسئلة\". أصبح فيه 6+ محركات ذكاء اصطناعي، 15+ ميزة مختلفة، 300+ تحديث وإصلاح.\n\nالاسم \"MedQs\" لم يعد يعبر عن الحقيقة. القرار جاء سريعاً:\n\nMedOneX — كل حاجة طبية في مكان واحد. الـ \"X\" ترمز للمستقبل، للتوسع، للمجهول الجميل.\n\n\"مش بس غيرنا الاسم. غيرنا الهوية كلها. الشعار، الألوان، الرسالة. كأننا عمدنا الموقع من جديد.\"",
    milestones: [
      "الموقع بقى أكبر من مجرد أسئلة",
      "MedOneX: اسم جديد، هوية جديدة",
      "الـ X: رمز المستقبل والتوسع",
    ],
  },
  {
    id: "hardest-crisis",
    period: "الأزمة الأصعب",
    icon: Shield,
    title: "لما كل حاجة اتكسرت في نفس الوقت",
    narrative:
      "At one point, the entire database was replaced — imagine moving all your furniture to a new house while still living in it. The site had to keep working for students while all data was being transferred. In one day: login stopped working, questions disappeared, videos stopped playing, and 3 different error messages appeared from 3 different places at the same time. The fix took 48 continuous hours. But in the end, everything came back better than before — and faster. The lesson: every crisis ends with a stronger system. Every problem is solved with deeper understanding.",
    narrativeAr:
      "في مرحلة، تم تغيير قاعدة البيانات بالكامل — تخيل إنك بتنقل كل أثاث بيتك لبيت جديد وانت مش واقف الشغل. الموقع لازم يفضل شغال للطلاب وانت بتنقل كل البيانات.\n\nفي يوم واحد: الـ login وقف، الأسئلة اختفت، الفيديوهات بطلت تشتغل، وجاءت 3 رسائل خطأ مختلفة من 3 أماكن مختلفة في نفس الوقت.\n\nالحل أخذ 48 ساعة متواصلة. لكن في النهاية، كل حاجة رجعت أحسن من قبل — وأسرع.\n\nالدرس: كل أزمة بتنتهي بنظام أقوى. كل مشكلة بتنحل بفهم أعمق.",
    milestones: [
      "تغيير قاعدة البيانات بالكامل والموقع شغال",
      "3 مشاكل مختلفة في نفس اليوم",
      "48 ساعة شغل متواصل عشان التصليح",
    ],
  },
  {
    id: "users",
    period: "أفكار من المستخدمين",
    icon: MessageSquare,
    title: "ليه مفيش... — الجملة اللي بنيت الموقع",
    narrative:
      "Every major feature in MedOneX came from a simple question a student asked. 'Why isn't there a Telegram bot I can study from on the bus?' Result: A full Telegram bot with quizzes, explanations, and Q&A. 'Why isn't there a drawing board to explain things to classmates?' Result: DrawMed — an interactive medical whiteboard with AI. 'Why isn't there an interactive anatomy atlas?' Result: Anatomy Atlas — a map of the human body with AI explanations for every organ. The logic is simple: the student knows what's missing. Our role is to build it.",
    narrativeAr:
      "كل ميزة كبيرة في MedOneX جاءت من سؤال بسيط قاله طالب:\n\n\"ليه مفيش بوت تيليجرام أقدر أذاكر منه وانا في الميكروباص؟\"\nالنتيجة: بوت تيليجرام متكامل بيعمل اختبارات، بيشرح، بيرد على الأسئلة.\n\n\"ليه مفيش لوحة رسم أشرح عليها للزملاء؟\"\nالنتيجة: DrawMed — لوح رسم طبي تفاعلي مع ذكاء اصطناعي.\n\n\"ليه مفيش أطلس تشريح تفاعلي؟\"\nالنتيجة: Anatomy Atlas — خريطة جسم الإنسان مع شرح AI لكل عضو.\n\nالمنطق بسيط: الطالب هو اللي يعرف إيه اللي ناقص. الدور إننا نبنيه.",
    milestones: [
      "بوت تيليجرام: عشان المذاكرة في الميكروباص",
      "DrawMed: لوح رسم طبي تفاعلي",
      "Anatomy Atlas: أطلس تشريح مع AI",
    ],
  },
  {
    id: "today",
    period: "اليوم",
    icon: CheckCircle,
    title: "من سؤال واحد لنظام متكامل",
    narrative:
      "MedOneX today is not a question site. It's a complete medical education system: MCQ questions, explanation videos, flashcards, Dr. Q AI, social forum, Telegram bot, medical whiteboard, anatomy atlas, mobile app, study rooms, live quizzes, points and leaderboard. 'We started with one question: Why is learning hard? And the answer is still being built.'",
    narrativeAr:
      "MedOneX اليوم مش موقع أسئلة. هو نظام تعليم طبي متكامل فيه:\n\nأسئلة MCQ — فيديوهات شرح — بطاقات مذاكرة — Dr. Q AI\nمنتدى اجتماعي — بوت تيليجرام — لوح رسم طبي — أطلس تشريح\nتطبيق موبايل — غرف دراسة — مسابقات مباشرة — نقاط وترتيب\n\n\"بدأنا بسؤال واحد: ليه التعلم صعب؟ والإجابة لسه بتتشاف.\"",
    milestones: [
      "12+ ميزة مختلفة في نظام واحد",
      "آلاف الطلاب يستخدموا المنصة يومياً",
      "من سؤال واحد لمنصة متكاملة",
    ],
  },
  {
    id: "future",
    period: "المستقبل",
    icon: Star,
    title: "الفصل اللي لسه ما اتكتبش",
    narrative:
      "The story isn't over. There are chapters still being written: Every medical school in Egypt finds itself on MedOneX. Dr. Q becomes a real medical assistant trained on Arabic data. Virtual OSCE exams — students train with a digital patient. Every big idea started with a student saying 'Why isn't there...'. The coming chapters will start with the same sentence.",
    narrativeAr:
      "القصة مخلصتش. في فصول جاية لسه بتتكتب:\n\nكل كلية طب في مصر تلاقي نفسها على MedOneX\nDr. Q يبقى مساعد طبي حقيقي مدرب على بيانات عربية\nامتحانات OSCE افتراضية — الطالب يتدرب مع مريض رقمي\n\nكل فكرة كبيرة بدأت بطالب قال \"ليه مفيش...\". الفصول الجاية هتبدأ بنفس الجملة.",
    milestones: [
      "كل كلية طب في مصر على MedOneX",
      "د. Q مساعد طبي مدرب على عربي",
      "امتحانات virtual OSCE",
    ],
  },
];

export const BRAND_VALUES: BrandValue[] = [
  {
    icon: Lightbulb,
    title: "Start With Why",
    desc: "Every feature starts with a student's question. Not a business requirement, not a spec document — just someone saying 'Why isn't there...'",
    titleAr: "ابدأ بـ ليه",
    descAr: "أي ميزة بتبدأ بسؤال طالب. مش requirement من شركة، ولا document. مجرد واحد قال \"ليه مفيش...\"",
    color: "#405a8d",
  },
  {
    icon: Heart,
    title: "Free At Heart",
    desc: "Medical education shouldn't have a paywall. Every feature, every tool, every AI — free. Always.",
    titleAr: "مجاني من القلب",
    descAr: "التعليم الطبي مش سلعة. كل ميزة، كل أداة، كل AI — مجاناً. دا مش قرار تجاري، دا مبدأ.",
    color: "#f43f5e",
  },
  {
    icon: Shield,
    title: "Resilience Over Perfection",
    desc: "Dr. Q connects to 6 AI providers so it never stops. 48-hour migrations with zero downtime. We break, we fix, we get stronger.",
    titleAr: "المرونة أهم من الكمال",
    descAr: "د. Q مربوط بـ 6 شركات AI عشان ميقفش. 48 ساعة ترحيل بدون توقف. بنتكسّر، بنصلح، بنقوى.",
    color: "#10b981",
  },
  {
    icon: Users,
    title: "Built For Students, By Listening",
    desc: "Telegram bot, DrawMed, Anatomy Atlas — all born from one student saying one sentence. The user shapes the product.",
    titleAr: "مبني بالاستماع للطلاب",
    descAr: "بوت التليجرام، DrawMed، Anatomy Atlas — كلهم من جملة قالها طالب. المستخدم هو اللي بيشكل المنتج.",
    color: "#8b5cf6",
  },
  {
    icon: Star,
    title: "Always Chapter One",
    desc: "The story is never finished. There's always a next chapter, a next feature, a next 'Why isn't there...' to answer.",
    titleAr: "دايماً في أول الطريق",
    descAr: "القصة مبتخلصش. دايم في فصل جاي، ميزة جديدة، سؤال جديد بنرد عليه.",
    color: "#f59e0b",
  },
];
