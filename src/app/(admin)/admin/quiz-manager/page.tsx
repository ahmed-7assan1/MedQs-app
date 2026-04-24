"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Search, Loader2, ArrowRightLeft, Copy, ChevronDown,
  BookOpen, Layers, AlertTriangle, Check, X, Zap, Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

interface PastPaper {
  id: string;
  title: string;
  semesterId: string;
  moduleId: string;
  kind: string;
  isPrivate: boolean;
  _count?: { attempts: number };
}
interface Semester { id: string; name: string }
interface Module { id: string; name: string }

type TransferMode = "move" | "copy";

export default function QuizManagerPage() {
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  // Transfer modal state
  const [transferPaper, setTransferPaper] = useState<PastPaper | null>(null);
  const [transferMode, setTransferMode] = useState<TransferMode>("move");
  const [targetSemester, setTargetSemester] = useState("");
  const [targetModule, setTargetModule] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Migration state (SUPER_ADMIN)
  const [migrating, setMigrating] = useState(false);
  const [migSemester, setMigSemester] = useState("");
  const [migModule, setMigModule] = useState("");
  const [showMigration, setShowMigration] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/past-papers?kind=ADMIN_AUTHORED_QUIZ").then(r => r.json()),
      fetch("/api/v1/semesters").then(r => r.json()),
      fetch("/api/v1/modules-all").then(r => r.json()),
      fetch("/api/v1/auth/me").then(r => r.json()),
    ]).then(([pp, sem, mod, me]) => {
      const ppList = Array.isArray(pp?.result) ? pp.result : (Array.isArray(pp) ? pp : []);
      setPapers(ppList);
      setSemesters(unwrapApiList<Semester>(sem));
      setModules(unwrapApiList<Module>(mod));
      if (me?.role) setUserRole(me.role);
    }).finally(() => setLoading(false));
  }, []);

  const semesterName = (id: string) => semesters.find(s => s.id === id)?.name ?? "—";
  const moduleName = (id: string) => modules.find(m => m.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    return papers.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchSem = !filterSemester || p.semesterId === filterSemester;
      return matchSearch && matchSem;
    });
  }, [papers, search, filterSemester]);

  async function handleTransfer() {
    if (!transferPaper || !targetSemester || !targetModule) {
      return toast.error("Please select target semester and module");
    }
    setTransferring(true);
    try {
      const res = await fetch("/api/v1/admin/quiz-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: transferPaper.id,
          targetSemesterId: targetSemester,
          targetModuleId: targetModule,
          mode: transferMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Transfer failed");
      toast.success(transferMode === "move" ? "Quiz moved successfully!" : "Quiz copied successfully!");
      if (transferMode === "move") {
        setPapers(prev => prev.map(p =>
          p.id === transferPaper.id
            ? { ...p, semesterId: targetSemester, moduleId: targetModule }
            : p
        ));
      } else {
        // Add the new copy
        if (data.result) setPapers(prev => [...prev, data.result]);
      }
      setTransferPaper(null);
      setTargetSemester("");
      setTargetModule("");
    } finally { setTransferring(false); }
  }

  async function handleMigration() {
    if (!migSemester || !migModule) return toast.error("Select target semester and module");
    if (!confirm("This will move ALL existing quizzes to the selected semester/module. Are you sure?")) return;
    setMigrating(true);
    try {
      const res = await fetch("/api/v1/admin/quiz-transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSemesterId: migSemester, targetModuleId: migModule }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Migration failed");
      toast.success(`Migrated ${data.result?.migratedCount ?? 0} quizzes!`);
      // Refresh
      const pp = await fetch("/api/v1/past-papers?kind=ADMIN_AUTHORED_QUIZ").then(r => r.json());
      setPapers(Array.isArray(pp?.result) ? pp.result : (Array.isArray(pp) ? pp : []));
      setShowMigration(false);
    } finally { setMigrating(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Quiz Management</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Quiz Transfer Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Move or copy quizzes between semesters and modules with full content preservation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-white/[0.02] bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground sm:flex">
            <Database className="h-4 w-4 text-violet-500" />
            <span>{papers.length} Quizzes</span>
          </div>
          {userRole === "SUPER_ADMIN" && (
            <button
              onClick={() => setShowMigration(!showMigration)}
              className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm font-bold text-amber-500 hover:bg-amber-500/20 transition-all"
            >
              <Zap className="h-4 w-4" />
              Bulk Migration
            </button>
          )}
        </div>
      </div>

      {/* Bulk Migration Panel (SUPER_ADMIN only) */}
      {showMigration && userRole === "SUPER_ADMIN" && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400">Bulk Migration — Move ALL Quizzes</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            This will reassign <strong>every quiz</strong> not already in the target semester to the selected destination.
            Use this to fix misplaced quizzes created before faculty scoping was enabled.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Semester</label>
              <MedqsSelect value={migSemester} onChange={e => setMigSemester(e.target.value)} className="h-11 rounded-xl">
                <option value="">Select Semester…</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </MedqsSelect>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Module</label>
              <MedqsSelect value={migModule} onChange={e => setMigModule(e.target.value)} className="h-11 rounded-xl">
                <option value="">Select Module…</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </MedqsSelect>
            </div>
          </div>
          <button
            onClick={handleMigration}
            disabled={migrating || !migSemester || !migModule}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-bold text-white shadow shadow-amber-500/30 hover:bg-amber-600 disabled:opacity-50 transition-all"
          >
            {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {migrating ? "Migrating…" : "Execute Migration"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-white/[0.02] bg-card p-5 space-y-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quizzes…"
              className="w-full h-11 pl-9 pr-4 rounded-xl border border-white/[0.02] bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <MedqsSelect value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="h-11 rounded-xl">
            <option value="">All Semesters</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </MedqsSelect>
        </div>
      </div>

      {/* Quiz List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.02] py-24 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="font-bold text-muted-foreground">No quizzes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(paper => (
            <div key={paper.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.02] bg-card p-5 hover:border-violet-500/20 transition-all">
              <div className="min-w-0">
                <p className="font-bold truncate">{paper.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {semesterName(paper.semesterId)}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {moduleName(paper.moduleId)}
                  </span>
                  {paper.isPrivate && (
                    <span className="text-[9px] font-bold uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Private</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setTransferPaper(paper); setTransferMode("move"); }}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Move
                </button>
                <button
                  onClick={() => { setTransferPaper(paper); setTransferMode("copy"); }}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-violet-500/10 text-violet-500 text-xs font-bold hover:bg-violet-500/20 transition-all border border-violet-500/20"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {transferPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.05] bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
                  {transferMode === "move" ? "Move Quiz" : "Copy Quiz"}
                </p>
                <h2 className="font-display text-lg font-bold mt-0.5">{transferPaper.title}</h2>
              </div>
              <button onClick={() => setTransferPaper(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 rounded-xl bg-muted/30 p-1">
              {(["move", "copy"] as TransferMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setTransferMode(m)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                    transferMode === m ? "bg-violet-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "move" ? <ArrowRightLeft className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {m === "move" ? "Move (reassign)" : "Copy (duplicate)"}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-white/[0.05]">
              <p className="text-[11px] text-muted-foreground">
                {transferMode === "move"
                  ? "The quiz will be reassigned to the new location. All existing attempts will remain linked."
                  : "A full copy of the quiz and all its questions will be created at the new location."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Semester</label>
                <MedqsSelect value={targetSemester} onChange={e => setTargetSemester(e.target.value)} className="h-11 rounded-xl">
                  <option value="">Select Semester…</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </MedqsSelect>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Module</label>
                <MedqsSelect value={targetModule} onChange={e => setTargetModule(e.target.value)} className="h-11 rounded-xl">
                  <option value="">Select Module…</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </MedqsSelect>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setTransferPaper(null)} className="flex-1 h-11 rounded-xl border border-white/[0.02] bg-muted/30 text-sm font-bold hover:bg-muted/50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring || !targetSemester || !targetModule}
                className={cn(
                  "flex-1 h-11 rounded-xl text-sm font-bold text-white shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50",
                  transferMode === "move" ? "bg-blue-600 shadow-blue-500/20" : "bg-violet-600 shadow-violet-500/20"
                )}
              >
                {transferring
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : transferMode === "move" ? <ArrowRightLeft className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {transferring ? "Processing…" : transferMode === "move" ? "Move Quiz" : "Copy Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
