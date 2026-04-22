"use client";
import { useState, useEffect } from "react";
import {
  Building2, Calendar, BookOpen, FlaskConical, GraduationCap,
  Plus, ChevronDown, Loader2, Trash2, Check, X, ShieldAlert, Layers, Zap, Radio
} from "lucide-react";
import { SmartArchitectDialog } from "@/components/admin/SmartArchitectDialog";
import { SmartPlaylistSyncDialog } from "@/components/admin/SmartPlaylistSyncDialog";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { parseJsonList } from "@/lib/api-list";

interface University  { id: string; name: string }
interface Faculty     { id: string; name: string; universityId: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string; facultyId?: string | null }
interface Semester    { id: string; name: string; academicYearId: string }
interface Module      { id: string; name: string; semesterId: string }
interface Subject     { id: string; name: string; moduleId: string }

type AddKey = string;

const DIRECT_MODULE = "__direct__";

export default function AdminContentPage() {
  const [universities, setUniversities]   = useState<University[]>([]);
  const [faculties,    setFaculties]       = useState<Faculty[]>([]);
  const [years,        setYears]           = useState<AcademicYear[]>([]);
  const [semesters,    setSemesters]       = useState<Semester[]>([]);
  const [modules,      setModules]         = useState<Module[]>([]);
  const [subjects,     setSubjects]        = useState<Subject[]>([]);
  const [loading,      setLoading]         = useState(true);
  const [expanded,     setExpanded]        = useState<Set<string>>(new Set());
  const [adding,       setAdding]          = useState<AddKey | null>(null);
  const [addVal,       setAddVal]          = useState("");
  const [deleting,     setDeleting]        = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin]    = useState(false);
  const [architectTarget, setArchitectTarget] = useState<Semester | null>(null);
  const [syncTarget, setSyncTarget] = useState<Semester | null>(null);

  const refreshData = async () => {
    try {
      const [mRes, subRes] = await Promise.all([
        fetch("/api/v1/modules-all"),
        fetch("/api/v1/subjects-all"),
      ]);
      const [m, sub] = await Promise.all([
        parseJsonList<Module>(mRes),
        parseJsonList<Subject>(subRes),
      ]);
      setModules(m as Module[]);
      setSubjects(sub as Subject[]);
    } catch (e) {
      console.error("Refresh failed", e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uRes, yRes, sRes, mRes, subRes, sessionRes, facRes] = await Promise.all([
          fetch("/api/v1/universities"),
          fetch("/api/v1/academic-years"),
          fetch("/api/v1/semesters"),
          fetch("/api/v1/modules-all"),
          fetch("/api/v1/subjects-all"),
          fetch("/api/auth/session"),
          fetch("/api/v1/faculties"),
        ]);
        const [u, y, s, m, sub, fac] = await Promise.all([
          parseJsonList<University>(uRes),
          parseJsonList<AcademicYear>(yRes),
          parseJsonList<Semester>(sRes),
          parseJsonList<Module>(mRes),
          parseJsonList<Subject>(subRes),
          parseJsonList<Faculty>(facRes),
        ]);
        const sessionData = sessionRes.ok ? await sessionRes.json() : null;
        const role = sessionData?.user?.role;
        if (!cancelled) {
          setUniversities(u as University[]);
          setFaculties(fac as Faculty[]);
          setYears(y as AcademicYear[]);
          setSemesters(s as Semester[]);
          setModules(m as Module[]);
          setSubjects(sub as Subject[]);
          setIsSuperAdmin(role === "SUPER_ADMIN");
        }
      } catch (e) {
        console.error("[admin/content] load", e);
        if (!cancelled) {
          toast.error("Failed to load content structure.");
          setUniversities([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function toggle(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function startAdd(key: AddKey) { setAdding(key); setAddVal(""); }
  function cancelAdd() { setAdding(null); setAddVal(""); }

  async function commitAdd(key: AddKey) {
    if (!addVal.trim()) return;
    const parts = key.split("-");
    const type = parts[0];
    const parentId = parts.slice(1).join("-");

    if (type === "directsubj") {
      const semId = parentId;
      let directMod = modules.find(m => m.semesterId === semId && m.name === DIRECT_MODULE);
      if (!directMod) {
        const modRes = await fetch(`/api/v1/semesters/${semId}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: DIRECT_MODULE }),
        });
        if (!modRes.ok) return toast.error("Failed to initialize system module");
        directMod = await modRes.json();
        setModules(m => [...m, directMod!]);
      }
      const res = await fetch(`/api/v1/modules/${directMod!.id}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addVal.trim() }),
      });
      if (res.ok) {
        const item = await res.json();
        setSubjects(s => [...s, item]);
        toast.success("Subject added");
        setExpanded(prev => { const n = new Set(prev); n.add(semId); return n; });
      }
      cancelAdd();
      return;
    }

    const endpoints: Record<string, { url: string; body: object }> = {
      uni:     { url: "/api/v1/universities", body: { name: addVal } },
      fac:     { url: "/api/v1/faculties",    body: { name: addVal, universityId: parentId } },
      year:    { url: `/api/v1/universities/${parentId}/years`, body: { yearNumber: parseInt(addVal) || 1 } },
      facyear: {
        url: `/api/v1/universities/${faculties.find(f => f.id === parentId)?.universityId}/years`,
        body: { yearNumber: parseInt(addVal) || 1, facultyId: parentId },
      },
      sem:  { url: `/api/v1/years/${parentId}/semesters`, body: { name: addVal } },
      mod:  { url: `/api/v1/semesters/${parentId}/modules`, body: { name: addVal } },
      subj: { url: `/api/v1/modules/${parentId}/subjects`, body: { name: addVal } },
    };

    const cfg = endpoints[type];
    if (!cfg) return;

    try {
      const res = await fetch(cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg.body),
      });
      if (res.ok) {
        const item = await res.json();
        if (type === "uni")     setUniversities(u => [...u, item]);
        if (type === "fac")     setFaculties(f => [...f, item]);
        if (type === "year" || type === "facyear") setYears(y => [...y, item]);
        if (type === "sem")     setSemesters(s => [...s, item]);
        if (type === "mod")     setModules(m => [...m, item]);
        if (type === "subj")    setSubjects(s => [...s, item]);
        toast.success("Added successfully");
        if (parentId) setExpanded(prev => { const n = new Set(prev); n.add(parentId); return n; });
      } else toast.error(await apiErrorMessage(res, "Failed to add"));
    } finally { cancelAdd(); }
  }

  async function commitDelete(kind: string, id: string, label: string) {
    if (!confirm(`Confirm deletion of "${label}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      const paths: Record<string, string> = {
        uni: `/api/v1/universities/${id}`,
        fac: `/api/v1/faculties/${id}`,
        year: `/api/v1/years/${id}`,
        sem: `/api/v1/semesters/${id}`,
        mod: `/api/v1/modules/${id}`,
        subj: `/api/v1/subjects/${id}`,
      };
      const res = await fetch(paths[kind], { method: "DELETE" });
      if (res.ok) {
        if (kind === "uni")  setUniversities(u => u.filter(x => x.id !== id));
        if (kind === "fac")  setFaculties(f => f.filter(x => x.id !== id));
        if (kind === "year") setYears(y => y.filter(x => x.id !== id));
        if (kind === "sem")  setSemesters(s => s.filter(x => x.id !== id));
        if (kind === "mod")  setModules(m => m.filter(x => x.id !== id));
        if (kind === "subj") setSubjects(s => s.filter(x => x.id !== id));
        toast.success("Removed");
      } else toast.error(await apiErrorMessage(res, "Delete failed"));
    } finally { setDeleting(null); }
  }

  if (loading) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
      <p className="font-display text-sm font-bold animate-pulse text-muted-foreground">Architecting Curriculum Layers…</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-32">
       <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Global Infrastructure</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Content Hierarchy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Construct and manage the foundational map of universities, faculties, and academic years.
          </p>
        </div>
        {!isSuperAdmin && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold text-amber-500 uppercase ring-1 ring-amber-500/20">
            <ShieldAlert className="h-3.5 w-3.5" />
            Restricted Node
          </div>
        )}
      </div>

      <div className="space-y-4">
        {universities.map(uni => (
          <UniversityNode
            key={uni.id}
            uni={uni}
            faculties={faculties}
            years={years}
            semesters={semesters}
            modules={modules}
            subjects={subjects}
            expanded={expanded}
            onToggle={toggle}
            isSuperAdmin={isSuperAdmin}
            onAdd={startAdd}
            onDelete={commitDelete}
            onArchitect={setArchitectTarget}
            onSync={setSyncTarget}
            addingKey={adding}
            addVal={addVal}
            onAddValChange={setAddVal}
            onCommitAdd={commitAdd}
            onCancelAdd={cancelAdd}
            deletingId={deleting}
          />
        ))}
        
        <SmartArchitectDialog 
          isOpen={!!architectTarget}
          onClose={() => setArchitectTarget(null)}
          semester={architectTarget}
          onSuccess={() => {
            refreshData();
            setArchitectTarget(null);
          }}
        />

        {syncTarget && (
          <SmartPlaylistSyncDialog 
            isOpen={!!syncTarget}
            onClose={() => setSyncTarget(null)}
            semesterId={syncTarget.id}
            semesterName={syncTarget.name}
            onSuccess={() => {
              toast.success("Curriculum synced successfully!");
              refreshData();
              setSyncTarget(null);
            }}
          />
        )}

        {isSuperAdmin && (
          <div className="rounded-2xl border border-dashed border-white/[0.02] bg-muted/5 p-8 flex flex-col items-center justify-center text-center">
             <Building2 className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
             <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest leading-none">Global Root</p>
             <button
               onClick={() => startAdd("uni-root")}
               className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 transition-all font-display"
             >
               <Plus className="h-4 w-4" />
               New University
             </button>
             
             {adding === "uni-root" && (
                <div className="mt-6 w-full max-w-sm flex items-center gap-2 p-2 rounded-xl bg-card border border-blue-500 animate-in zoom-in-95">
                   <input autoFocus placeholder="Name…" className="flex-1 bg-transparent text-sm px-2 focus:outline-none" value={addVal} onChange={(e) => setAddVal(e.target.value)} onKeyDown={e => e.key === "Enter" && commitAdd("uni-root")} />
                   <button onClick={() => commitAdd("uni-root")} className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Check className="h-4 w-4" /></button>
                   <button onClick={cancelAdd} className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

function UniversityNode({ uni, faculties, years, semesters, modules, subjects, expanded, onToggle, isSuperAdmin, onAdd, onDelete, onArchitect, onSync, addingKey, addVal, onAddValChange, onCommitAdd, onCancelAdd, deletingId }: any) {
  const open = expanded.has(uni.id);
  const uniFaculties = faculties.filter((f: any) => f.universityId === uni.id);
  const uniYears = years.filter((y: any) => y.universityId === uni.id && !y.facultyId);

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border transition-all duration-300",
      open ? "border-blue-500/30 bg-card shadow-lg ring-1 ring-blue-500/10" : "border-white/[0.02] bg-card hover:border-white/[0.03]"
    )}>
      <div className="flex cursor-pointer items-center justify-between p-5" onClick={() => onToggle(uni.id)}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 shadow-inner", open ? "bg-blue-600 text-white" : "bg-blue-500/10 text-blue-600")}>
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold truncate">{uni.name}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest">Global Institution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button onClick={(e) => { e.stopPropagation(); onAdd(`uni-${uni.id}-fac`); }} className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"><Plus className="h-5 w-5" /></button>
          )}
          {isSuperAdmin && (
            <button onClick={(e) => { e.stopPropagation(); onDelete("uni", uni.id, uni.name); }} className={cn("h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500", deletingId === uni.id && "animate-pulse")}>
              {deletingId === uni.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </button>
          )}
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 text-muted-foreground", open && "rotate-180")}>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/[0.05] bg-muted/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
           {addingKey === `uni-${uni.id}-fac` && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-card border border-blue-500/30">
                <input autoFocus placeholder="Faculty Name…" className="flex-1 bg-transparent text-sm px-2 focus:outline-none" value={addVal} onChange={(e) => onAddValChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onCommitAdd(`uni-${uni.id}-fac`)} />
                <button onClick={() => onCommitAdd(`uni-${uni.id}-fac`)} className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Check className="h-4 w-4" /></button>
                <button onClick={onCancelAdd} className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
           )}

           {uniFaculties.length === 0 && uniYears.length === 0 && (
             <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-white/[0.02]">
                <p className="text-xs text-muted-foreground italic font-medium opacity-60">No children defined for this node.</p>
             </div>
           )}

           {uniFaculties.map((fac: any) => (
             <FacultyNode
                key={fac.id}
                fac={fac}
                years={years}
                semesters={semesters}
                modules={modules}
                subjects={subjects}
                expanded={expanded}
                onToggle={onToggle}
                isSuperAdmin={isSuperAdmin}
                onAdd={onAdd}
                onDelete={onDelete}
                onArchitect={onArchitect}
                onSync={onSync}
                addingKey={addingKey}
                addVal={addVal}
                onAddValChange={onAddValChange}
                onCommitAdd={onCommitAdd}
                onCancelAdd={onCancelAdd}
                deletingId={deletingId}
             />
           ))}

           {uniYears.length > 0 && <div className="pt-2"><p className="text-[10px] font-bold uppercase text-muted-foreground ml-2 mb-2 opacity-60">Direct Academic Years</p></div>}
           {uniYears.map((year: any) => (
              <YearNode
                key={year.id}
                year={year}
                semesters={semesters}
                modules={modules}
                subjects={subjects}
                expanded={expanded}
                onToggle={onToggle}
                isSuperAdmin={isSuperAdmin}
                onAdd={onAdd}
                onDelete={onDelete}
                onArchitect={onArchitect}
                onSync={onSync}
                addingKey={addingKey}
                addVal={addVal}
                onAddValChange={onAddValChange}
                onCommitAdd={onCommitAdd}
                onCancelAdd={onCancelAdd}
                deletingId={deletingId}
              />
           ))}
        </div>
      )}
    </div>
  );
}

function FacultyNode({ fac, years, semesters, modules, subjects, expanded, onToggle, isSuperAdmin, onAdd, onDelete, onArchitect, onSync, addingKey, addVal, onAddValChange, onCommitAdd, onCancelAdd, deletingId }: any) {
  const open = expanded.has(fac.id);
  const facYears = years.filter((y: any) => y.facultyId === fac.id);

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-300",
      open ? "border-emerald-500/30 bg-card/60 shadow-md ring-1 ring-emerald-500/10" : "border-white/[0.05] bg-card hover:border-white/[0.02]"
    )}>
      <div className="flex items-center justify-between p-3.5 cursor-pointer" onClick={() => onToggle(fac.id)}>
         <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shadow-sm border border-white/[0.05]", open ? "bg-emerald-600 text-white" : "bg-emerald-500/10 text-emerald-600")}>
               <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground/90">{fac.name}</span>
         </div>
         <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onAdd(`facyear-${fac.id}`); }} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"><Plus className="h-4 w-4" /></button>
            {isSuperAdmin && (
              <button onClick={(e) => { e.stopPropagation(); onDelete("fac", fac.id, fac.name); }} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <div className={cn("transition-transform", open && "rotate-180")}>
               <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
            </div>
         </div>
      </div>

      {open && (
        <div className="pl-6 pr-3 pb-3 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
           {addingKey === `facyear-${fac.id}` && (
             <div className="flex items-center gap-2 p-1.5 rounded-xl border border-emerald-500/30 bg-card">
                <input type="number" placeholder="Year # (e.g. 5)" className="flex-1 bg-transparent text-xs px-2 focus:outline-none" value={addVal} onChange={(e) => onAddValChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onCommitAdd(`facyear-${fac.id}`)} />
                <button onClick={() => onCommitAdd(`facyear-${fac.id}`)} className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={onCancelAdd} className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
             </div>
           )}
           {facYears.sort((a: any, b: any) => (a.yearNumber ?? 0) - (b.yearNumber ?? 0)).map((year: any) => (
             <YearNode key={year.id} year={year} semesters={semesters} modules={modules} subjects={subjects} expanded={expanded} onToggle={onToggle} isSuperAdmin={isSuperAdmin} onAdd={onAdd} onDelete={onDelete} onArchitect={onArchitect} onSync={onSync} addingKey={addingKey} addVal={addVal} onAddValChange={onAddValChange} onCommitAdd={onCommitAdd} onCancelAdd={onCancelAdd} deletingId={deletingId} />
           ))}
        </div>
      )}
    </div>
  );
}

function YearNode({ year, semesters, modules, subjects, expanded, onToggle, isSuperAdmin, onAdd, onDelete, onArchitect, onSync, addingKey, addVal, onAddValChange, onCommitAdd, onCancelAdd, deletingId }: any) {
  const open = expanded.has(year.id);
  const yearSemesters = semesters.filter((s: any) => s.academicYearId === year.id);

  return (
    <div className="group/year">
      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => onToggle(year.id)}>
         <div className="flex items-center gap-3">
            <Calendar className={cn("h-4 w-4", open ? "text-blue-500" : "text-muted-foreground/40")} />
            <span className="text-xs font-bold text-foreground/80 tracking-tight">Academic Year {year.yearNumber}</span>
         </div>
         <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onAdd(`sem-${year.id}`); }} className="h-7 w-7 rounded-lg opacity-0 group-hover/year:opacity-100 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-all"><Plus className="h-3.5 w-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete("year", year.id, `Year ${year.yearNumber}`); }} className="h-7 w-7 rounded-lg opacity-0 group-hover/year:opacity-100 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
            <div className={cn("transition-transform opacity-30", open && "rotate-180 opacity-60")}>
               <ChevronDown className="h-4 w-4" />
            </div>
         </div>
      </div>

      {open && (
        <div className="pl-6 border-l border-white/[0.05] ml-3.5 mt-1 pb-2 space-y-2 animate-in fade-in slide-in-from-left-1 duration-200">
           {addingKey === `sem-${year.id}` && (
             <div className="flex items-center gap-1.5 p-1 rounded-lg border border-blue-500/20 bg-background/50">
                <input placeholder="Semester name…" className="flex-1 bg-transparent text-[11px] px-2 focus:outline-none" value={addVal} onChange={(e) => onAddValChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onCommitAdd(`sem-${year.id}`)} />
                <button onClick={() => onCommitAdd(`sem-${year.id}`)} className="h-6 w-6 rounded bg-blue-600 text-white flex items-center justify-center shadow-blue-500/20"><Check className="h-3 w-3" /></button>
                <button onClick={onCancelAdd} className="h-6 w-6 rounded hover:bg-muted text-muted-foreground flex items-center justify-center"><X className="h-3 w-3" /></button>
             </div>
           )}
           {yearSemesters.map((sem: any) => (
              <SemesterNode key={sem.id} sem={sem} modules={modules} subjects={subjects} expanded={expanded} onToggle={onToggle} onAdd={onAdd} onDelete={onDelete} onArchitect={onArchitect} onSync={onSync} addingKey={addingKey} addVal={addVal} onAddValChange={onAddValChange} onCommitAdd={onCommitAdd} onCancelAdd={onCancelAdd} />
           ))}
        </div>
      )}
    </div>
  );
}

function SemesterNode({ sem, modules, subjects, expanded, onToggle, onAdd, onDelete, onArchitect, onSync, addingKey, addVal, onAddValChange, onCommitAdd, onCancelAdd }: any) {
  const open = expanded.has(sem.id);
  const semModules = modules.filter((m: any) => m.semesterId === sem.id);
  const regularModules = semModules.filter((m: any) => m.name !== DIRECT_MODULE);
  const directMod = semModules.find((m: any) => m.name === DIRECT_MODULE);
  const directSubjs = directMod ? subjects.filter((s: any) => s.moduleId === directMod.id) : [];

  return (
    <div className="group/sem">
       <div className="flex items-center justify-between p-1.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onToggle(sem.id)}>
          <div className="flex items-center gap-2.5">
             <div className={cn("h-1.5 w-1.5 rounded-full", open ? "bg-violet-500 shadow-sm" : "bg-muted-foreground/30")} />
             <span className="text-xs font-bold text-foreground/70 uppercase tracking-tighter">{sem.name}</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover/sem:opacity-100 transition-all">
             <button onClick={(e) => { e.stopPropagation(); onSync(sem); }} className="h-6 w-6 flex items-center justify-center rounded-md text-emerald-500/70 hover:bg-emerald-500/10 hover:text-emerald-500" title="Smart AI Sync"><Radio className="h-3 w-3" /></button>
             <button onClick={(e) => { e.stopPropagation(); onArchitect(sem); }} className="h-6 w-6 flex items-center justify-center rounded-md text-blue-500/70 hover:bg-blue-500/10 hover:text-blue-500"><Zap className="h-3 w-3" /></button>
             <button onClick={(e) => { e.stopPropagation(); onAdd(`sem-${sem.id}-mod`); }} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted"><Plus className="h-3 w-3" /></button>
             <button onClick={(e) => { e.stopPropagation(); onDelete("sem", sem.id, sem.name); }} className="h-6 w-6 flex items-center justify-center rounded-md text-red-500/50 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </div>
       </div>

       {open && (
         <div className="pl-5 pt-1 space-y-2 animate-in fade-in duration-200">
            {addingKey === `sem-${sem.id}-mod` && (
               <div className="flex items-center gap-1.5 p-1 rounded-lg border border-emerald-500/10 bg-emerald-500/5">
                  <input placeholder="Module Name…" className="flex-1 bg-transparent text-[10px] px-2 focus:outline-none" value={addVal} onChange={(e) => onAddValChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onCommitAdd(`sem-${sem.id}-mod`)} />
                  <button onClick={() => onCommitAdd(`sem-${sem.id}-mod`)} className="text-emerald-600 hover:opacity-80"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={onCancelAdd} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
               </div>
            )}
            
            {regularModules.map((mod: any) => (
               <ModuleNode key={mod.id} mod={mod} subjects={subjects} expanded={expanded} onToggle={onToggle} onAdd={onAdd} onDelete={onDelete} addingKey={addingKey} addVal={addVal} onAddValChange={onAddValChange} onCommitAdd={onCommitAdd} onCancelAdd={onCancelAdd} />
            ))}

            <div className="mt-2 pl-1 border-t border-dashed border-white/[0.05] pt-2 space-y-1">
               <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Independent Subjects</p>
                  </div>
                  <button onClick={() => onAdd(`directsubj-${sem.id}`)} className="text-[9px] font-bold text-blue-500 uppercase hover:underline">+ Link Subj</button>
               </div>
               {addingKey === `directsubj-${sem.id}` && (
                  <div className="flex items-center gap-1.5 p-1 rounded-lg border border-blue-500/20 bg-blue-500/5">
                     <input placeholder="Subject title…" className="flex-1 bg-transparent text-[10px] px-2 focus:outline-none" value={addVal} onChange={(e) => onAddValChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onCommitAdd(`directsubj-${sem.id}`)} />
                     <button onClick={() => onCommitAdd(`directsubj-${sem.id}`)} className="text-blue-500"><Check className="h-3.5 w-3.5" /></button>
                  </div>
               )}
               {directSubjs.map((sub: any) => (
                  <SubjectNode key={sub.id} sub={sub} onDelete={onDelete} />
               ))}
            </div>
         </div>
       )}
    </div>
  );
}

function ModuleNode({ mod, subjects, expanded, onToggle, onAdd, onDelete, addingKey, addVal, onAddValChange, onCommitAdd, onCancelAdd }: any) {
  const open = expanded.has(mod.id);
  const modSubjects = subjects.filter((s: any) => s.moduleId === mod.id);

  return (
    <div className="group/mod">
       <div className={cn("flex items-center justify-between p-2 px-3 rounded-xl border transition-all cursor-pointer", open ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm" : "bg-card border-white/[0.02] hover:bg-muted/30")} onClick={() => onToggle(mod.id)}>
          <div className="flex items-center gap-2.5">
             <BookOpen className={cn("h-3.5 w-3.5", open ? "text-emerald-500" : "text-muted-foreground/50")} />
             <span className="text-[11px] font-bold text-foreground/80">{mod.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <button onClick={(e) => { e.stopPropagation(); onAdd(`mod-${mod.id}-subj`); }} className="h-6 w-6 flex items-center justify-center rounded-lg text-emerald-600/50 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"><Plus className="h-3.5 w-3.5" /></button>
             <button onClick={(e) => { e.stopPropagation(); onDelete("mod", mod.id, mod.name); }} className="h-6 w-6 flex items-center justify-center rounded-lg text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
       </div>

       {open && (
         <div className="pl-6 pt-1.5 space-y-1 animate-in zoom-in-95 duration-200">
            {addingKey === `mod-${mod.id}-subj` && (
               <div className="flex items-center gap-1.5 p-1 rounded-lg border border-blue-500/10 bg-blue-500/5">
                  <input placeholder="Subject…" className="flex-1 bg-transparent text-[10px] px-2 focus:outline-none" value={addVal} onChange={(e) => onAddValChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onCommitAdd(`mod-${mod.id}-subj`)} />
                  <button onClick={() => onCommitAdd(`mod-${mod.id}-subj`)} className="text-blue-500"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={onCancelAdd} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
               </div>
            )}
            {modSubjects.map((sub: any) => (
               <SubjectNode key={sub.id} sub={sub} onDelete={onDelete} />
            ))}
         </div>
       )}
    </div>
  );
}

function SubjectNode({ sub, onDelete }: any) {
  return (
    <div className="group/subj flex items-center justify-between p-2 px-3 rounded-lg hover:bg-blue-500/5 transition-colors border border-transparent hover:border-blue-500/10">
       <div className="flex items-center gap-2.5">
          <Layers className="h-3 w-3 text-blue-500/60" />
          <span className="text-[11px] font-medium text-muted-foreground leading-none">{sub.name}</span>
       </div>
       <button onClick={() => onDelete("subj", sub.id, sub.name)} className="opacity-0 group-hover/subj:opacity-100 text-red-500/40 hover:text-red-500 transition-all">
          <Trash2 className="h-3 w-3" />
       </button>
    </div>
  );
}

