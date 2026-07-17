import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Bell,
  Bookmark,
  ChevronDown,
  Play,
  BookOpen,
  ListChecks,
  Clock,
  Package,
  CheckCircle2,
  Download,
  History,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";

import heroBook from "@/assets/hero-book-brain.png";
import moduleCns from "@/assets/module-cns.jpg";
import moduleCvs from "@/assets/module-cvs.jpg";
import moduleGit from "@/assets/module-git.jpg";
import moduleEnr from "@/assets/module-enr.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medical Library — Master your clinical curriculum" },
      {
        name: "description",
        content:
          "Structured clinical modules, lectures, and question banks to master your medical curriculum.",
      },
      { property: "og:title", content: "Medical Library" },
      {
        property: "og:description",
        content: "Master your curriculum through structured clinical modules.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1240px] px-6 py-6">
        <TopBar />
        <Hero />
        <QuickActions />
        <Filters />
        <ContinueAndRecent />
        <AllModules />
      </div>
    </div>
  );
}

/* ---------------- Top bar ---------------- */

function TopBar() {
  return (
    <header className="flex items-center gap-4">
      <div className="flex flex-1 items-center gap-3 rounded-full bg-card px-4 py-2.5 shadow-[var(--shadow-card)] ring-1 ring-border/60 max-w-xl">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search modules, lectures, videos..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          ⌘ K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <IconBtn>
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
        </IconBtn>
        <IconBtn>
          <Bookmark className="h-4 w-4" />
        </IconBtn>
        <button className="flex items-center gap-2 rounded-full bg-card px-1 py-1 pr-2 shadow-[var(--shadow-card)] ring-1 ring-border/60">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-glow)] text-xs font-semibold text-primary-foreground">
            A
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="relative grid h-9 w-9 place-items-center rounded-full bg-card text-foreground shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:bg-accent">
      {children}
    </button>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="relative overflow-hidden rounded-3xl px-8 py-10">
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Medical <span className="text-[var(--primary)]">Library</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Master your curriculum through
            <br />
            structured clinical modules.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elevated)] transition hover:opacity-95">
              <Play className="h-4 w-4 fill-current" />
              Continue Last Lecture
            </button>
            <button className="grid h-11 w-11 place-items-center rounded-xl bg-card ring-1 ring-border/60">
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span>4 Modules</span>
            <Dot />
            <span>138 Lectures</span>
            <Dot />
            <span>717 Questions</span>
          </div>
        </div>

        <img
          src={heroBook}
          alt=""
          width={520}
          height={520}
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none md:block"
          style={{ maxHeight: "110%", width: "auto" }}
        />
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-border/60">
        <div className="grid grid-cols-2 gap-6">
          <Stat label="Modules" value="4" icon={<Package className="h-4 w-4" />} />
          <Stat label="Lectures" value="138" icon={<BookOpen className="h-4 w-4" />} />
          <Stat label="Questions" value="717" icon={<ListChecks className="h-4 w-4" />} />
          <Stat label="Study Hours" value="91h" icon={<Clock className="h-4 w-4" />} />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-semibold">37%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-glow)]"
              style={{ width: "37%" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />;
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground/70">{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

/* ---------------- Quick actions ---------------- */

function QuickActions() {
  const items = [
    {
      icon: <Play className="h-5 w-5 fill-current" />,
      title: "Continue",
      sub: "Pick up where you left off",
      tint: "bg-[oklch(0.95_0.05_285)] text-[var(--primary)]",
    },
    {
      icon: <Bookmark className="h-5 w-5" />,
      title: "Bookmarks",
      sub: "Your saved lectures",
      tint: "bg-[oklch(0.95_0.04_260)] text-[var(--info)]",
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Completed",
      sub: "Lectures you finished",
      tint: "bg-[oklch(0.94_0.06_155)] text-[var(--success)]",
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: "Downloads",
      sub: "Lectures for offline",
      tint: "bg-[oklch(0.95_0.06_65)] text-[var(--warning)]",
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Recent",
      sub: "Recently opened",
      tint: "bg-[oklch(0.94_0.02_265)] text-foreground",
    },
  ];
  return (
    <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map((i) => (
        <button
          key={i.title}
          className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className={`grid h-11 w-11 place-items-center rounded-full ${i.tint}`}>
            {i.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{i.title}</div>
            <div className="truncate text-xs text-muted-foreground">{i.sub}</div>
          </div>
        </button>
      ))}
    </section>
  );
}

/* ---------------- Filters ---------------- */

const FILTERS = ["All Modules", "In Progress", "Completed", "Basic Sciences", "Clinical Sciences", "Electives"];

function Filters() {
  return (
    <section className="mt-8 flex flex-wrap items-center gap-2">
      {FILTERS.map((f, idx) => (
        <button
          key={f}
          className={
            idx === 0
              ? "rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-[var(--accent-foreground)] ring-1 ring-[var(--primary)]/30"
              : "rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          }
        >
          {f}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs ring-1 ring-border/60">
          <span className="text-muted-foreground">Sort by</span>
          <span className="font-medium">Latest</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-card ring-1 ring-border/60">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

/* ---------------- Continue + Recently Updated ---------------- */

function ContinueAndRecent() {
  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.35fr]">
      <div>
        <h2 className="mb-3 text-sm font-semibold">Continue Learning</h2>
        <div
          className="relative overflow-hidden rounded-3xl p-6 text-white"
          style={{ background: "var(--gradient-cns)" }}
        >
          <img
            src={moduleCns}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute -right-6 top-1/2 h-[110%] w-auto -translate-y-1/2 object-contain opacity-90 mix-blend-screen"
          />
          <div className="relative z-10">
            <div className="text-4xl font-bold tracking-tight">CNS</div>
            <div className="mt-1 text-sm text-white/80">Central Nervous System</div>
            <div className="mt-6 flex items-center gap-4 text-xs text-white/70">
              <span>9 Subjects</span>
              <Dot />
              <span>66 Lectures</span>
              <Dot />
              <span>106 Questions</span>
            </div>
            <div className="mt-8">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/70">
                <span>Mastery Progress</span>
                <span>43%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[43%] rounded-full bg-white" />
              </div>
            </div>
            <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur ring-1 ring-white/20 hover:bg-white/25">
              <Play className="h-3.5 w-3.5 fill-current" />
              Continue
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recently Updated</h2>
          <button className="text-xs text-[var(--primary)] hover:underline">View All</button>
        </div>
        <div className="relative">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RecentCard
              code="CVS"
              title="Cardiovascular System"
              lectures={52}
              questions={92}
              progress={28}
              img={moduleCvs}
              gradient="var(--gradient-cvs)"
              barColor="oklch(0.7 0.17 155)"
            />
            <RecentCard
              code="GIT"
              title="Gastrointestinal System"
              lectures={41}
              questions={75}
              progress={33}
              img={moduleGit}
              gradient="var(--gradient-git)"
              barColor="oklch(0.75 0.17 65)"
            />
            <RecentCard
              code="ENR"
              title="Endocrine System"
              lectures={36}
              questions={64}
              progress={18}
              img={moduleEnr}
              gradient="var(--gradient-enr)"
              barColor="oklch(0.65 0.18 240)"
            />
          </div>
          <button className="absolute -right-3 top-1/2 hidden -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-card shadow-lg ring-1 ring-border/60 lg:grid">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function RecentCard({
  code,
  title,
  lectures,
  questions,
  progress,
  img,
  gradient,
  barColor,
}: {
  code: string;
  title: string;
  lectures: number;
  questions: number;
  progress: number;
  img: string;
  gradient: string;
  barColor: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 text-white"
      style={{ background: gradient, minHeight: 200 }}
    >
      <img
        src={img}
        alt=""
        loading="lazy"
        className="pointer-events-none absolute -right-4 top-1/2 h-[115%] w-auto -translate-y-1/2 object-contain opacity-80 mix-blend-screen"
      />
      <button className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/10 backdrop-blur ring-1 ring-white/20">
        <Bookmark className="h-3.5 w-3.5" />
      </button>
      <div className="relative z-10">
        <div className="text-2xl font-bold">{code}</div>
        <div className="mt-0.5 text-xs text-white/80">{title}</div>
        <div className="mt-8 flex items-center gap-3 text-[11px] text-white/70">
          <span>{lectures} Lectures</span>
          <Dot />
          <span>{questions} Questions</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: barColor }}
            />
          </div>
          <span className="text-[11px] font-semibold">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- All Modules ---------------- */

const ALL = [
  {
    code: "CNS",
    title: "Central Nervous System",
    lectures: 68,
    questions: 106,
    progress: 43,
    img: moduleCns,
    color: "var(--primary)",
    tint: "text-[var(--primary)]",
  },
  {
    code: "CVS",
    title: "Cardiovascular System",
    lectures: 52,
    questions: 92,
    progress: 28,
    img: moduleCvs,
    color: "oklch(0.7 0.17 155)",
    tint: "text-[oklch(0.55_0.17_155)]",
  },
  {
    code: "GIT",
    title: "Gastrointestinal System",
    lectures: 41,
    questions: 75,
    progress: 33,
    img: moduleGit,
    color: "oklch(0.75 0.17 65)",
    tint: "text-[oklch(0.6_0.17_65)]",
  },
  {
    code: "ENR",
    title: "Endocrine System",
    lectures: 36,
    questions: 64,
    progress: 18,
    img: moduleEnr,
    color: "oklch(0.65 0.18 240)",
    tint: "text-[oklch(0.55_0.18_240)]",
  },
];

function AllModules() {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold">All Modules</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL.map((m) => (
          <div
            key={m.code}
            className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <img
              src={m.img}
              alt=""
              loading="lazy"
              className="pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-90"
              style={{
                maskImage:
                  "linear-gradient(to left, black 30%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to left, black 30%, transparent 100%)",
              }}
            />
            <div className="relative">
              <div className={`text-xl font-bold ${m.tint}`}>{m.code}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{m.title}</div>
              <div className="mt-8 text-[11px] text-muted-foreground">
                {m.lectures} Lectures &nbsp;·&nbsp; {m.questions} Questions
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.progress}%`, background: m.color }}
                  />
                </div>
                <span className="text-[11px] font-semibold">{m.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
