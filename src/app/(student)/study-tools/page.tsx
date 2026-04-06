import Link from "next/link";
import {
  BookOpen,
  Brain,
  ClipboardList,
  Layers,
  MessageSquare,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Upload,
  Zap,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { MedqsCard } from "@/components/ui/MedqsCard";
import { cn } from "@/lib/utils";

const TONE = {
  blue: "text-sky-600 dark:text-sky-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-600 dark:text-rose-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
} as const;

type Tone = keyof typeof TONE;

const FEATURES: {
  icon: typeof BookOpen;
  tone: Tone;
  title: string;
  body: string;
  href: string;
  cta: string;
  guestOk: boolean;
}[] = [
  {
    icon: Layers,
    tone: "blue",
    title: "Flip cards & active recall",
    body: "Lecture flashcards with flip, progress dots, and “Got it / Study again” so each session feels like a focused review—not endless scrolling.",
    href: "/modules",
    cta: "Open modules",
    guestOk: true,
  },
  {
    icon: ClipboardList,
    tone: "violet",
    title: "Quizzes & past papers",
    body: "Timed papers, MCQs linked to your curriculum, optional secure exam mode, and full review with explanations after you submit.",
    href: "/past-papers",
    cta: "Browse quizzes",
    guestOk: false,
  },
  {
    icon: Sparkles,
    tone: "amber",
    title: "Dr. Q — AI tutor",
    body: "Ask clinical and basic-science questions, attach files, and keep threads for deep dives—clearly labeled as a study aid, not a clinician.",
    href: "/ai-chat",
    cta: "Chat with Dr. Q",
    guestOk: false,
  },
  {
    icon: Zap,
    tone: "emerald",
    title: "AI explanations on questions",
    body: "Where enabled, get instant AI breakdowns of stems and answer choices so you learn the “why,” not just the letter.",
    href: "/dashboard-app",
    cta: "Go to dashboard",
    guestOk: false,
  },
  {
    icon: Trophy,
    tone: "rose",
    title: "Points, ranks & leaderboard",
    body: "Earn points from activity, level through ranks from Newbie to Elite, and compare with peers globally or within your semester.",
    href: "/leaderboard",
    cta: "View leaderboard",
    guestOk: true,
  },
  {
    icon: BookOpen,
    tone: "cyan",
    title: "Organized curriculum",
    body: "University → semester → module → subject → lecture. One tree for videos, notes, attachments, flashcards, and question banks.",
    href: "/modules",
    cta: "Explore lectures",
    guestOk: true,
  },
  {
    icon: Timer,
    tone: "blue",
    title: "Study Space",
    body: "Pomodoro, tasks, music links, sketching, and PDF-friendly workflow—your on-site focus desk next to the rest of MedQs.",
    href: "/space",
    cta: "Open Study Space",
    guestOk: false,
  },
  {
    icon: MessageSquare,
    tone: "violet",
    title: "Forums & study groups",
    body: "Global and semester forums, post saves, comments, and private groups so you are not studying in a silo.",
    href: "/forum",
    cta: "Join the forum",
    guestOk: true,
  },
  {
    icon: Target,
    tone: "emerald",
    title: "Question bank per lecture",
    body: "Practice MCQs tied to the same lectures as your flashcards—difficulty labels help you prioritize weak areas.",
    href: "/modules",
    cta: "Start from modules",
    guestOk: true,
  },
];

export default function StudyToolsPage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-6xl"
      eyebrow="Learn smarter"
      title="Your study stack in one place"
      subtitle="MedQs bundles the workflows students love in apps like Gizmo—flashcards, quizzes, AI help, and gamification—while staying aligned to your official medical curriculum and faculty content."
    >
      <MedqsCard className="mb-10 border-primary/15 bg-primary/[0.04]" padding="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Curriculum-first, not random decks</h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Instead of importing scattered Quizlet sets, you work inside{" "}
                <strong className="font-medium text-foreground">your semester modules</strong>. Admins can enrich lectures with notes and
                flashcards using AI tools—so your cards and questions stay consistent with what you are taught.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link
              href="/study-tools/generate"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              AI: notes → flashcards
            </Link>
            <Link
              href="/landing"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Product tour
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </MedqsCard>

      <div className="mb-6 flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold tracking-tight">Tools &amp; flows</h2>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, tone, title, body, href, cta, guestOk }) => (
          <li key={title}>
            <MedqsCard hover className="flex h-full flex-col" padding="md">
              <Icon className={cn("mb-3 h-6 w-6", TONE[tone])} aria-hidden />
              <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              {!guestOk && (
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sign in required</p>
              )}
              <Link
                href={href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </MedqsCard>
          </li>
        ))}
      </ul>

      <MedqsCard className="mt-10" padding="lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Upload className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <h3 className="font-display text-base font-semibold">Files in Dr. Q · paste notes for cards</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Attach PDFs and images in Dr. Q for Q&amp;A. For decks, use{" "}
                <Link href="/study-tools/generate" className="font-medium text-primary underline-offset-2 hover:underline">
                  flashcards from pasted text
                </Link>{" "}
                (sign in), then copy tab-separated rows into Anki or keep them for offline review. Quizlet/Anki file import can follow if you need
                it.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link
              href="/study-tools/generate"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Paste notes → cards
            </Link>
            <Link
              href="/ai-chat"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open Dr. Q
            </Link>
          </div>
        </div>
      </MedqsCard>
    </StudentPageShell>
  );
}
