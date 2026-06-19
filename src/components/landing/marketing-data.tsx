import { Brain, BookOpen, Layers, Target, MessageSquare, Clock, BarChart3, TrendingUp, GraduationCap, Sparkles, Zap, Users, Calendar, Bell, Check } from "lucide-react";

export const NAV_LINKS = ["Features", "How It Works", "Testimonials", "Pricing"];

export const HERO = {
  badge: "Trusted by 10,000+ medical students",
  title: "Master Medicine",
  titleAccent: "Faster. Smarter.",
  subtitle: "The AI-powered platform that adapts to your curriculum. Personalized learning paths, real-time analytics, and your personal AI tutor—all in one place.",
  cta: "Start for Free",
  ctaLink: "/register",
  secondaryCta: "Watch Demo",
  secondaryLink: "#demo",
};

export const FEATURES = [
  { icon: Brain, title: "AI-Powered Learning", desc: "Adaptive algorithms that identify your weak areas and personalize your study path in real-time.", color: "#00FF88" },
  { icon: Layers, title: "Curated Curriculum", desc: "Structured content mapped to your exact university syllabus with module-by-module progression.", color: "#00D4FF" },
  { icon: Target, title: "Smart Analytics", desc: "Track your mastery with precision. Know exactly what you've covered and what needs review.", color: "#7C3AED" },
  { icon: BookOpen, title: "50K+ MCQ Bank", desc: "Massive repository of past exam questions with detailed AI-generated explanations for every answer.", color: "#F59E0B" },
  { icon: MessageSquare, title: "Medical Community", desc: "Connect with peers and doctors in moderated forums. Share insights and study together.", color: "#EF4444" },
  { icon: Clock, title: "Spaced Repetition", desc: "Built-in flashcard system using proven memory techniques for long-term clinical retention.", color: "#10B981" },
];

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: <>From enrollment to <span className="text-muted-foreground/70">exam mastery</span></>,
  subtitle: "Three simple steps. No learning curve required.",
  steps: [
    { n: "01", title: "Study", desc: "Access curated lectures, AI-generated notes, and interactive flashcards tailored to your curriculum." },
    { n: "02", title: "Practice", desc: "Test yourself with thousands of past exam questions. AI pinpoints your weak spots automatically." },
    { n: "03", title: "Master", desc: "Track your progress with detailed analytics. Know exactly when you're ready for the real exam." },
  ],
};

export const SHOWCASE = {
  badge: "Built for med students",
  title: <>Your personal AI tutor,<br /><span className="text-muted-foreground/70">available 24/7</span></>,
  subtitle: "Ask Dr. Q anything. It understands your curriculum and explains concepts like a senior doctor.",
  bullets: [
    "AI-generated explanations for every MCQ",
    "Voice-enabled Q&A with natural language",
    "Smart flashcards from your lecture notes",
    "Offline access — study anywhere, anytime",
  ],
};

export const TESTIMONIALS = {
  eyebrow: "Loved by students",
  title: "Words from future doctors",
  quotes: [
    { q: "MedOneX completely transformed how I prepare for exams. The AI explanations are better than any textbook.", name: "Dr. Sara Ahmed", role: "Cairo University" },
    { q: "The spaced repetition system is a game-changer. I retained 3x more information in half the study time.", name: "Ahmed Hassan", role: "Ain Shams University" },
    { q: "Having the entire curriculum organized with AI assistance feels like having a personal tutor 24/7.", name: "Laila Mohamed", role: "Alexandria University" },
  ],
};

export const PRICING = {
  eyebrow: "Pricing",
  title: "Free for everyone",
  subtitle: "No paywalls. No hidden fees. Medical education should be accessible to all.",
  plans: [
    { name: "Starter", price: "Free", period: "", desc: "Perfect for exploring what MedOneX offers.", features: ["Basic MCQ access", "Community forums", "Progress tracking", "Limited AI queries"], cta: "Get Started Free", featured: false },
    { name: "Pro", price: "Free", period: "", desc: "For serious students committed to excellence.", features: ["Unlimited MCQ access", "Full AI assistant", "Spaced repetition", "Analytics dashboard", "Offline access", "Priority support"], cta: "Start Pro Trial", featured: true },
    { name: "Enterprise", price: "Free", period: "", desc: "For institutions and study groups.", features: ["Everything in Pro", "Team management", "Custom curriculum", "API access", "Dedicated support", "Bulk enrollment"], cta: "Contact Sales", featured: false },
  ],
};

export const CTA = {
  title: "Start mastering medicine today",
  subtitle: "Join thousands of medical students already using MedOneX to study smarter, not harder.",
  primaryCta: "Start Free",
  secondaryCta: "Get a Demo",
};

export const FOOTER = {
  brand: "MedOneX",
  tagline: "AI-powered medical education platform. Study smarter, not harder.",
  columns: [
    { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "AI Chat", href: "/ai-chat" }, { label: "Download", href: "/download" }] },
    { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Founders", href: "/founders" }, { label: "Community", href: "/community" }, { label: "Leaderboard", href: "/leaderboard" }] },
    { title: "Support", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Contact", href: "mailto:support@medonex.com" }, { label: "FAQ", href: "/#faq" }] },
  ],
  copyright: "MedOneX. All rights reserved.",
};

export const BRANDS = ["Cairo University", "Ain Shams", "Alexandria", "Mansoura", "Assiut", "Zagazig"];

export const EASE = [0.22, 1, 0.36, 1] as const;

export const VIEWPORT = { once: true, amount: 0.25 } as const;
