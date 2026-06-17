import { Brain, BookOpen, Layers, Target, MessageSquare, Clock, BarChart3, TrendingUp } from "lucide-react";

export const ACCENT = "#00FF88";
export const ACCENT2 = "#00D4FF";
export const PURPLE = "#7C3AED";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
  { href: "#blog", label: "Blog" },
];

export const FEATURES = [
  { icon: Brain, title: "AI-Powered Learning", desc: "Adaptive algorithms that identify your weak areas and personalize your study path in real-time.", color: "#00FF88" },
  { icon: Layers, title: "Curated Curriculum", desc: "Structured content mapped to your exact university syllabus with module-by-module progression.", color: "#00D4FF" },
  { icon: Target, title: "Smart Analytics", desc: "Track your mastery with precision. Know exactly what you've covered and what needs review.", color: "#7C3AED" },
  { icon: BookOpen, title: "50K+ MCQ Bank", desc: "Massive repository of past exam questions with detailed AI-generated explanations for every answer.", color: "#F59E0B" },
  { icon: MessageSquare, title: "Medical Community", desc: "Connect with peers and doctors in moderated forums. Share insights and study together.", color: "#EF4444" },
  { icon: Clock, title: "Spaced Repetition", desc: "Built-in flashcard system using proven memory techniques for long-term clinical retention.", color: "#10B981" },
];

export const BENTO_ITEMS = [
  { icon: Brain, title: "AI Tutor Available 24/7", desc: "Ask Dr. Q anything. It understands your curriculum and explains concepts like a senior doctor.", color: ACCENT, stat: "99.9%", statLabel: "Uptime" },
  { icon: BarChart3, title: "Real-time Progress", desc: "See your mastery score grow with every lecture, quiz, and flashcard session.", color: ACCENT2, stat: "2.5x", statLabel: "Faster Learning" },
  { icon: TrendingUp, title: "Exam Pass Rate", desc: "Students using MedOneX consistently score higher. Our data speaks for itself.", color: PURPLE, stat: "94%", statLabel: "Pass Rate" },
];

export const TESTIMONIALS = [
  { name: "Dr. Sara Ahmed", role: "Cairo University", quote: "MedOneX completely transformed how I prepare for exams. The AI explanations are better than any textbook.", rating: 5, initials: "SA" },
  { name: "Ahmed Hassan", role: "Ain Shams University", quote: "The spaced repetition system is a game-changer. I retained 3x more information in half the study time.", rating: 5, initials: "AH" },
  { name: "Laila Mohamed", role: "Alexandria University", quote: "Having the entire curriculum organized with AI assistance feels like having a personal tutor 24/7.", rating: 5, initials: "LM" },
];

export const PRICING_PLANS = [
  {
    name: "Starter", price: "Free", description: "Perfect for exploring what MedOneX offers.",
    features: ["Basic MCQ access", "Community forums", "Progress tracking", "Limited AI queries"],
    cta: "Get Started Free", popular: false,
  },
  {
    name: "Pro", price: "Free", description: "For serious students committed to excellence.",
    features: ["Unlimited MCQ access", "Full AI assistant", "Spaced repetition", "Analytics dashboard", "Offline access", "Priority support"],
    cta: "Start Pro Trial", popular: true,
  },
  {
    name: "Enterprise", price: "Free", description: "For institutions and study groups.",
    features: ["Everything in Pro", "Team management", "Custom curriculum", "API access", "Dedicated support", "Bulk enrollment"],
    cta: "Contact Sales", popular: false,
  },
];

export const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Atlas", href: "/atlas" },
    { label: "AI Chat", href: "/ai-chat" },
    { label: "Videos", href: "/videos" },
    { label: "Download", href: "/download" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Founders", href: "/founders" },
    { label: "Community", href: "/community" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  Support: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "mailto:support@medonex.com" },
    { label: "FAQ", href: "/#faq" },
  ],
};
