"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, Phone, BookOpen, Palette, Send } from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";

interface University  { id: string; name: string }
interface Faculty    { id: string; name: string; universityId: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string; facultyId?: string | null }
interface Semester   { id: string; name: string; academicYearId: string }

export default function EditProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();

  const [form, setForm] = useState({
    name: "",
    handle: "",
    nickname: "",
    bio: "",
    phone: "",
    phoneVisible: false,
    hideRank: false,
    isPrivate: false,
    studentId: "",
    instagramUrl: "",
    facebookUrl: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [telegramVerified, setTelegramVerified] = useState(false);
  const [telegramCode, setTelegramCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [selectedUni,    setSelectedUni]    = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedYear,   setSelectedYear]   = useState("");
  const [selectedSem,    setSelectedSem]    = useState("");

  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties,    setFaculties]    = useState<Faculty[]>([]);
  const [years,        setYears]        = useState<AcademicYear[]>([]);
  const [semesters,    setSemesters]    = useState<Semester[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, unisRes, yrsRes, semsRes, facsRes] = await Promise.all([
          fetch("/api/v1/auth/me"),
          fetch("/api/v1/universities"),
          fetch("/api/v1/academic-years"),
          fetch("/api/v1/semesters"),
          fetch("/api/v1/faculties"),
        ]);
        if (cancelled) return;
        if (meRes.status === 401) {
          router.replace("/login");
          return;
        }
        const me      = meRes.ok  ? await meRes.json()  : null;
        const unis    = unisRes.ok ? await unisRes.json() : [];
        const yrsRaw  = yrsRes.ok  ? await yrsRes.json()  : [];
        const semsRaw = semsRes.ok ? await semsRes.json() : [];
        const facsRaw = facsRes.ok ? await facsRes.json() : [];
        const yrs     = unwrapApiList<AcademicYear>(yrsRaw);
        const sems    = unwrapApiList<Semester>(semsRaw);
        const facs    = Array.isArray(facsRaw) ? facsRaw as Faculty[] : [];
        if (me && typeof me === "object") {
          setForm({
            name:          me.name          ?? "",
            handle:        me.handle        ?? "",
            nickname:      me.nickname      ?? "",
            bio:           me.bio           ?? "",
            phone:         me.phone         ?? "",
            phoneVisible:  me.phoneVisible  ?? false,
            hideRank:      me.hideRank      ?? false,
            isPrivate:     me.isPrivate     ?? false,
            studentId:     me.studentId     ?? "",
            instagramUrl:  me.instagramUrl  ?? "",
            facebookUrl:   me.facebookUrl   ?? "",
          });
          setAvatarUrl(me.image ?? null);
          setTelegramVerified(me.telegramVerified ?? false);
          setSelectedUni(me.universityId ?? "");
          setSelectedFaculty(me.facultyId ?? "");
          const mySem = sems.find((s) => s.id === me.semesterId);
          if (mySem) setSelectedYear(mySem.academicYearId);
          setSelectedSem(me.semesterId ?? "");
        }
        setUniversities(Array.isArray(unis) ? unis : []);
        setFaculties(facs);
        setYears(yrs);
        setSemesters(sems);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const uniFaculties  = faculties.filter((f) => f.universityId === selectedUni);
  const filteredYears = years.filter((y) =>
    y.universityId === selectedUni &&
    (selectedFaculty ? y.facultyId === selectedFaculty : !y.facultyId)
  );
  const filteredSems  = semesters.filter((s) => s.academicYearId === selectedYear);

  async function handleAvatarUpdate(url: string) {
    setAvatarUrl(url);
    await fetch("/api/v1/auth/avatar-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  async function handleLinkTelegram() {
    if (!telegramCode.trim()) return;
    setLinking(true);
    try {
      const res = await fetch("/api/v1/auth/link-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: telegramCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to link Telegram");
        return;
      }
      toast.success("Telegram linked successfully!");
      setTelegramVerified(true);
      setTelegramCode("");
    } catch {
      toast.error("An error occurred");
    } finally {
      setLinking(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        handle:       form.handle.trim()       || null,
        nickname:     form.nickname.trim()     || null,
        studentId:    form.studentId.trim()    || null,
        instagramUrl: form.instagramUrl.trim() || null,
        facebookUrl:  form.facebookUrl.trim()  || null,
        universityId: selectedUni.trim()       ? selectedUni    : null,
        facultyId:    selectedFaculty.trim()   ? selectedFaculty : null,
        semesterId:   selectedSem.trim()       ? selectedSem    : null,
      };
      const res = await fetch("/api/v1/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err?.error === "string" ? err.error : "Could not save profile");
        return;
      }
      toast.success("Profile updated!");
      router.replace(`/profile/me?updated=${Date.now()}`);
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <StudentPageShell maxWidthClass="max-w-xl">
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </StudentPageShell>
    );

  return (
    <StudentPageShell
      maxWidthClass="max-w-xl"
      eyebrow="Account"
      title="Edit profile"
      subtitle="Keep your identity, university, and preferences aligned with your cohort — clinical trainees expect accuracy and trust."
    >
      <div className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
          <ImageUploadWithCrop
            label="Profile Photo"
            value={avatarUrl || ""}
            onChange={handleAvatarUpdate}
            cropShape="round"
            aspect={1}
            className="w-full"
          />
        </div>

        {/* Personal info */}
        <div className="rounded-2xl border border-white/[0.02] bg-white/[0.02] p-5 lg:p-6 space-y-5">
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-[#AFA9EC]" /><h2 className="font-semibold text-white">Personal Info</h2></div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Display Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.02] bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#534AB7] transition-all" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">@Handle (Unique)</label>
            <input type="text" value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
              placeholder="e.g. med.student7"
              className="w-full rounded-xl border border-white/[0.02] bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#534AB7] transition-all" />
            <p className="mt-1.5 text-[11px] text-white/30">Your unique public identifier.</p>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Nickname</label>
            <input type="text" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              placeholder="e.g. Doc"
              className="w-full rounded-xl border border-white/[0.02] bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#534AB7] transition-all" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Student ID</label>
            <input type="text" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value.replace(/\s+/g, "") }))}
              placeholder="At least 6 chars"
              className="w-full rounded-xl border border-white/[0.02] bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#534AB7] transition-all" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Bio <span className="opacity-60">(optional)</span></label>
            <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} maxLength={500}
              placeholder="Tell other students about yourself..."
              className="w-full resize-none rounded-xl border border-white/[0.02] bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#534AB7] placeholder:text-white/20 transition-all" />
            <p className="mt-1.5 text-right text-[11px] text-white/30">{form.bio.length}/500</p>
          </div>
        </div>

        {/* Phone */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><h2 className="font-semibold">Phone Number</h2></div>
          <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+20 100 000 0000"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
          <div onClick={() => setForm((f) => ({ ...f, phoneVisible: !f.phoneVisible }))} className="flex cursor-pointer items-center gap-3">
            <div className={cn("relative flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors", form.phoneVisible ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.phoneVisible ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <span className="text-sm">Show phone on my profile</span>
          </div>
          <div onClick={() => setForm((f) => ({ ...f, hideRank: !f.hideRank }))} className="flex cursor-pointer items-center gap-3">
            <div className={cn("relative flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors", form.hideRank ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.hideRank ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <span className="text-sm">Hide my name from the public leaderboard</span>
          </div>
          <div onClick={() => setForm((f) => ({ ...f, isPrivate: !f.isPrivate }))} className="flex cursor-pointer items-center gap-3">
            <div className={cn("relative flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors", form.isPrivate ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.isPrivate ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <span className="text-sm">Private profile — visitors see only limited details</span>
          </div>
        </div>

        {/* Telegram Linking */}
        <div className="rounded-2xl border border-white/[0.02] bg-white/[0.02] p-5 lg:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-[#0088cc]" />
            <h2 className="font-semibold text-white">Telegram Account</h2>
          </div>
          
          {telegramVerified ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-bold text-emerald-500">Your account is linked to Telegram! ✅</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-white/60 leading-relaxed">
                Link your account to the <b>MedOneX Bot</b> to receive lecture files, take interactive quizzes, and chat with Dr. Q directly on Telegram.
              </p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={telegramCode} 
                  onChange={(e) => setTelegramCode(e.target.value)}
                  placeholder="Enter 6-digit code..."
                  className="flex-1 rounded-xl border border-white/[0.02] bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0088cc] transition-all" 
                />
                <button 
                  onClick={handleLinkTelegram}
                  disabled={linking || !telegramCode}
                  className="px-6 rounded-xl bg-[#0088cc] text-sm font-bold text-white hover:bg-[#007bb5] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link Now"}
                </button>
              </div>
              
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/40 italic">
                  Don't have a code? Open <a href="https://t.me/MedOneX_bot" target="_blank" className="text-[#0088cc] hover:underline">@MedOneX_bot</a> and click <b>Start</b> then <b>Login</b>.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Social Links</h2>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Instagram URL</label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
              placeholder="https://instagram.com/username"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Facebook URL</label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              placeholder="https://facebook.com/username"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Academic */}
        <div id="academic" className="scroll-mt-24 rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><h2 className="font-semibold">University & semester</h2></div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">University</label>
            <MedqsSelect
              value={selectedUni}
              onChange={(e) => {
                setSelectedUni(e.target.value);
                setSelectedFaculty("");
                setSelectedYear("");
                setSelectedSem("");
              }}
              className="w-full"
            >
              <option value="">Select university...</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </MedqsSelect>
            {universities.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                No universities in the database yet. Ask an administrator to add institutions.
              </p>
            )}
          </div>

          {/* Faculty — only shown if this university has faculties */}
          {selectedUni && uniFaculties.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Faculty (كلية)</label>
              <MedqsSelect
                value={selectedFaculty}
                onChange={(e) => {
                  setSelectedFaculty(e.target.value);
                  setSelectedYear("");
                  setSelectedSem("");
                }}
                className="w-full"
              >
                <option value="">Select faculty...</option>
                {uniFaculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </MedqsSelect>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Academic year</label>
            <MedqsSelect
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedSem("");
              }}
              disabled={!selectedUni || (uniFaculties.length > 0 && !selectedFaculty)}
              className="w-full"
            >
              <option value="">Select year...</option>
              {filteredYears.map((y) => (
                <option key={y.id} value={y.id}>Year {y.yearNumber}</option>
              ))}
            </MedqsSelect>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Semester</label>
            <MedqsSelect
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              disabled={!selectedYear}
              className="w-full"
            >
              <option value="">Select semester...</option>
              {filteredSems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </MedqsSelect>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">Changing faculty or semester updates the content, papers and forums you can access.</p>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /><h2 className="font-semibold">Appearance</h2></div>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={cn("flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize transition-all",
                  theme === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all active:scale-[0.98]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </StudentPageShell>
  );
}

