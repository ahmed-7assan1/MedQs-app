"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Building2, Calendar, BookOpen, FlaskConical,
  Plus, ChevronDown, ChevronRight,
  Loader2, Trash2, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";

interface University  { id: string; name: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string }
interface Semester    { id: string; name: string; academicYearId: string }
interface Module      { id: string; name: string; semesterId: string }
interface Subject     { id: string; name: string; moduleId: string }

type AddKey = string; // format: "uni" | "year-{uniId}" | "sem-{yearId}" | "mod-{semId}" | "subj-{modId}"

export default function AdminContentPage() {
  const [universities, setUniversities]   = useState<University[]>([]);
  const [years,        setYears]          = useState<AcademicYear[]>([]);
  const [semesters,    setSemesters]      = useState<Semester[]>([]);
  const [modules,      setModules]        = useState<Module[]>([]);
  const [subjects,     setSubjects]       = useState<Subject[]>([]);
  const [loading,      setLoading]        = useState(true);
  const [expanded,     setExpanded]       = useState<Set<string>>(new Set());
  const [adding,       setAdding]         = useState<AddKey | null>(null);
  const [addVal,       setAddVal]         = useState("");
  const [deleting,     setDeleting]       = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/universities").then(r => r.json()),
      fetch("/api/v1/academic-years").then(r => r.json()),
      fetch("/api/v1/semesters").then(r => r.json()),
      fetch("/api/v1/modules-all").then(r => r.json()),
      fetch("/api/v1/subjects-all").then(r => r.json()),
    ]).then(([u, y, s, m, sub]) => {
      setUniversities(u); setYears(y); setSemesters(s); setModules(m); setSubjects(sub);
      setLoading(false);
    });
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

  async function commitDelete(
    kind: "uni" | "year" | "sem" | "mod" | "subj",
    id: string,
    label: string
  ) {
    if (!confirm(`Delete "${label}"? This removes all nested content (modules, lectures, forums tied to it, etc.). Cannot be undone.`))
      return;
    setDeleting(id);
    try {
      const paths: Record<"uni" | "year" | "sem" | "mod" | "subj", string> = {
        uni: `/api/v1/universities/${id}`,
        year: `/api/v1/years/${id}`,
        sem: `/api/v1/semesters/${id}`,
        mod: `/api/v1/modules/${id}`,
        subj: `/api/v1/subjects/${id}`,
      };
      const res = await fetch(paths[kind], { method: "DELETE" });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res, "Delete failed"));
        return;
      }
      if (kind === "uni") setUniversities((u) => u.filter((x) => x.id !== id));
      if (kind === "year") setYears((y) => y.filter((x) => x.id !== id));
      if (kind === "sem") setSemesters((s) => s.filter((x) => x.id !== id));
      if (kind === "mod") setModules((m) => m.filter((x) => x.id !== id));
      if (kind === "subj") setSubjects((s) => s.filter((x) => x.id !== id));
      toast.success("Deleted");
    } finally {
      setDeleting(null);
    }
  }

  function DeleteBtn({
    kind,
    id,
    label,
    alwaysShow,
  }: {
    kind: "uni" | "year" | "sem" | "mod" | "subj";
    id: string;
    label: string;
    alwaysShow?: boolean;
  }) {
    return (
      <button
        type="button"
        title="Delete"
        disabled={deleting === id}
        onClick={(e) => {
          e.stopPropagation();
          void commitDelete(kind, id, label);
        }}
        className={cn(
          "rounded-lg p-1.5 text-muted-foreground transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
          alwaysShow ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {deleting === id ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  async function commitAdd(key: AddKey) {
    if (!addVal.trim()) return;
    const parts = key.split("-");
    const type = parts[0];
    const parentId = parts.slice(1).join("-");

    const endpoints: Record<string, { url: string; body: object }> = {
      uni:  { url: "/api/v1/universities", body: { name: addVal } },
      year: { url: `/api/v1/universities/${parentId}/years`, body: { yearNumber: parseInt(addVal) || 1 } },
      sem:  { url: `/api/v1/years/${parentId}/semesters`, body: { name: addVal } },
      mod:  { url: `/api/v1/semesters/${parentId}/modules`, body: { name: addVal } },
      subj: { url: `/api/v1/modules/${parentId}/subjects`, body: { name: addVal } },
    };
    const cfg = endpoints[type];
    if (!cfg) return;

    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg.body),
    });
    if (res.ok) {
      const item = await res.json();
      if (type === "uni")  setUniversities(u => [...u, item]);
      if (type === "year") setYears(y => [...y, item]);
      if (type === "sem")  setSemesters(s => [...s, item]);
      if (type === "mod")  setModules(m => [...m, item]);
      if (type === "subj") setSubjects(s => [...s, item]);
      toast.success("Added");
      // Auto-expand parent
      if (parentId) setExpanded(prev => { const n = new Set(prev); n.add(parentId); return n; });
    } else {
      toast.error("Failed to add");
    }
    cancelAdd();
  }

  // Inline add row
  function AddRow({ k, placeholder, parentId, type }: { k: string; placeholder: string; parentId?: string; type: string }) {
    const active = adding === k;
    if (!active) {
      return (
        <button
          onClick={() => startAdd(k)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-3 w-3" /> Add {placeholder.toLowerCase()}
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 px-2 py-1" onClick={e => e.stopPropagation()}>
        <input
          autoFocus
          type={type === "year" ? "number" : "text"}
          value={addVal}
          onChange={e => setAddVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commitAdd(k); if (e.key === "Escape") cancelAdd(); }}
          placeholder={placeholder}
          className="w-44 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button onClick={() => commitAdd(k)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={cancelAdd} className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Content Structure</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage universities → years → semesters → modules → subjects
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Universities header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-primary" />
            Universities
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              {universities.length}
            </span>
          </div>
          <AddRow k="uni" placeholder="University name" type="text" />
        </div>

        {universities.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            No universities yet. Add one above.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {universities.map(uni => {
              const uniYears = years.filter(y => y.universityId === uni.id);
              const open = expanded.has(uni.id);
              return (
                <div key={uni.id}>
                  {/* University row */}
                  <div
                    className="group flex cursor-pointer items-center gap-2 px-5 py-3 hover:bg-muted/20 transition-colors"
                    onClick={() => toggle(uni.id)}
                  >
                    <span className="text-muted-foreground">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                    <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">{uni.name}</span>
                    <span className="text-xs text-muted-foreground">{uniYears.length} year{uniYears.length !== 1 ? "s" : ""}</span>
                    <DeleteBtn kind="uni" id={uni.id} label={uni.name} />
                  </div>

                  {/* Years */}
                  {open && (
                    <div className="border-t border-border/40 bg-muted/10 py-2">
                      <div className="ml-9">
                        <div className="flex items-center justify-between py-1 pr-4">
                          <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Academic Years</span>
                          <AddRow k={`year-${uni.id}`} placeholder="Year number" type="year" parentId={uni.id} />
                        </div>

                        {uniYears.map(year => {
                          const yearSems = semesters.filter(s => s.academicYearId === year.id);
                          const yearOpen = expanded.has(year.id);
                          return (
                            <div key={year.id}>
                              <div
                                className="group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                                onClick={() => toggle(year.id)}
                              >
                                <span className="text-muted-foreground">
                                  {yearOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </span>
                                <Calendar className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                <span className="flex-1 text-sm">Year {year.yearNumber}</span>
                                <span className="text-xs text-muted-foreground">{yearSems.length} sem{yearSems.length !== 1 ? "s" : ""}</span>
                                <DeleteBtn kind="year" id={year.id} label={`Year ${year.yearNumber}`} />
                              </div>

                              {/* Semesters */}
                              {yearOpen && (
                                <div className="ml-7 border-l border-border/50 pl-4 py-1">
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Semesters</span>
                                    <AddRow k={`sem-${year.id}`} placeholder="Semester name" type="text" parentId={year.id} />
                                  </div>

                                  {yearSems.map(sem => {
                                    const semMods = modules.filter(m => m.semesterId === sem.id);
                                    const semOpen = expanded.has(sem.id);
                                    return (
                                      <div key={sem.id}>
                                        <div
                                          className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors"
                                          onClick={() => toggle(sem.id)}
                                        >
                                          <span className="text-muted-foreground">
                                            {semOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                          </span>
                                          <BookOpen className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                                          <span className="flex-1 text-sm">{sem.name}</span>
                                          <span className="text-xs text-muted-foreground">{semMods.length} mod{semMods.length !== 1 ? "s" : ""}</span>
                                          <DeleteBtn kind="sem" id={sem.id} label={sem.name} />
                                        </div>

                                        {/* Modules */}
                                        {semOpen && (
                                          <div className="ml-7 border-l border-border/50 pl-4 py-1">
                                            <div className="flex items-center justify-between py-1">
                                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Modules</span>
                                              <AddRow k={`mod-${sem.id}`} placeholder="Module name" type="text" parentId={sem.id} />
                                            </div>

                                            {semMods.map(mod => {
                                              const modSubjs = subjects.filter(s => s.moduleId === mod.id);
                                              const modOpen = expanded.has(mod.id);
                                              return (
                                                <div key={mod.id}>
                                                  <div
                                                    className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors"
                                                    onClick={() => toggle(mod.id)}
                                                  >
                                                    <span className="text-muted-foreground">
                                                      {modOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                    </span>
                                                    <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                                    <span className="flex-1 text-sm">{mod.name}</span>
                                                    <span className="text-xs text-muted-foreground">{modSubjs.length} subj{modSubjs.length !== 1 ? "s" : ""}</span>
                                                    <DeleteBtn kind="mod" id={mod.id} label={mod.name} />
                                                  </div>

                                                  {/* Subjects */}
                                                  {modOpen && (
                                                    <div className="ml-6 border-l border-border/40 pl-4 py-1">
                                                      <div className="flex items-center justify-between py-1">
                                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Subjects</span>
                                                        <AddRow k={`subj-${mod.id}`} placeholder="Subject name" type="text" parentId={mod.id} />
                                                      </div>
                                                      {modSubjs.length === 0 ? (
                                                        <p className="py-1.5 text-xs text-muted-foreground italic">No subjects yet</p>
                                                      ) : (
                                                        modSubjs.map(subj => (
                                                          <div key={subj.id} className="group/sub flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                            <FlaskConical className="h-3 w-3 text-pink-400 flex-shrink-0" />
                                                            <span className="flex-1 text-sm">{subj.name}</span>
                                                            <DeleteBtn kind="subj" id={subj.id} label={subj.name} alwaysShow />
                                                          </div>
                                                        ))
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
