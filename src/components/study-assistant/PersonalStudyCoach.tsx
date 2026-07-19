"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Save,
  Sparkles,
  ClipboardList,
  TrendingUp,
  BookOpen,
  Upload,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAIKey } from "@/hooks/useAIKey";
import type { WeeklyStudyPlanPayload } from "@/lib/gemini";

type ProgressMap = Record<string, { completion: number; note?: string }>;

type RecentAttempt = {
  id: string;
  score: number;
  createdAt: string;
  pastPaper: { title: string; module: { name: string } | null };
};

function mondayIso(d = new Date()) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const n = new Date(d);
  n.setDate(n.getDate() + diff);
  return n.toISOString().slice(0, 10);
}

function planFromProfile(raw: unknown): WeeklyStudyPlanPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as WeeklyStudyPlanPayload;
  if (!Array.isArray(d.days)) return null;
  return d;
}

export function PersonalStudyCoach() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [scheduleText, setScheduleText] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(120);
  const [worshipMinutes, setWorshipMinutes] = useState(30);
  const [otherRoutines, setOtherRoutines] = useState("");
  const [plan, setPlan] = useState<WeeklyStudyPlanPayload | null>(null);
  const [weekStartIso, setWeekStartIso] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [review, setReview] = useState<{
    feedback: string;
    gaps: string[];
    nextWeekFocus: string[];
  } | null>(null);
  const [recentQuizAttempts, setRecentQuizAttempts] = useState<RecentAttempt[]>([]);
  const [scheduleFileBusy, setScheduleFileBusy] = useState(false);
  const { getKey } = useAIKey();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/study-assistant");
      if (!res.ok) throw new Error("load");
      const p = await res.json();
      setRecentQuizAttempts(Array.isArray(p.recentQuizAttempts) ? p.recentQuizAttempts : []);
      setScheduleText(typeof p.scheduleText === "string" ? p.scheduleText : "");
      setHobbies(typeof p.hobbies === "string" ? p.hobbies : "");
      setDailyStudyMinutes(typeof p.dailyStudyMinutes === "number" ? p.dailyStudyMinutes : 120);
      setWorshipMinutes(typeof p.worshipMinutes === "number" ? p.worshipMinutes : 30);
      setOtherRoutines(typeof p.otherRoutines === "string" ? p.otherRoutines : "");
      setWeekStartIso(typeof p.weekStartIso === "string" ? p.weekStartIso : null);
      setPlan(planFromProfile(p.currentPlanJson));
      setProgress(
        p.progressJson && typeof p.progressJson === "object" && !Array.isArray(p.progressJson)
          ? (p.progressJson as ProgressMap)
          : {}
      );
    } catch {
      toast.error("Could not load study assistant");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function appendScheduleFromFile(file: File) {
    setScheduleFileBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/study-assistant/parse-schedule", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Could not read file");
        return;
      }
      const t = typeof data.text === "string" ? data.text : "";
      if (!t.trim()) {
        toast.error("No text extracted");
        return;
      }
      setScheduleText((prev) => (prev.trim() ? `${prev.trim()}\n\n---\n${t}` : t));
      toast.success("Schedule text added from file");
    } catch {
      toast.error("Upload failed");
    } finally {
      setScheduleFileBusy(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/study-assistant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleText,
          hobbies,
          dailyStudyMinutes,
          worshipMinutes,
          otherRoutines,
        }),
      });
      if (!res.ok) throw new Error("save");
      toast.success("Preferences saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveProgress(next: ProgressMap) {
    setProgress(next);
    try {
      await fetch("/api/v1/study-assistant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressJson: next }),
      });
    } catch {
      /* silent */
    }
  }

  function dayKey(dayName: string, index: number) {
    return `${weekStartIso ?? "week"}-${index}-${dayName}`;
  }

  function setDayProgress(index: number, dayName: string, completion: number, note?: string) {
    const key = dayKey(dayName, index);
    const next = { ...progress, [key]: { completion, note } };
    void saveProgress(next);
  }

  async function generatePlan() {
    setGenerating(true);
    setReview(null);
    try {
      await saveProfile();

      const geminiKey = getKey("gemini");
      if (geminiKey) {
        const schedule = scheduleText.trim().slice(0, 12_000);
        const prompt = [
          `You are a professional academic coach for medical/university students.`,
          ``,
          `The student pasted their timetable / course schedule (classes, labs, clinics). Build a realistic 7-day weekly study plan that fits around fixed commitments.`,
          ``,
          `Constraints:`,
          `- Target about ${dailyStudyMinutes} minutes of focused study per day on average (can vary slightly by day).`,
          `- Reserve at least ${worshipMinutes} minutes daily for worship / spiritual routine as its own block (label clearly).`,
          `- Include short breaks between long blocks.`,
          `- Hobbies / sport / social: ${hobbies.trim() || "(none specified)"} — protect time for these if mentioned.`,
          `- Other fixed routines the student mentioned: ${otherRoutines.trim() || "(none)"}`,
          ``,
          `Return ONLY valid JSON:`,
          `{`,
          `  "days": [`,
          `    {`,
          `      "dayName": "Saturday",`,
          `      "blocks": [`,
          `        {"start":"07:00","end":"07:30","label":"Worship / quiet time","detail":"optional"},`,
          `        {"start":"09:00","end":"11:00","label":"Topic — active recall","detail":"optional"}`,
          `      ],`,
          `      "focusTip": "One line tip"`,
          `    }`,
          `  ],`,
          `  "weeklyGoals": ["3 short bullets for the week"],`,
          `  "balanceSummary": "2-3 sentences on balance (study, rest, worship, hobbies)"`,
          `}`,
          ``,
          `Rules:`,
          `- Provide exactly 7 consecutive days starting from the first day name that makes sense for the student's schedule (use Arabic or English day names matching the schedule language if obvious, else English).`,
          `- Blocks must be plausible times (24h HH:MM).`,
          `- Do not invent exam dates not implied by the schedule text.`,
          ``,
          `STUDENT SCHEDULE / NOTES:`,
          `${schedule || "(empty — create a balanced generic medical-student week template)"}`,
        ].join("\n");

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: "You are a precise assistant. Return only valid JSON matching the requested schema." }] },
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });
        const gData = await gRes.json();
        const raw = gData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!raw) throw new Error("Empty response");

        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        const days = Array.isArray(parsed.days)
          ? parsed.days
              .filter((d: any) => d && String(d.dayName).trim())
              .map((d: any) => ({
                dayName: String(d.dayName).trim().slice(0, 40),
                focusTip: typeof d.focusTip === "string" ? d.focusTip.trim().slice(0, 300) : undefined,
                blocks: Array.isArray(d.blocks)
                  ? d.blocks
                      .filter((b: any) => b && String(b.label).trim())
                      .map((b: any) => ({
                        start: String(b.start ?? "").trim().slice(0, 8),
                        end: String(b.end ?? "").trim().slice(0, 8),
                        label: String(b.label).trim().slice(0, 200),
                        detail: typeof b.detail === "string" ? b.detail.trim().slice(0, 400) : undefined,
                      }))
                      .slice(0, 16)
                  : [],
              }))
              .slice(0, 7)
          : [];

        const plan: WeeklyStudyPlanPayload = {
          days,
          weeklyGoals: Array.isArray(parsed.weeklyGoals)
            ? parsed.weeklyGoals.map((g: any) => String(g).trim()).filter(Boolean).slice(0, 8)
            : [],
          balanceSummary: String(parsed.balanceSummary ?? "").trim().slice(0, 1200),
        };

        const weekStart = mondayIso();
        await fetch("/api/v1/study-assistant", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPlanJson: plan, weekStartIso: weekStart, progressJson: {} }),
        });
        setPlan(plan);
        setWeekStartIso(weekStart);
        setProgress({});
        toast.success("Weekly plan generated");
        return;
      }

      const res = await fetch("/api/v1/study-assistant/generate-plan", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Could not generate plan");
        return;
      }
      setPlan(planFromProfile(data.profile?.currentPlanJson));
      setWeekStartIso(typeof data.profile?.weekStartIso === "string" ? data.profile.weekStartIso : null);
      setProgress({});
      toast.success("Weekly plan generated");
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function weekReview() {
    setReviewing(true);
    try {
      const geminiKey = getKey("gemini");
      if (geminiKey) {
        const planJson = JSON.stringify(plan);
        const progressJson = JSON.stringify(progress);
        const prompt = [
          `You are a supportive study coach. The student had a weekly plan and logged daily completion (0-1 scale per day).`,
          ``,
          `Plan (JSON excerpt):`,
          `${planJson.slice(0, 8000)}`,
          ``,
          `Progress log (JSON: date -> completion 0-1 and optional notes):`,
          `${progressJson.slice(0, 4000)}`,
          ``,
          `Return ONLY JSON:`,
          `{`,
          `  "feedback": "2-4 sentences encouraging, specific",`,
          `  "gaps": ["2-5 short bullets what was weak or missing"],`,
          `  "nextWeekFocus": ["2-5 actionable priorities for next week"]`,
          `}`,
        ].join("\n");

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: "You are a precise assistant. Return only valid JSON matching the requested schema." }] },
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });
        const gData = await gRes.json();
        const raw = gData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!raw) throw new Error("Empty response");

        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        setReview({
          feedback: String(parsed.feedback ?? "").trim().slice(0, 2000),
          gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 8) : [],
          nextWeekFocus: Array.isArray(parsed.nextWeekFocus) ? parsed.nextWeekFocus.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 8) : [],
        });
        toast.success("Weekly review ready");
        return;
      }

      const res = await fetch("/api/v1/study-assistant/week-review", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Review failed");
        return;
      }
      setReview({
        feedback: String(data.feedback ?? ""),
        gaps: Array.isArray(data.gaps) ? data.gaps : [],
        nextWeekFocus: Array.isArray(data.nextWeekFocus) ? data.nextWeekFocus : [],
      });
      toast.success("Weekly review ready");
    } catch {
      toast.error("Review failed");
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          مساحة الطالب — Study Space
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الصق جدولك الأسبوعي أو ارفع صورة/PDF/نص؛ حدد وقت المذاكرة والعبادة والهوايات. المساعد يبني خطة أسبوعية متوازنة
          مع تتبع يومي ومراجعة نهاية الأسبوع.
        </p>
      </div>

      {recentQuizAttempts.length > 0 ? (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Trophy className="h-4 w-4 text-amber-500" /> آخر محاولات الكويز
          </h2>
          <ul className="space-y-2 text-sm">
            {recentQuizAttempts.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/[0.02] bg-muted/20 px-3 py-2"
              >
                <span className="font-medium text-foreground">{a.pastPaper?.title ?? "Quiz"}</span>
                <span className="text-xs text-muted-foreground">
                  {a.pastPaper?.module?.name ? `${a.pastPaper.module.name} · ` : ""}
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs font-semibold text-primary">{a.score}%</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <BookOpen className="h-4 w-4" /> Your inputs
        </h2>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="block text-xs font-medium text-muted-foreground">الجدول / Timetable</label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Upload className="h-3.5 w-3.5" />
            {scheduleFileBusy ? "جاري القراءة…" : "رفع PDF أو صورة أو .txt"}
            <input
              type="file"
              accept=".pdf,image/*,.txt,text/plain"
              className="hidden"
              disabled={scheduleFileBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void appendScheduleFromFile(f);
              }}
            />
          </label>
        </div>
        <textarea
          value={scheduleText}
          onChange={(e) => setScheduleText(e.target.value)}
          rows={8}
          placeholder="مثال: الأحد 10–12 معمل جراحة، الاثنين 8–10 محاضرة كيمياء حيوية…"
          className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          dir="auto"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hobbies / sport / social (optional)</label>
            <input
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="Football twice a week, reading…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Other fixed routines</label>
            <input
              value={otherRoutines}
              onChange={(e) => setOtherRoutines(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="Work, family, commute…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Target study minutes / day</label>
            <input
              type="number"
              min={30}
              max={720}
              value={dailyStudyMinutes}
              onChange={(e) => setDailyStudyMinutes(parseInt(e.target.value, 10) || 120)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Worship / spiritual block (minutes / day)</label>
            <input
              type="number"
              min={0}
              max={240}
              value={worshipMinutes}
              onChange={(e) => setWorshipMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveProfile()} disabled={saving} className="btn btn-secondary gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save inputs
          </button>
          <button
            type="button"
            onClick={() => void generatePlan()}
            disabled={generating}
            className="btn btn-primary gap-2"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            Generate weekly plan
          </button>
        </div>
      </section>

      {plan && plan.days.length > 0 ? (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 font-semibold">This week&apos;s plan</h2>
          {weekStartIso ? (
            <p className="mb-4 text-xs text-muted-foreground">Week starting {weekStartIso}</p>
          ) : null}
          {plan.balanceSummary ? (
            <p className="mb-4 rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{plan.balanceSummary}</p>
          ) : null}
          {plan.weeklyGoals?.length ? (
            <ul className="mb-4 list-inside list-disc text-sm text-foreground/90">
              {plan.weeklyGoals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          ) : null}
          <div className="space-y-4">
            {plan.days.map((day, idx) => {
              const key = dayKey(day.dayName, idx);
              const p = progress[key]?.completion ?? 0;
              return (
                <div key={key} className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">{day.dayName}</h3>
                    <span className="text-xs text-muted-foreground">{Math.round(p * 100)}% done</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(p * 100)}
                    onChange={(e) =>
                      setDayProgress(idx, day.dayName, parseInt(e.target.value, 10) / 100, progress[key]?.note)
                    }
                    className="mb-3 w-full accent-primary"
                  />
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {day.blocks.map((b, i) => (
                      <li key={i}>
                        <span className="font-mono text-xs text-foreground/70">
                          {b.start}–{b.end}
                        </span>{" "}
                        {b.label}
                        {b.detail ? <span className="block pl-1 text-xs opacity-80">{b.detail}</span> : null}
                      </li>
                    ))}
                  </ul>
                  {day.focusTip ? <p className="mt-2 text-xs text-primary/90">{day.focusTip}</p> : null}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => void weekReview()} disabled={reviewing} className="btn btn-secondary gap-2">
              {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              End-of-week review
            </button>
          </div>
        </section>
      ) : (
        <section className="mb-8 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-40" />
          Save your schedule and tap <strong>Generate weekly plan</strong> to see your days here.
        </section>
      )}

      {review ? (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h2 className="mb-3 font-semibold">Coach feedback</h2>
          <p className="mb-4 text-sm leading-relaxed">{review.feedback}</p>
          {review.gaps.length > 0 ? (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Gaps</p>
              <ul className="list-inside list-disc text-sm">
                {review.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.nextWeekFocus.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Next week focus</p>
              <ul className="list-inside list-disc text-sm">
                {review.nextWeekFocus.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

