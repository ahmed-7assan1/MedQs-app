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
      maxWidthClass="max-w-3xl"
      eyebrow="Account Customization"
      title="Edit profile"
      subtitle="Refine your digital identity. Your details help build trust within the MedOneX clinical community."
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Profile Photo Section */}
        <section className="relative overflow-hidden rounded-[2rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-purple-500 opacity-25 blur transition duration-500 group-hover:opacity-50" />
              <ImageUploadWithCrop
                label=""
                value={avatarUrl || ""}
                onChange={handleAvatarUpdate}
                cropShape="round"
                aspect={1}
                className="w-32 h-32 md:w-40 md:h-40"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-xl font-black dark:text-white text-slate-800 tracking-tight">Avatar & Brand</h3>
              <p className="text-sm dark:text-white/50 text-slate-500 font-medium">Upload a professional photo. Recommended size: 400x400px.</p>
            </div>
          </div>
        </section>

        {/* Telegram Linking - Integration Style */}
        <section className="relative overflow-hidden rounded-[2rem] border border-sky-500/20 dark:bg-sky-500/5 bg-sky-50 p-6 shadow-xl transition-all hover:shadow-sky-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Send className="h-24 w-24 text-sky-500" />
          </div>
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black dark:text-white text-slate-800">Telegram Hub</h3>
                <p className="text-xs font-bold dark:text-sky-400/70 text-sky-600 uppercase tracking-widest">Bot Integration</p>
              </div>
            </div>
            
            {telegramVerified ? (
              <div className="flex items-center gap-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                   <Save className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-sm font-black text-emerald-500">Securely Connected</p>
                   <p className="text-xs font-medium text-emerald-500/70">Your academic data is syncing with @MedOneX_bot</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm dark:text-white/60 text-slate-600 font-medium leading-relaxed max-w-lg">
                  Bridge your workspace to Telegram. Get instant lecture notifications, interactive study sessions, and private AI tutoring.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={telegramCode} 
                      onChange={(e) => setTelegramCode(e.target.value)}
                      placeholder="Enter activation code..."
                      className="w-full rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-black/40 bg-white px-5 py-3.5 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-400" 
                    />
                  </div>
                  <button 
                    onClick={handleLinkTelegram}
                    disabled={linking || !telegramCode}
                    className="group relative px-8 py-3.5 rounded-2xl bg-sky-500 font-black text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all disabled:opacity-50 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Connect"}
                    </span>
                  </button>
                </div>
                
                <div className="rounded-xl dark:bg-white/5 bg-slate-200/50 p-3 text-center">
                  <p className="text-[11px] font-bold dark:text-white/30 text-slate-400 uppercase tracking-wider">
                    Need a code? Message <a href="https://t.me/MedOneX_bot" target="_blank" className="text-sky-500 hover:underline">@MedOneX_bot</a> ↗
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section: Identity */}
          <div className="space-y-6 rounded-[2rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                   <User className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black dark:text-white text-slate-800">Identity</h2>
             </div>

             <div className="space-y-4">
                <div className="group">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400 group-focus-within:text-primary transition-colors">Legal Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-5 py-3.5 text-sm font-bold dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>

                <div className="group">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400 group-focus-within:text-primary transition-colors">@Handle</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-primary/50">@</span>
                    <input type="text" value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
                      className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 pl-10 pr-5 py-3.5 text-sm font-bold dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="group">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400 group-focus-within:text-primary transition-colors">Nickname</label>
                      <input type="text" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                        className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-5 py-3.5 text-sm font-bold dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                   </div>
                   <div className="group">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400 group-focus-within:text-primary transition-colors">Student ID</label>
                      <input type="text" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value.replace(/\s+/g, "") }))}
                        className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-5 py-3.5 text-sm font-bold dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                   </div>
                </div>
             </div>
          </div>

          {/* Section: Academic Hub */}
          <div id="academic" className="space-y-6 rounded-[2rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-6 shadow-xl scroll-mt-24">
             <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                   <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black dark:text-white text-slate-800">Academic Context</h2>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Institution</label>
                  <MedqsSelect
                    value={selectedUni}
                    onChange={(e) => {
                      setSelectedUni(e.target.value);
                      setSelectedFaculty("");
                      setSelectedYear("");
                      setSelectedSem("");
                    }}
                    className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-4 py-3 text-sm font-bold"
                  >
                    <option value="">Select University...</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </MedqsSelect>
                </div>

                {selectedUni && uniFaculties.length > 0 && (
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Faculty</label>
                    <MedqsSelect
                      value={selectedFaculty}
                      onChange={(e) => {
                        setSelectedFaculty(e.target.value);
                        setSelectedYear("");
                        setSelectedSem("");
                      }}
                      className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-4 py-3 text-sm font-bold"
                    >
                      <option value="">Select Faculty...</option>
                      {uniFaculties.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </MedqsSelect>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Year</label>
                    <MedqsSelect
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedSem("");
                      }}
                      disabled={!selectedUni || (uniFaculties.length > 0 && !selectedFaculty)}
                      className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-4 py-3 text-sm font-bold disabled:opacity-40"
                    >
                      <option value="">Year...</option>
                      {filteredYears.map((y) => (
                        <option key={y.id} value={y.id}>L{y.yearNumber}</option>
                      ))}
                    </MedqsSelect>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Semester</label>
                    <MedqsSelect
                      value={selectedSem}
                      onChange={(e) => setSelectedSem(e.target.value)}
                      disabled={!selectedYear}
                      className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-4 py-3 text-sm font-bold disabled:opacity-40"
                    >
                      <option value="">Sem...</option>
                      {filteredSems.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </MedqsSelect>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Section: Reach & Privacy */}
        <section className="rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-8 shadow-xl">
           <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/2 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                       <Phone className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-black dark:text-white text-slate-800">Reach & Privacy</h2>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="group">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400 transition-colors group-focus-within:text-orange-500">Global Contact</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+20 1XX XXX XXXX"
                        className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-5 py-4 text-sm font-bold dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                    </div>

                    <div className="space-y-3">
                       {[
                         { field: "phoneVisible", label: "Public Contact", sub: "Display phone on profile", icon: Phone },
                         { field: "hideRank", label: "Ghost Mode", sub: "Hide from leaderboards", icon: User },
                         { field: "isPrivate", label: "Private Profile", sub: "Invite-only access", icon: Save },
                       ].map(({ field, label, sub }) => (
                         <div key={field} onClick={() => setForm((f: any) => ({ ...f, [field]: !f[field] }))} className="group flex cursor-pointer items-center justify-between rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-4 transition-all hover:bg-white/10">
                            <div className="space-y-0.5">
                               <p className="text-sm font-black dark:text-white text-slate-800">{label}</p>
                               <p className="text-[11px] font-bold dark:text-white/30 text-slate-400 uppercase tracking-widest">{sub}</p>
                            </div>
                            <div className={cn("relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all duration-300", (form as any)[field] ? "bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-slate-300 dark:bg-white/10")}>
                               <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300", (form as any)[field] ? "translate-x-6" : "translate-x-1")} />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="lg:w-1/2 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                       <Palette className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-black dark:text-white text-slate-800">Visuals & Story</h2>
                 </div>

                 <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Bio / About</label>
                      <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4} maxLength={500}
                        placeholder="Clinical interests, research, goals..."
                        className="w-full resize-none rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-5 py-4 text-sm font-bold dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                      <div className="mt-2 flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase tracking-tighter dark:text-white/20 text-slate-300">{form.bio.length}/500 Characters</span>
                         <div className="h-1 flex-1 mx-4 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(form.bio.length / 500) * 100}%` }} />
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <button key={t} onClick={() => setTheme(t)}
                          className={cn("rounded-xl border py-3 text-[11px] font-black uppercase tracking-widest transition-all",
                            theme === t ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20" : "dark:border-white/5 border-slate-200 dark:text-white/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5")}>
                          {t}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Final Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
           <button onClick={() => router.back()} className="flex-1 rounded-[1.5rem] border dark:border-white/10 border-slate-200 py-4 text-sm font-black dark:text-white text-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-all uppercase tracking-widest">
              Discard Changes
           </button>
           <button onClick={handleSave} disabled={saving}
             className="group relative flex-[2] overflow-hidden rounded-[1.5rem] bg-primary py-4 text-sm font-black text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-[0.98] disabled:opacity-60">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             <div className="flex items-center justify-center gap-3">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span className="uppercase tracking-widest">{saving ? "Syncing Workspace..." : "Commit Changes"}</span>
             </div>
           </button>
        </div>

      </div>
    </StudentPageShell>
  );
}

