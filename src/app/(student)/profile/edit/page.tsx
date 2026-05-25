"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Loader2, User, Phone, BookOpen, Palette, Send, Sparkles, ShieldCheck, ChevronLeft, Camera, Trash2, LogOut, ShieldAlert, Cpu, CircleCheck, XCircle } from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";
import { signOut } from "next-auth/react";
import { uploadFiles } from "@/lib/uploadthing-react";

interface University { id: string; name: string }
interface Faculty { id: string; name: string; universityId: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string; facultyId?: string | null }
interface Semester { id: string; name: string; academicYearId: string }

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "identity";
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
    instagramUrl: "",
    facebookUrl: "",
    useCustomKey: false,
    personalGeminiKey: "",
    personalOpenAIKey: "",
    personalGroqKey: "",
    personalOpenRouterKey: "",
    personalXAIKey: "",
    personalAnthropicKey: "",
    personalSiliconFlowKey: "",
    personalSiliconFlowModel: "",
    personalSiliconFlowUrl: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [telegramVerified, setTelegramVerified] = useState(false);
  const [telegramCode, setTelegramCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [selectedUni, setSelectedUni] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSem, setSelectedSem] = useState("");

  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const TABS = [
    { id: "identity", label: "Identity", icon: User },
    { id: "branding", label: "Branding", icon: Sparkles },
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "telegram", label: "Telegram", icon: Send },
    { id: "privacy", label: "Privacy", icon: ShieldCheck },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "ai_agents", label: "AI & BYOK", icon: Cpu },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, unisRes, yrsRes, semsRes, facsRes] = await Promise.all([
          fetch(`/api/v1/auth/me?t=${Date.now()}`),
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
        const me = meRes.ok ? await meRes.json() : null;
        const unis = unisRes.ok ? await unisRes.json() : [];
        const yrsRaw = yrsRes.ok ? await yrsRes.json() : [];
        const semsRaw = semsRes.ok ? await semsRes.json() : [];
        const facsRaw = facsRes.ok ? await facsRes.json() : [];
        const yrs = unwrapApiList<AcademicYear>(yrsRaw);
        const sems = unwrapApiList<Semester>(semsRaw);
        const facs = Array.isArray(facsRaw) ? facsRaw as Faculty[] : [];
        if (me && typeof me === "object") {
          setForm({
            name: me.name ?? "",
            handle: me.handle ?? "",
            nickname: me.nickname ?? "",
            bio: me.bio ?? "",
            phone: me.phone ?? "",
            phoneVisible: me.phoneVisible ?? false,
            hideRank: me.hideRank ?? false,
            isPrivate: me.isPrivate ?? false,
            studentId: me.studentId ?? "",
            instagramUrl: me.instagramUrl ?? "",
            instagramUrl: me.instagramUrl ?? "",
            facebookUrl: me.facebookUrl ?? "",
            useCustomKey: me.useCustomKey ?? false,
            personalGeminiKey: me.personalGeminiKey ?? "",
            personalOpenAIKey: me.personalOpenAIKey ?? "",
            personalGroqKey: me.personalGroqKey ?? "",
            personalOpenRouterKey: me.personalOpenRouterKey ?? "",
            personalXAIKey: me.personalXAIKey ?? "",
            personalAnthropicKey: me.personalAnthropicKey ?? "",
            personalSiliconFlowKey: me.personalSiliconFlowKey ?? "",
            personalSiliconFlowModel: me.personalSiliconFlowModel ?? "",
            personalSiliconFlowUrl: me.personalSiliconFlowUrl ?? "",
          });
          setAvatarUrl(me.image ?? null);
          setCoverUrl(me.coverImage ?? null);
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

  const uniFaculties = faculties.filter((f) => f.universityId === selectedUni);
  const filteredYears = years.filter((y) =>
    y.universityId === selectedUni &&
    (selectedFaculty ? y.facultyId === selectedFaculty : !y.facultyId)
  );
  const filteredSems = semesters.filter((s) => s.academicYearId === selectedYear);

  async function handleAvatarUpdate(url: string, file?: File) {
    setAvatarUrl(url);
    if (file) {
      setAvatarFile(file);
    } else if (url === "") {
      // User removed the image
      setAvatarFile(null);
      await fetch("/api/v1/auth/avatar-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "" }),
      });
    }
  }

  async function handleCoverUpdate(url: string, file?: File) {
    setCoverUrl(url);
    if (file) setCoverFile(file);
    else if (url === "") setCoverFile(null);
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
      let finalAvatarUrl = avatarUrl;
      let finalCoverUrl = coverUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const res = await uploadFiles("avatar", { files: [avatarFile] });
        if (res?.[0]?.url) {
           finalAvatarUrl = res[0].url;
           await fetch("/api/v1/auth/avatar-url", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ url: finalAvatarUrl }),
           });
        }
      }

      // Upload cover if changed
      if (coverFile) {
        const res = await uploadFiles("avatar", { files: [coverFile] });
        if (res?.[0]?.url) {
           finalCoverUrl = res[0].url;
        }
      }

      const payload = {
        ...form,
        handle: form.handle.trim() || null,
        nickname: form.nickname.trim() || null,
        studentId: form.studentId.trim() || null,
        instagramUrl: form.instagramUrl.trim() || null,
        facebookUrl: form.facebookUrl.trim() || null,
        universityId: selectedUni.trim() ? selectedUni : null,
        facultyId: selectedFaculty.trim() ? selectedFaculty : null,
        semesterId: selectedSem.trim() ? selectedSem : null,
        coverImage: finalCoverUrl,
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

  async function handleDeleteAccount() {
    if (!confirm("Are you absolutely sure? This will delete all your data permanently.")) return;
    try {
      const res = await fetch("/api/v1/auth/profile", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted.");
        signOut({ callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account.");
      }
    } catch {
      toast.error("Error occurred.");
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
      maxWidthClass="max-w-4xl"
      eyebrow="Clinical Workspace"
      title="Environment Editor"
      subtitle="Configure your professional presence and academic synchronization."
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
        
        {/* Floating Top Header (Fixed on scroll) */}
        <div className="sticky top-20 z-[50] flex items-center justify-between gap-4 rounded-3xl border dark:border-white/10 border-slate-200 dark:bg-black/60 bg-white/80 backdrop-blur-xl p-3 shadow-2xl transition-all">
           <div className="flex items-center gap-3 pl-2">
              <button 
                onClick={() => router.push("/settings")}
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary">Editing Phase</p>
                 <p className="text-sm font-black dark:text-white text-slate-800">{TABS.find(t => t.id === activeTab)?.label}</p>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push("/settings")}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest dark:text-white/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Syncing..." : "Save"}
              </button>
           </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 border-b dark:border-white/5 border-slate-200">
           {TABS.map((tab) => (
             <button
               key={tab.id}
               onClick={() => router.push(`/profile/edit?tab=${tab.id}`)}
               className={cn(
                 "flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                 activeTab === tab.id 
                   ? "dark:bg-white/10 bg-slate-100 dark:text-white text-slate-900 shadow-sm" 
                   : "dark:text-white/40 text-slate-400 hover:text-primary"
               )}
             >
               <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "")} />
               {tab.label}
             </button>
           ))}
        </div>

        <div className="min-h-[400px]">
          {/* TAB: IDENTITY */}
          {activeTab === "identity" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <section className="space-y-6 rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black dark:text-white text-slate-800">Identity Details</h2>
                        <p className="text-xs font-bold dark:text-white/30 text-slate-400 uppercase tracking-widest">Public Information</p>
                     </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="group">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Full Display Name</label>
                      <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 py-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>

                    <div className="group">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Unique Handle</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary/50">@</span>
                        <input type="text" value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
                          className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 pl-12 pr-6 py-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="group">
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Professional Nickname</label>
                          <input type="text" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                            className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 py-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                       </div>
                       <div className="group">
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Student Serial ID</label>
                          <input type="text" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value.replace(/\s+/g, "") }))}
                            className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 py-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                       </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Bio / About Me</label>
                      <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={5} maxLength={500}
                        placeholder="Clinical interests, research, goals..."
                        className="w-full resize-none rounded-[2rem] border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 py-5 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      <div className="mt-3 flex justify-between items-center px-2">
                         <span className="text-[10px] font-black uppercase tracking-tighter dark:text-white/20 text-slate-300">{form.bio.length}/500</span>
                         <div className="h-1 w-32 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(form.bio.length / 500) * 100}%` }} />
                         </div>
                      </div>
                    </div>
                  </div>
               </section>
            </div>
          )}

          {/* TAB: BRANDING */}
          {activeTab === "branding" && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
               {/* Cover Image Section */}
               <section className="relative overflow-hidden rounded-[3rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-4 shadow-xl">
                  <ImageUploadWithCrop
                    value={coverUrl || ""}
                    onChange={handleCoverUpdate}
                    cropShape="rect"
                    aspect={16/6}
                    className="relative h-48 w-full rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-white/5"
                  >
                     {coverUrl ? (
                       <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                     ) : (
                       <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-white/10">
                          <Palette className="h-12 w-12" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                           <Camera className="h-8 w-8 text-white" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Cover Photo</span>
                        </div>
                     </div>
                  </ImageUploadWithCrop>
                  
                  {/* Avatar Overlay */}
                  <div className="relative -mt-16 ml-10 flex items-end gap-6">
                    <ImageUploadWithCrop
                      value={avatarUrl || ""}
                      onChange={handleAvatarUpdate}
                      cropShape="round"
                      aspect={1}
                    >
                       <div className="h-32 w-32 rounded-full border-4 dark:border-[#131220] border-white bg-slate-200 overflow-hidden shadow-2xl">
                          <img src={avatarUrl || "/placeholder-user.jpg"} alt="Avatar" className="h-full w-full object-cover" />
                       </div>
                       <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white" />
                       </div>
                    </ImageUploadWithCrop>
                    <div className="pb-4">
                       <h3 className="text-xl font-black dark:text-white text-slate-800">Visual Branding</h3>
                       <p className="text-[10px] font-black dark:text-white/40 text-slate-400 uppercase tracking-widest">Personalize your public aesthetic</p>
                    </div>
                  </div>
               </section>

               <section className="rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Palette className="h-5 w-5" />
                     </div>
                     <h2 className="text-lg font-black dark:text-white text-slate-800">Social Connections</h2>
                  </div>
                  <div className="grid gap-4">
                    {[
                      { field: "instagramUrl", label: "Instagram Profile", placeholder: "https://instagram.com/...", color: "hover:ring-pink-500/30" },
                      { field: "facebookUrl", label: "Facebook Profile", placeholder: "https://facebook.com/...", color: "hover:ring-blue-600/30" },
                    ].map((link) => (
                      <div key={link.field} className="group">
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">{link.label}</label>
                        <input
                          type="url"
                          value={(form as any)[link.field]}
                          onChange={(e) => setForm((f) => ({ ...f, [link.field]: e.target.value }))}
                          placeholder={link.placeholder}
                          className={cn(
                            "w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 py-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 transition-all",
                            link.color
                          )}
                        />
                      </div>
                    ))}
                  </div>
               </section>
            </div>
          )}

          {/* TAB: ACADEMIC */}
          {activeTab === "academic" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <section className="space-y-8 rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                        <BookOpen className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black dark:text-white text-slate-800">Academic Context</h2>
                        <p className="text-xs font-bold dark:text-emerald-400/50 text-emerald-600 uppercase tracking-widest">Cohort Alignment</p>
                     </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="mb-3 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">University Institution</label>
                         <MedqsSelect
                           value={selectedUni}
                           onChange={(e) => {
                             setSelectedUni(e.target.value);
                             setSelectedFaculty("");
                             setSelectedYear("");
                             setSelectedSem("");
                           }}
                           className="w-full h-14 rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 text-sm font-bold"
                         >
                           <option value="">Select University...</option>
                           {universities.map((u) => (
                             <option key={u.id} value={u.id}>{u.name}</option>
                           ))}
                         </MedqsSelect>
                       </div>

                       {selectedUni && (
                         <div>
                           <label className="mb-3 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Medical Faculty</label>
                           <MedqsSelect
                             value={selectedFaculty}
                             onChange={(e) => {
                               setSelectedFaculty(e.target.value);
                               setSelectedYear("");
                               setSelectedSem("");
                             }}
                             className="w-full h-14 rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 text-sm font-bold"
                           >
                             <option value="">Select Faculty...</option>
                             {uniFaculties.map((f) => (
                               <option key={f.id} value={f.id}>{f.name}</option>
                             ))}
                           </MedqsSelect>
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Academic Level</label>
                        <MedqsSelect
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedSem("");
                          }}
                          disabled={!selectedUni || (uniFaculties.length > 0 && !selectedFaculty)}
                          className="w-full h-14 rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 text-sm font-bold disabled:opacity-30"
                        >
                          <option value="">Year...</option>
                          {filteredYears.map((y) => (
                            <option key={y.id} value={y.id}>Year {y.yearNumber}</option>
                          ))}
                        </MedqsSelect>
                      </div>
                      <div>
                        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Study Semester</label>
                        <MedqsSelect
                          value={selectedSem}
                          onChange={(e) => setSelectedSem(e.target.value)}
                          disabled={!selectedYear}
                          className="w-full h-14 rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-6 text-sm font-bold disabled:opacity-30"
                        >
                          <option value="">Semester...</option>
                          {filteredSems.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </MedqsSelect>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl dark:bg-amber-500/10 bg-amber-50 border border-amber-500/20 p-5">
                     <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-relaxed">
                       Changing your academic context will update the modules, past papers, and forums visible in your dashboard.
                     </p>
                  </div>
               </section>
            </div>
          )}

          {/* TAB: TELEGRAM */}
          {activeTab === "telegram" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <section className="relative overflow-hidden rounded-[3rem] border border-sky-500/20 dark:bg-sky-500/5 bg-sky-50 p-10 shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                     <Send className="h-48 w-48 text-sky-500" />
                  </div>
                  <div className="relative space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-sky-500 text-white shadow-xl shadow-sky-500/30">
                        <Send className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black dark:text-white text-slate-800">Telegram Hub</h2>
                        <p className="text-[11px] font-black dark:text-sky-400/60 text-sky-600 uppercase tracking-[0.2em]">Dr. Q Intelligence Sync</p>
                      </div>
                    </div>
                    
                    {telegramVerified ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-5 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 p-8">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                             <ShieldCheck className="h-8 w-8" />
                          </div>
                          <div>
                             <p className="text-lg font-black text-emerald-500">Verified Connection</p>
                             <p className="text-sm font-medium text-emerald-500/70">Your MedOneX account is fully synchronized with @MedOneX_bot.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="rounded-2xl dark:bg-white/5 bg-white p-5 border dark:border-white/5 border-slate-100">
                              <p className="text-xs font-black dark:text-white/30 text-slate-400 uppercase mb-2">Sync Status</p>
                              <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <span className="text-sm font-bold dark:text-white text-slate-800">Real-time Active</span>
                              </div>
                           </div>
                           <div className="rounded-2xl dark:bg-white/5 bg-white p-5 border dark:border-white/5 border-slate-100">
                              <p className="text-xs font-black dark:text-white/30 text-slate-400 uppercase mb-2">Integration</p>
                              <span className="text-sm font-bold dark:text-white text-slate-800">AI Tutor Enabled</span>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-lg dark:text-white/70 text-slate-700 font-medium leading-relaxed max-w-xl">
                          Experience the future of medical study. Link your account to access interactive quizzes and private AI assistance directly on Telegram.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input 
                            type="text" 
                            value={telegramCode} 
                            onChange={(e) => setTelegramCode(e.target.value)}
                            placeholder="Enter 6-digit code..."
                            className="flex-1 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-black/40 bg-white px-6 py-4 text-sm font-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                          />
                          <button 
                            onClick={handleLinkTelegram}
                            disabled={linking || !telegramCode}
                            className="px-10 py-4 rounded-2xl bg-sky-500 font-black text-white shadow-xl shadow-sky-500/30 hover:bg-sky-400 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            {linking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            <span>Connect Integration</span>
                          </button>
                        </div>
                        
                        <div className="rounded-2xl dark:bg-white/5 bg-slate-200/50 p-6 border border-dashed dark:border-white/10 border-slate-300">
                          <p className="text-xs font-bold dark:text-white/40 text-slate-500 leading-relaxed">
                            To get a code: Open <a href="https://t.me/MedOneX_bot" target="_blank" className="text-sky-500 font-black hover:underline">@MedOneX_bot</a> and use the <b>Login</b> command.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
               </section>
            </div>
          )}

          {/* TAB: PRIVACY */}
          {activeTab === "privacy" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <section className="space-y-8 rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                        <ShieldCheck className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black dark:text-white text-slate-800">Privacy Controls</h2>
                        <p className="text-xs font-bold dark:text-orange-400/50 text-orange-600 uppercase tracking-widest">Visibility Settings</p>
                     </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="group">
                      <label className="mb-3 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Global Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500/50" />
                        <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+20 1XX XXX XXXX"
                          className="w-full rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 pl-14 pr-6 py-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                      </div>
                    </div>

                    <div className="grid gap-4">
                        {[
                          { field: "phoneVisible", label: "Public Contact Info", sub: "Display phone number on your public profile", icon: Phone },
                          { field: "hideRank", label: "Stealth Mode", sub: "Hide your identity from global leaderboards", icon: User },
                          { field: "isPrivate", label: "Restricted Profile", sub: "Only followers can see your full activity", icon: Save },
                        ].map(({ field, label, sub }) => (
                          <div key={field} role="switch" aria-checked={(form as any)[field]} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm((f: any) => ({ ...f, [field]: !f[field] })); } }} onClick={() => setForm((f: any) => ({ ...f, [field]: !f[field] }))} className="group flex cursor-pointer items-center justify-between rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-6 transition-all hover:bg-white/10">
                             <div className="space-y-1">
                                <p className="text-base font-black dark:text-white text-slate-800">{label}</p>
                                <p className="text-[11px] font-bold dark:text-white/30 text-slate-400 uppercase tracking-widest leading-none">{sub}</p>
                             </div>
                             <div className={cn("relative flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-all duration-300", (form as any)[field] ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" : "bg-slate-300 dark:bg-white/10")}>
                                <span className={cn("absolute h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-300", (form as any)[field] ? "translate-x-6" : "translate-x-1")} />
                             </div>
                          </div>
                        ))}
                    </div>
                  </div>
               </section>

               {/* Danger Zone */}
               <section className="space-y-6 rounded-[2.5rem] border border-red-500/20 dark:bg-red-500/5 bg-red-50 p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <ShieldAlert className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black dark:text-white text-slate-800">Danger Zone</h2>
                        <p className="text-xs font-bold dark:text-red-400/50 text-red-600 uppercase tracking-widest">Account Management</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button 
                       onClick={() => signOut({ callbackUrl: "/" })}
                       className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 dark:border-red-500/10 bg-white dark:bg-white/5 p-6 transition-all hover:bg-red-100 dark:hover:bg-red-500/10 group"
                     >
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                              <LogOut className="h-5 w-5" />
                           </div>
                           <div className="text-left">
                              <p className="text-sm font-black dark:text-white text-slate-800">Sign Out</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">End Session</p>
                           </div>
                        </div>
                     </button>

                     <button 
                       onClick={handleDeleteAccount}
                       className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 dark:border-red-500/10 bg-white dark:bg-white/5 p-6 transition-all hover:bg-red-100 dark:hover:bg-red-500/10 group"
                     >
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                              <Trash2 className="h-5 w-5" />
                           </div>
                           <div className="text-left">
                              <p className="text-sm font-black dark:text-white text-slate-800">Delete Account</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Permanent Action</p>
                           </div>
                        </div>
                     </button>
                  </div>
               </section>
            </div>
          )}

          {/* TAB: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <section className="space-y-10 rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-10 shadow-xl">
                  <div className="flex items-center gap-3 mb-2 text-center flex-col md:flex-row md:text-left">
                     <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-indigo-500/10 text-indigo-500">
                        <Palette className="h-7 w-7" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black dark:text-white text-slate-800">Visual Experience</h2>
                        <p className="text-[11px] font-black dark:text-indigo-400/50 text-indigo-500 uppercase tracking-[0.2em]">Interface Personality</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { id: "light", label: "Light Theme", sub: "Clinical Clean", icon: Palette },
                      { id: "dark", label: "Dark Mode", sub: "Night Shift", icon: Palette },
                      { id: "system", label: "System Sync", sub: "OS Adaptive", icon: Palette },
                    ].map((t) => (
                      <button 
                        key={t.id} 
                        onClick={() => setTheme(t.id as any)}
                        className={cn(
                          "group relative flex flex-col items-center justify-center rounded-[2rem] border p-8 transition-all duration-500",
                          theme === t.id 
                            ? "border-primary bg-primary/10 shadow-2xl shadow-primary/20 scale-105" 
                            : "dark:border-white/5 border-slate-100 hover:border-primary/30"
                        )}
                      >
                        <div className={cn(
                          "mb-4 h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                          theme === t.id ? "bg-primary text-white" : "dark:bg-white/5 bg-slate-50 text-slate-400"
                        )}>
                           <t.icon className="h-6 w-6" />
                        </div>
                        <p className={cn("text-sm font-black uppercase tracking-widest", theme === t.id ? "text-primary" : "dark:text-white/40 text-slate-400")}>{t.label}</p>
                        <p className="text-[10px] font-bold opacity-30 mt-1">{t.sub}</p>
                        
                        {theme === t.id && (
                          <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-ping" />
                        )}
                      </button>
                    ))}
                  </div>
               </section>
            </div>
          )}

          {/* TAB: AI & BYOK */}
          {activeTab === "ai_agents" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <section className="space-y-8 rounded-[2.5rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                        <Cpu className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black dark:text-white text-slate-800">AI & BYOK Settings</h2>
                        <p className="text-xs font-bold dark:text-blue-400/50 text-blue-600 uppercase tracking-widest">Bring Your Own Key</p>
                     </div>
                  </div>

                  <div className="rounded-2xl dark:bg-blue-500/10 bg-blue-50 border border-blue-500/20 p-5">
                     <p className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-relaxed">
                       Activate BYOK to bypass platform-wide message limits and use your own preferred AI model provider directly. Your keys are securely stored and encrypted.
                     </p>
                  </div>

                  <div className="grid gap-6">
                     {/* BYOK Toggle */}
                     <div role="switch" aria-checked={form.useCustomKey} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm((f) => ({ ...f, useCustomKey: !f.useCustomKey })); } }} onClick={() => setForm((f) => ({ ...f, useCustomKey: !f.useCustomKey }))} className="group flex cursor-pointer items-center justify-between rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-6 transition-all hover:bg-white/10">
                        <div className="space-y-1">
                           <p className="text-base font-black dark:text-white text-slate-800">Enable BYOK (Custom Keys)</p>
                           <p className="text-[11px] font-bold dark:text-white/30 text-slate-400 uppercase tracking-widest leading-none">Use my own APIs for AI Chat</p>
                        </div>
                        <div className={cn("relative flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-all duration-300", form.useCustomKey ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-slate-300 dark:bg-white/10")}>
                           <span className={cn("absolute h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-300", form.useCustomKey ? "translate-x-6" : "translate-x-1")} />
                        </div>
                     </div>

                     {/* API Keys Grid */}
                      <div className="grid gap-6">
                        {/* SiliconFlow */}
                        <div className="rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-6 space-y-4">
                           <h3 className="text-sm font-black dark:text-white text-slate-800 uppercase tracking-widest">SiliconFlow (DeepSeek)</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group col-span-1 md:col-span-2">
                                 <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">API Key</label>
                                 <div className="flex items-center gap-2">
                                   <input type="password" value={form.personalSiliconFlowKey} onChange={(e) => setForm((f) => ({ ...f, personalSiliconFlowKey: e.target.value }))} placeholder="sk-..." className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                   <TestKeyButton provider="siliconflow" keyValue={form.personalSiliconFlowKey} />
                                 </div>
                               </div>
                              <div className="group">
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Model Name</label>
                                <input type="text" value={form.personalSiliconFlowModel} onChange={(e) => setForm((f) => ({ ...f, personalSiliconFlowModel: e.target.value }))} placeholder="deepseek-ai/DeepSeek-R1" className="w-full rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                              </div>
                              <div className="group">
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest dark:text-white/40 text-slate-400">Base URL (Optional)</label>
                                <input type="url" value={form.personalSiliconFlowUrl} onChange={(e) => setForm((f) => ({ ...f, personalSiliconFlowUrl: e.target.value }))} placeholder="https://api.siliconflow.cn/v1" className="w-full rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                              </div>
                           </div>
                        </div>

                        {/* Other Providers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-5">
                              <label className="mb-3 block text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">Gemini Key</label>
                              <div className="flex items-center gap-2">
                                <input type="password" value={form.personalGeminiKey} onChange={(e) => setForm((f) => ({ ...f, personalGeminiKey: e.target.value }))} className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                <TestKeyButton provider="gemini" keyValue={form.personalGeminiKey} />
                              </div>
                            </div>
                            <div className="group rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-5">
                              <label className="mb-3 block text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">OpenAI Key</label>
                              <div className="flex items-center gap-2">
                                <input type="password" value={form.personalOpenAIKey} onChange={(e) => setForm((f) => ({ ...f, personalOpenAIKey: e.target.value }))} className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                <TestKeyButton provider="openai" keyValue={form.personalOpenAIKey} />
                              </div>
                            </div>
                            <div className="group rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-5">
                              <label className="mb-3 block text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">Groq Key</label>
                              <div className="flex items-center gap-2">
                                <input type="password" value={form.personalGroqKey} onChange={(e) => setForm((f) => ({ ...f, personalGroqKey: e.target.value }))} className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                <TestKeyButton provider="groq" keyValue={form.personalGroqKey} />
                              </div>
                            </div>
                            <div className="group rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-5">
                              <label className="mb-3 block text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">OpenRouter Key</label>
                              <div className="flex items-center gap-2">
                                <input type="password" value={form.personalOpenRouterKey} onChange={(e) => setForm((f) => ({ ...f, personalOpenRouterKey: e.target.value }))} className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                <TestKeyButton provider="openrouter" keyValue={form.personalOpenRouterKey} />
                              </div>
                            </div>
                            <div className="group rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-5">
                              <label className="mb-3 block text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">Anthropic Key</label>
                              <div className="flex items-center gap-2">
                                <input type="password" value={form.personalAnthropicKey} onChange={(e) => setForm((f) => ({ ...f, personalAnthropicKey: e.target.value }))} className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                <TestKeyButton provider="anthropic" keyValue={form.personalAnthropicKey} />
                              </div>
                            </div>
                            <div className="group rounded-2xl border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 p-5">
                              <label className="mb-3 block text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">xAI Key</label>
                              <div className="flex items-center gap-2">
                                <input type="password" value={form.personalXAIKey} onChange={(e) => setForm((f) => ({ ...f, personalXAIKey: e.target.value }))} className="flex-1 rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-black/40 bg-white px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                                <TestKeyButton provider="xai" keyValue={form.personalXAIKey} />
                              </div>
                            </div>
                        </div>
                     </div>
                  </div>
               </section>
            </div>
          )}
        </div>
      </div>
    </StudentPageShell>
  );
}

// ─── Test Key Button ──────────────────────────────────────────────────────

function TestKeyButton({ provider, keyValue }: { provider: string; keyValue: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  const test = async () => {
    if (!keyValue.trim()) { setState("err"); setError("No key entered"); return; }
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/v1/user/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyValue.trim() }),
      });
      const data = await res.json();
      if (data.ok) setState("ok");
      else { setState("err"); setError(data.error || "Invalid key"); }
    } catch { setState("err"); setError("Network error"); }
  };

  if (state === "ok") return <CircleCheck size={16} className="text-green-500 shrink-0" />;
  if (state === "loading") return <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />;
  if (state === "err") return (
    <div className="group relative">
      <XCircle size={16} className="text-red-400 shrink-0 cursor-help" />
      <div className="absolute right-0 top-full mt-1 whitespace-nowrap rounded-xl bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-lg">
        {error}
      </div>
    </div>
  );

  return (
    <button type="button" onClick={test} className="rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-600 dark:text-white/70 transition-all shrink-0">
      Test
    </button>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EditProfileContent />
    </Suspense>
  );
}
