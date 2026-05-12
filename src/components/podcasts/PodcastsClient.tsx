"use client";

import { useState, useMemo } from "react";
import { 
  Headphones, Play, Search, X,
  Mic2, LayoutGrid, List as ListIcon,
  ChevronRight, ArrowRight, Sparkles, Clock, Calendar, ShieldCheck,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CustomAudioPlayer } from "@/components/content/CustomAudioPlayer";
import Link from "next/link";
import { InfiniteScrollContainer } from "@/components/ui/InfiniteScrollContainer";

type RecordItem = {
  id: string;
  title: string;
  url: string;
  sourceType: string;
  image?: string | null;
  artist?: string;
  lecture: {
    id: string;
    title: string;
    subject: {
      name: string;
      module: { name: string };
    };
  };
  createdAt: string;
};

export function PodcastsClient({ 
  initialRecords, 
  initialHasMore 
}: { 
  initialRecords: RecordItem[],
  initialHasMore: boolean 
}) {
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [activeRecord, setActiveRecord] = useState<RecordItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/v1/podcasts?page=${nextPage}&limit=12`);
      const data = await res.json();
      if (data?.items) {
        setRecords(prev => [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more podcasts:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Instant local filter
  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.lecture.subject.name.toLowerCase().includes(q) ||
      (r.artist || "").toLowerCase().includes(q) ||
      r.lecture.subject.module.name.toLowerCase().includes(q)
    );
  }, [records, search]);

  const latest = useMemo(() => records.slice(0, 4), [records]);
  const categories = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharma", "Micro"];

  return (
    <div className="min-h-screen dark:bg-[#0a0a0a] bg-slate-50 dark:text-white text-slate-900 pb-36">
      {/* Hero */}
      <div className="relative h-[360px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent dark:to-[#0a0a0a] to-slate-50 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2000')] bg-cover bg-center opacity-30" />
        
        <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-end pb-10">
          <Link 
            href="/dashboard-app" 
            className="absolute top-6 left-6 flex items-center justify-center h-10 w-10 rounded-full bg-black/30 border border-white/20 text-white hover:bg-black/50 transition-all shadow-lg backdrop-blur-md"
          >
            <Home className="h-5 w-5" />
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] text-white mb-4 w-max">
            <Mic2 className="h-3.5 w-3.5" />
            MedOneX Audio Library
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-2">
            Podcasts.
          </h1>
          <p className="text-base text-white/70 max-w-xl font-medium">
            Your academic journey, translated into sound.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-30 space-y-10">
        {/* Search & View Toggle */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Instant Search */}
          <div className="relative w-full md:w-[440px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures, subjects, topics..." 
              className="w-full h-14 dark:bg-[#1a1a1a] bg-white border dark:border-white/5 border-slate-200 rounded-2xl pl-12 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all dark:placeholder:text-white/20 placeholder:text-slate-400 shadow-sm dark:text-white text-slate-800"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 dark:text-white/30 text-slate-400 hover:text-primary transition-colors" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl dark:bg-[#1a1a1a] bg-white border dark:border-white/5 border-slate-200 shadow-sm ml-auto">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid" ? "bg-primary text-white shadow" : "dark:text-white/40 text-slate-500 hover:text-primary"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list" ? "bg-primary text-white shadow" : "dark:text-white/40 text-slate-500 hover:text-primary"
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setSearch(cat)}
              className={cn(
                "h-16 flex items-center justify-center rounded-2xl border transition-all font-bold text-sm",
                search === cat
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "dark:bg-[#1a1a1a] bg-white dark:border-white/5 border-slate-200 dark:text-white/50 text-slate-500 hover:border-primary/40 hover:text-primary shadow-sm"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Latest Releases */}
          {latest.length > 0 && !search && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black dark:text-white text-slate-800">Latest Releases</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {latest.map((r) => (
                  <RecordCard 
                    key={r.id} 
                    record={r} 
                    onClick={() => setActiveRecord(r)} 
                    isActive={activeRecord?.id === r.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Records */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black dark:text-white text-slate-800">
                {search 
                  ? <span>Results for <span className="text-primary">"{search}"</span> — {filtered.length} found</span>
                  : "All Audio Lectures"
                }
              </h2>
              <span className="text-xs font-bold dark:text-white/30 text-slate-400">{filtered.length} tracks</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3 dark:text-white/20 text-slate-300">
                <Headphones className="h-16 w-16" />
                <p className="font-bold text-sm">No audio lectures found</p>
              </div>
            ) : (
              <InfiniteScrollContainer
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
                className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" 
                    : "space-y-1.5"
                )}
                endComponent={
                  <div className="col-span-full py-10 text-center opacity-30">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">End of audio library</p>
                  </div>
                }
              >
                {filtered.map((r, i) => (
                  viewMode === "grid" ? (
                    <RecordCard 
                      key={r.id} 
                      record={r} 
                      onClick={() => setActiveRecord(r)} 
                      isActive={activeRecord?.id === r.id}
                    />
                  ) : (
                    <RecordListRow 
                      key={r.id} 
                      record={r} 
                      index={i} 
                      onClick={() => setActiveRecord(r)}
                      isActive={activeRecord?.id === r.id}
                    />
                  )
                ))}
              </InfiniteScrollContainer>
            )}
          </section>
        </div>
      </div>

      {/* Persistent Global Player */}
      <AnimatePresence>
        {activeRecord && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-[100]"
          >
            <div className="relative group">
              <button 
                onClick={() => setActiveRecord(null)}
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full dark:bg-black bg-white border dark:border-white/10 border-slate-200 flex items-center justify-center dark:text-white/60 text-slate-500 hover:text-primary z-50 shadow-xl transition-all"
              >
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
              <CustomAudioPlayer url={activeRecord.url} title={activeRecord.title} autoPlay />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function RecordCard({ record, onClick, isActive }: { record: RecordItem, onClick: () => void, isActive: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-3 rounded-[24px] transition-all cursor-pointer border shadow-sm",
        isActive 
          ? "bg-primary/10 dark:border-primary/20 border-primary/30" 
          : "dark:bg-[#1a1a1a] bg-white dark:hover:bg-[#222] hover:bg-slate-50 dark:border-white/5 border-slate-200 hover:border-primary/30"
      )}
    >
      <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
          <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Play className="h-5 w-5 ml-0.5" />
          </div>
        </div>
        <img 
          src={record.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.lecture.subject.name)}&background=6366f1&color=fff&size=400`} 
          className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" 
          alt={record.title} 
        />
      </div>
      <div className="space-y-0.5">
        <h3 className="font-bold text-sm truncate dark:text-white text-slate-800 group-hover:text-primary transition-colors">{record.title}</h3>
        <p className="text-xs font-medium dark:text-white/40 text-slate-500 truncate">{record.artist || record.lecture.subject.name}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest dark:text-white/20 text-slate-400">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Audio</span>
        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
      </div>
    </motion.div>
  );
}

