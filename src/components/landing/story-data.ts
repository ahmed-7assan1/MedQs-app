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
  milestones: Milestone[];
  commitCount: number;
};

export type BrandValue = {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "spark",
    period: "Apr 4 — Apr 11, 2026",
    icon: Rocket,
    title: "The Spark",
    subtitle: "A single deploy commit and a dream",
    narrative:
      "On April 4, 2026, the first commit hit the repository — a bare deploy. Within hours the forums were live, the AI was chatting, and study spaces took shape. The team moved at breakneck speed: quizzes, OCR, PWA support, all in the first week.",
    struggle:
      "Windows EPERM errors plagued every database operation. `prisma generate` would lock files mid-build. The solution was to split push from generate — a duct-tape fix that kept the team moving.",
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
    period: "Apr 12 — Apr 24, 2026",
    icon: Database,
    title: "Foundation Wars",
    subtitle: "Upload services, landing iterations, and the first scale wall",
    narrative:
      "The first real battles were fought over infrastructure. Image uploads cycled through Uploadcare, UploadThing, and Cloudinary — each migration triggered by Vercel's 10-second timeout limit. The landing page was redesigned 7 times in a single day. ESLint escaped quotes broke production builds. But the foundation held.",
    struggle:
      "Vercel's 10s function timeout forced every upload path to be re-architected. `escaped quote in jsx` caused a silent build failure at 3 AM. The team learned: never trust a build that passes locally.",
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
    period: "Apr 26 — May 10, 2026",
    icon: MessageSquareText,
    title: "The Telegram Campaign",
    subtitle: "YouTube sync, Colab workers, and the 50-commit day",
    narrative:
      "The Telegram Bot started as a simple AI chat. Within two weeks it became a full ecosystem: YouTube migration via Google Colab, Selenium automation, academic navigation trees, quiz polls, voice support, and a dedicated Mini App. May 7 alone saw 50 commits — the single most intense day of development. The bot now serves as the primary content delivery channel for thousands of students.",
    struggle:
      "Colab workers kept crashing mid-transfer. The Selenium setup in Colab was fragile — cookies expired, Chrome drivers mismatched, and the entire pipeline had to be rebuilt with robust error handling. The webhook security layer required 3 rewrites to pass Telegram's strict validation.",
    milestones: [
      { commit: "feat: implement AI-to-Colab youtube video migration logic", type: "triumph" },
      { commit: "feat: complete bulk telegram transfer system with file support", type: "triumph" },
      { commit: "feat: enable selenium uploader with cookies in colab worker", type: "triumph" },
      { commit: "fix: robust selenium setup for google colab", type: "struggle" },
      { commit: "Add Telegram bot integration with Dr. Q AI", type: "triumph" },
      { commit: "Major Bot Upgrade: English-first UI, Academic Navigation Tree, Voice Support", type: "triumph" },
      { commit: "Full rewrite of Telegram command handlers", type: "pivot" },
      { commit: "Final professional Telegram bot update: Group silence, bundled lecture content", type: "triumph" },
      { commit: "feat: implement premium Telegram Mini App (TMA)", type: "triumph" },
    ],
    commitCount: 87,
  },
  {
    id: "performance",
    period: "May 10 — May 12, 2026",
    icon: Gauge,
    title: "Performance or Death",
    subtitle: "50k CCU, Firebase migration, and the 5.2MB logo",
    narrative:
      "The platform hit a wall. Postgres polling was crushing the database under load. The solution was radical: Firebase real-time infrastructure with P2P failover via Puter.js. Postgres polling was eliminated entirely. A 5.2MB logo file was discovered and removed. Antd and grok-chat were uninstalled. The Supabase migration began. TTFB dropped from 3s to under 200ms.",
    struggle:
      "The 5.2MB logo was being served on every page load. Postgres queries spiked to 2000/minute during peak hours. The Firebase migration had to be done without downtime — every query had to work with both databases simultaneously during the cutover.",
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
    period: "May 13 — May 22, 2026",
    icon: Shield,
    title: "The Auth Vortex",
    subtitle: "Infinite redirects, Cosmic Glassmorphism, and the Excalidraw nightmare",
    narrative:
      "Auth nearly broke the team. What started as a UI overhaul — Cosmic Glassmorphism login screens — spiraled into 30+ commits of redirect loop debugging. Middleware, layout guards, client-side checks: every approach failed. The team reverted to a pre-migration state just to breathe. Meanwhile, the DrawMed whiteboard integration hit the worst build bug yet: Excalidraw's broken exports field required 10 consecutive fixes, from Webpack aliases to full vendor bundling.",
    struggle:
      "The infinite redirect loop consumed 3 days. `chore: temporarily disable middleware firewall redirects` was the confession of defeat. Excalidraw's package.json exports field was incompatible with Next.js — each fix revealed another layer of breakage, culminating in a hand-vendored 2000-line bundle.",
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
    period: "May 25 — Present",
    icon: Sparkles,
    title: "The MedOneX Rebirth",
    subtitle: "BYOK revolution, voice mode, and brand identity",
    narrative:
      "The final chapter is still being written. The AI infrastructure was rebuilt around Bring Your Own Key — students can now use their own API keys across 15+ providers. Voice mode with continuous listening, echo cancellation, and Edge TTS turned the AI into a conversation partner. The brand evolved from MedQs to MedOneX. And the landing page, after 17 design iterations, finally tells the real story — not a marketing facade, but the truth of what was built.",
    struggle:
      "The voice mode required three separate technologies to work together: browser SpeechRecognition (flaky across browsers), Edge TTS via server route (WebSocket limitations), and an AEC system built from scratch. The Excalidraw nightmare taught the team a hard lesson about dependency choices. Every brand decision was questioned — until the story became more important than the logo.",
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
    desc: "Every feature starts as a rough commit. Polish comes after proof of concept. We've learned that perfect code that never ships is worse than shipped code that breaks.",
    color: "#405a8d",
  },
  {
    icon: Database,
    title: "Infrastructure Honesty",
    desc: "We don't pretend the tech is flawless. EPERM errors, vendor bundling nightmares, and infinite redirect loops are part of the story. The only sin is not documenting the fix.",
    color: "#10b981",
  },
  {
    icon: MessageSquareText,
    title: "Community First",
    desc: "The Telegram bot wasn't built because it was trendy. It was built because students asked. Every feature — from BYOK to voice mode — exists because a user needed it.",
    color: "#06b6d4",
  },
  {
    icon: Shield,
    title: "Security Without Ego",
    desc: "We broke auth 47 times before it worked reliably. Each break taught us something. SUPER_ADMIN bypasses, PKCE flows, magic links — all born from failure, not theory.",
    color: "#8b5cf6",
  },
  {
    icon: Sparkles,
    title: "Progress Over Polish",
    desc: "The landing page was redesigned 17 times. The logo went through 9 iterations in 3 days. Perfection is a direction, not a destination. We ship, we learn, we iterate.",
    color: "#f59e0b",
  },
];
