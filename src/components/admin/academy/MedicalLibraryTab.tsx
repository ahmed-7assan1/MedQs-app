"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Book, Video, FileText, Search, Plus, Sparkles, Share2, 
  Filter, Loader2, Library, School, Globe, ArrowRight,
  PlayCircle, LayoutGrid, Layers, CheckCircle2, MoreHorizontal,
  FolderPlus, FilePlus, ChevronRight, Trash2, BookOpen
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { FACULTY_CATEGORY_LABELS, type FacultyCategory } from "@/lib/faculty-categories";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { ResourcePreviewModal } from "@/components/admin/ResourcePreviewModal";
import { SourceBookUploadModal } from "@/components/admin/SourceBookUploadModal";
import { SyllabusModal } from "@/components/admin/SyllabusModal";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

export function MedicalLibraryTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"library" | "source-books">("library");
  const [resourceType, setResourceType] = useState<string>("ALL");
  const [category, setCategory] = useState<FacultyCategory>("HUMAN_MEDICINE");
  const [resources, setResources] = useState<any[]>([]);
  const [sourceBooks, setSourceBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [search, setSearch] = useState("");
  const [previewing, setPreviewing] = useState<any | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingSyllabus, setViewingSyllabus] = useState<any | null>(null);

  const isAdmin = (user as any)?.user_metadata?.role === "ADMIN" || (user as any)?.user_metadata?.role === "SUPER_ADMIN";
  const facultyCategory = (user as any)?.user_metadata?.facultyCategory;
  const facultyId = (user as any)?.user_metadata?.facultyId;

  // Auto-set category based on user session
  useEffect(() => {
    if (facultyCategory) {
      setCategory(facultyCategory);
    }
  }, [facultyCategory]);

  useEffect(() => {
    if (category) {
      fetchResources();
      fetchSourceBooks();
    }
  }, [category]);

  async function fetchResources() {
    setLoading(true);
    try {
      const typeParam = resourceType !== "ALL" ? `&type=${resourceType}` : "";
      const queryParam = search ? `&query=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/v1/admin/library?category=${category}${typeParam}${queryParam}`);
      const data = await res.json();
      setResources(data);
    } catch (e) {
      toast.error("Could not fetch library resources");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSourceBooks() {
    if (!facultyId) return;
    setLoadingBooks(true);
    try {
      const res = await fetch(`/api/v1/admin/library/book-analyze?facultyId=${facultyId}`);
      if (res.ok) {
        const data = await res.json();
        setSourceBooks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBooks(false);
    }
  }

  async function handleDeleteBook(id: string) {
    if (!confirm("Are you sure you want to delete this textbook analysis?")) return;
    
    try {
      const res = await fetch(`/api/v1/admin/library/book-analyze/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Textbook removed");
        fetchSourceBooks();
      } else {
        toast.error("Failed to delete book");
      }
    } catch (e) {
      toast.error("Network error");
    }
  }

  // Quick module chips from analyzed books
  const moduleChips = useMemo(() => {
    const modules = new Set<string>();
    sourceBooks.forEach(book => {
      book.analysisJson?.modules?.forEach((m: any) => modules.add(m.name));
    });
    return Array.from(modules).slice(0, 8);
  }, [sourceBooks]);

  const handleImportRequest = async (res: any) => {
    setPreviewing(null);
    // Future: Open "Select Target" modal here. 
    // For now, implementing simple toast feedback.
    toast.promise(
      fetch("/api/v1/admin/library/import", {
        method: "POST",
        body: JSON.stringify({
          resourceId: res.id,
          resourceType: res.originType,
          // Placeholder targets - in real usage, these would come from a selection modal
          targetSemesterId: (user as any)?.user_metadata?.semesterId, 
          targetSubjectId: "choose-target-subject-id" 
        })
      }),
      {
        loading: 'Preparing deep import...',
        success: 'Imported successfully to your faculty context!',
        error: 'Choose a target subject first in your modules.',
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 text-white shadow-2xl md:p-12 lg:p-16">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Global Academic Discovery</span>
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
              Medical <span className="text-blue-400">Library</span>
            </h1>
            <p className="text-lg font-medium text-slate-300/80 leading-relaxed">
              Curate and expand your university curriculum with shared academic resources, 
              benchmarked against your own source books for maximum relevance.
            </p>
          </div>

          {!isAdmin && (
            <div className="group relative flex flex-col gap-2 rounded-[2rem] border border-white/[0.03] bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/10">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">Active Sector</label>
              <MedqsSelect 
                value={category}
                onChange={(e) => setCategory(e.target.value as FacultyCategory)}
                className="w-full"
              >
                {Object.entries(FACULTY_CATEGORY_LABELS).map(([val, labels]) => (
                  <option key={val} value={val} className="text-black">
                    {labels.ar} ({labels.en})
                  </option>
                ))}
              </MedqsSelect>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Navigation ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/[0.02] pb-4">
          <div className="flex gap-4 p-1 rounded-2xl bg-muted/20 backdrop-blur-md border border-white/[0.02]">
            <TabButton active={activeTab === "library"} onClick={() => setActiveTab("library")} label="Global Discovery" icon={Globe} />
            <TabButton active={activeTab === "source-books"} onClick={() => setActiveTab("source-books")} label="My Curriculum" icon={Book} />
          </div>

          <div className="flex items-center gap-2">
            <ResourceTypeFilter active={resourceType === "ALL"} onClick={() => setResourceType("ALL")} label="All" />
            <ResourceTypeFilter active={resourceType === "VIDEO"} onClick={() => setResourceType("VIDEO")} label="Videos" icon={Video} />
            <ResourceTypeFilter active={resourceType === "QUESTION"} onClick={() => setResourceType("QUESTION")} label="Quizzes" icon={FileText} />
          </div>
        </div>

        {/* ── Search & Discovery ── */}
        {activeTab === "library" && (
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchResources()}
                  placeholder="Search by module name (e.g. CNS, Respiratory)..."
                  className="w-full rounded-[2.5rem] border border-white/[0.05] bg-card p-6 pl-16 text-lg font-medium shadow-2xl shadow-primary/5 outline-none ring-primary/20 transition-all focus:ring-4"
                />
                <button 
                  onClick={fetchResources}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-12 px-8 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                >
                  Discovery Items
                </button>
              </div>

              {moduleChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">Your Modules:</span>
                  {moduleChips.map(m => (
                    <button 
                      key={m} 
                      onClick={() => { setSearch(m); fetchResources(); }}
                      className="px-4 py-1.5 rounded-full border border-white/[0.02] bg-card/50 text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex h-96 flex-col items-center justify-center gap-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Aggregating Content...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/[0.02] bg-muted/10 p-12 text-center group">
                <div className="mb-6 rounded-full bg-muted/20 p-8 group-hover:scale-110 transition-transform duration-500">
                  <Library className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black leading-tight">No resources found matching "{search}"</h3>
                <p className="mt-2 text-muted-foreground max-w-sm">Try broadening your search or exploring your textbook modules for matching keywords.</p>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {resources.map((res) => (
                  <DiscoveryCard 
                    key={res.id} 
                    resource={res} 
                    onPreview={() => setPreviewing(res)} 
                    onImport={() => handleImportRequest(res)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Source Books ── */}
        {activeTab === "source-books" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-10 rounded-[3rem] bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/10 shadow-inner">
              <div className="space-y-2">
                <h3 className="text-2xl font-black">University Syllabus Bank</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  These texts define your active curriculum. Everything found in the discovery library is matched against these modules.
                </p>
              </div>
              <button 
                className="flex items-center gap-3 rounded-[2rem] bg-primary px-8 py-4 text-sm font-black text-white shadow-2xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 transition-all border-b-4 border-primary-foreground/20"
                onClick={() => setIsUploadOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Add Source Textbook
              </button>
            </div>

            {loadingBooks ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : sourceBooks.length === 0 ? (
               <EmptySyllabusState />
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
                {sourceBooks.map((book) => (
                   <CurriculumBookCard 
                     key={book.id} 
                     book={book} 
                     onDelete={handleDeleteBook} 
                     onViewSyllabus={() => setViewingSyllabus(book)}
                   />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ResourcePreviewModal 
        resource={previewing} 
        isOpen={!!previewing} 
        onClose={() => setPreviewing(null)} 
        onImport={handleImportRequest}
      />

      <SourceBookUploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchSourceBooks}
        facultyId={facultyId || "global"}
      />

      <SyllabusModal 
        isOpen={!!viewingSyllabus}
        onClose={() => setViewingSyllabus(null)}
        book={viewingSyllabus}
      />
    </div>
  );
}

// ── Shared UI Utilities ──────────────────────────────────────────────────────

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon: any }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
        active ? "bg-card text-foreground shadow-lg shadow-primary/5" : "text-muted-foreground hover:bg-muted/50"
      )}
    >
      <Icon className={cn("h-4 w-4", active && "text-primary")} />
      {label}
    </button>
  );
}

function ResourceTypeFilter({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon?: any }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ring-1",
        active ? "bg-primary text-white ring-primary shadow-lg shadow-primary/20" : "bg-card/40 text-muted-foreground ring-border/50 hover:bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
    </button>
  );
}

function DiscoveryCard({ resource, onPreview, onImport }: { resource: any, onPreview: () => void, onImport: () => void }) {
  const Icon = resource.type === "VIDEO" ? PlayCircle : FileText;

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/[0.02] bg-card p-1 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:ring-2 hover:ring-primary/20">
      <div className="bg-muted/30 p-6 rounded-t-[1.8rem]">
        <div className="flex items-start justify-between mb-6">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-[1.2rem] shadow-xl transition-transform group-hover:scale-110",
            resource.type === "VIDEO" ? "bg-blue-500 text-white shadow-blue-500/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
          )}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="text-[10px] font-black px-2.5 py-1 rounded-full bg-card shadow-sm border border-white/[0.02] uppercase tracking-tighter text-muted-foreground">
              {new Date(resource.createdAt).getFullYear()}
            </div>
            {resource.originType && (
              <div className="text-[9px] font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                {resource.originType}
              </div>
            )}
          </div>
        </div>

        <h4 className="font-display text-xl font-bold line-clamp-2 leading-tight mb-2 min-h-[3rem]">
          {resource.title}
        </h4>
        
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 transition-colors group-hover:text-foreground/80">
          <School className="h-3.5 w-3.5" />
          <span className="truncate">{resource.university}</span>
        </div>
      </div>

      <div className="p-4 bg-muted/5 flex flex-col gap-3">
        {resource.moduleName && (
           <div className="flex items-center justify-between px-2 pt-1 border-t border-white/[0.02]">
              <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">Topic Group</span>
              <span className="text-[11px] font-black text-primary">{resource.moduleName}</span>
           </div>
        )}
        <div className="flex items-center gap-2">
          <button 
            onClick={onImport}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.2rem] bg-slate-900 text-slate-100 shadow-xl transition-all hover:bg-slate-800 active:scale-95"
          >
            <FolderPlus className="h-4 w-4" />
            Import
          </button>
          <button 
            onClick={onPreview}
            className="h-14 w-14 flex items-center justify-center rounded-[1.2rem] bg-white border border-border shadow-sm text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CurriculumBookCard({ book, onDelete, onViewSyllabus }: { book: any, onDelete: (id: string) => void, onViewSyllabus: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/[0.02] bg-card/60 p-8 transition-all hover:shadow-2xl hover:bg-card">
       <button 
         onClick={() => onDelete(book.id)}
         className="absolute top-6 right-6 p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/20"
         title="Delete textbook"
       >
         <Trash2 className="h-5 w-5" />
       </button>

       <div className="flex items-start gap-6 mb-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary/5 text-primary shadow-inner">
            <Book className="h-8 w-8" />
          </div>
          <div>
            <h4 className="font-display text-2xl font-black">{book.title}</h4>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{book.author || "Curriculum Source"}</p>
          </div>
       </div>
       
       <div className="grid grid-cols-2 gap-4 mb-8">
          <ModuleStat label="Detected Subjects" value={book.analysisJson?.subjects?.length || 0} />
          <ModuleStat label="Topics Mapped" value={book.analysisJson?.subjects?.reduce((acc: any, m: any) => acc + (m.topics?.length || 0), 0) || 0} />
       </div>

       <div className="flex gap-3">
          <button 
            onClick={onViewSyllabus}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-muted/40 text-slate-500 hover:bg-muted transition-all"
          >
            View Syllabus
          </button>
          <button className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
            <CheckCircle2 className="h-6 w-6" />
          </button>
       </div>
    </div>
  );
}

function ModuleStat({ label, value }: { label: string, value: any }) {
  return (
    <div className="rounded-2xl border border-white/[0.02] bg-muted/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="text-xl font-black mt-1">{value}</p>
    </div>
  );
}

function EmptySyllabusState() {
  return (
    <div className="p-20 rounded-[3rem] border border-dashed border-border flex flex-col items-center justify-center text-center bg-muted/5">
      <div className="bg-muted/20 p-8 rounded-full mb-6">
        <Sparkles className="h-12 w-12 text-muted-foreground/30" />
      </div>
      <h3 className="text-xl font-bold">Your curriculum is pending analysis</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Upload your university textbooks to allow the Medical Library to automatically cluster resources for your modules.
      </p>
    </div>
  );
}


