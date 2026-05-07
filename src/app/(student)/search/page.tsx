"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  Loader2, 
  BookOpen, 
  HelpCircle, 
  Users, 
  ChevronRight, 
  SearchX,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { cn } from "@/lib/utils";
import Link from "next/link";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="relative">
           <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
           <Search className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Analyzing Knowledge Base...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <SearchX className="h-16 w-16 text-white/10 mb-6" />
        <h2 className="text-2xl font-black text-white">Initiate Search</h2>
        <p className="text-white/40 mt-2 max-w-sm">Enter clinical keywords or peer names to scan the MedOneX directory.</p>
      </div>
    );
  }

  const hasResults = results && (
    results.lectures.length > 0 || 
    results.modules.length > 0 || 
    results.quizzes.length > 0 || 
    results.users.length > 0
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Search Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
         <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Index Scan Complete</p>
            <h2 className="text-2xl font-black text-white">Results for &quot;<span className="text-primary">{query}</span>&quot;</h2>
         </div>
         <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-xs font-black text-white/40 uppercase tracking-widest">
               {hasResults ? "Matches Found" : "Zero Matches"}
            </span>
         </div>
      </div>

      {!hasResults ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[3rem] border border-white/5 bg-white/[0.02] p-12 text-center">
           <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <SearchX className="h-10 w-10 text-white/20" />
           </div>
           <h3 className="text-xl font-black text-white">No Clinical Data Found</h3>
           <p className="text-white/40 mt-2 max-w-md">Our intelligence systems couldn&apos;t find any records matching &quot;{query}&quot;. Try broader medical terms.</p>
           <button 
             onClick={() => router.back()}
             className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
           >
              <ArrowLeft className="h-4 w-4" /> Go Back
           </button>
        </div>
      ) : (
        <div className="grid gap-8">
          
          {/* Lectures */}
          {results.lectures.length > 0 && (
            <SearchSection title="Academic Lectures" icon={BookOpen}>
              <div className="grid gap-3">
                {results.lectures.map((l: any) => (
                  <SearchItem key={l.id} label={l.label} sub={l.sub} href={l.href} type="lecture" />
                ))}
              </div>
            </SearchSection>
          )}

          {/* Quizzes */}
          {results.quizzes.length > 0 && (
            <SearchSection title="Assessment Quizzes" icon={HelpCircle}>
              <div className="grid gap-3">
                {results.quizzes.map((q: any) => (
                  <SearchItem key={q.id} label={q.label} sub={q.sub} href={q.href} type="quiz" />
                ))}
              </div>
            </SearchSection>
          )}

          {/* Modules */}
          {results.modules.length > 0 && (
            <SearchSection title="Knowledge Modules" icon={Sparkles}>
              <div className="grid gap-3">
                {results.modules.map((m: any) => (
                  <SearchItem key={m.id} label={m.label} sub={m.sub} href={m.href} type="module" />
                ))}
              </div>
            </SearchSection>
          )}

          {/* Peers */}
          {results.users.length > 0 && (
            <SearchSection title="Clinical Peers" icon={Users}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.users.map((u: any) => (
                  <SearchItem key={u.id} label={u.label} sub={u.sub} href={u.href} type="user" />
                ))}
              </div>
            </SearchSection>
          )}

        </div>
      )}
    </div>
  );
}

function SearchSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
         <Icon className="h-5 w-5 text-primary" />
         <h3 className="text-sm font-black uppercase tracking-widest text-white/60">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SearchItem({ label, sub, href, type }: { label: string; sub: string; href: string; type: string }) {
  const icons = {
    lecture: BookOpen,
    quiz: HelpCircle,
    module: Sparkles,
    user: Users
  };
  const Icon = (icons as any)[type] || Search;

  return (
    <Link 
      href={href}
      className="group flex items-center justify-between gap-4 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05] hover:border-primary/30"
    >
      <div className="flex items-center gap-5">
         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all">
            <Icon className="h-6 w-6" />
         </div>
         <div>
            <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">{label}</h4>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-0.5">{sub}</p>
         </div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/20 group-hover:bg-primary group-hover:text-white transition-all">
         <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <StudentPageShell 
      maxWidthClass="max-w-5xl"
      eyebrow="Global Search Index"
      title="Knowledge Discovery"
      subtitle="Scan across lectures, quizzes, and clinical peer directories."
    >
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <SearchResultsContent />
      </Suspense>
    </StudentPageShell>
  );
}