function RecordListRow({ record, index, onClick, isActive }: { record: RecordItem, index: number, onClick: () => void, isActive: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group border",
        isActive 
          ? "dark:bg-primary/10 bg-primary/5 dark:border-primary/20 border-primary/20" 
          : "dark:hover:bg-white/5 hover:bg-slate-100 border-transparent"
      )}
    >
      <span className="w-8 text-sm font-bold dark:text-white/20 text-slate-400 text-right shrink-0">{index + 1}</span>
      <div className="h-12 w-12 rounded-xl dark:bg-white/5 bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border dark:border-white/5 border-slate-200">
        <img 
          src={record.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.lecture.subject.name)}&background=6366f1&color=fff&size=100`} 
          className="h-full w-full object-cover" 
          alt={record.title} 
        />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className={cn("text-sm font-bold truncate", isActive ? "text-primary" : "dark:text-white text-slate-800")}>{record.title}</h4>
        <p className="text-xs font-medium dark:text-white/40 text-slate-500 truncate">{record.artist} • {record.lecture.subject.name}</p>
      </div>
      <div className="hidden md:flex items-center gap-4 text-xs font-bold dark:text-white/40 text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(record.createdAt).toLocaleDateString()}</span>
        <div className="h-9 w-9 rounded-full border dark:border-white/10 border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity dark:text-white text-slate-700 hover:text-primary">
          <Play className="h-4 w-4 ml-0.5 fill-current" />
        </div>
      </div>
    </button>
  );
}
