"use client";

import { useState, useMemo } from "react";
import { 
  Headphones, Play, Pause, Search, Filter, 
  Music, Mic2, Disc, LayoutGrid, List as ListIcon,
  ChevronRight, ArrowRight, Sparkles, Clock, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CustomAudioPlayer } from "@/components/content/CustomAudioPlayer";
import Link from "next/link";
import { Home } from "lucide-react";

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

export function PodcastsClient({ records }: { records: RecordItem[] }) {
  const [search, setSearch] = useState("");
  const [activeRecord, setActiveRecord] = useState<RecordItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return records.filter(r => 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.lecture.subject.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  const latest = useMemo(() => records.slice(0, 4), [records]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Premium Hero Section */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-black to-[#0a0a0a] z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2000')] bg-cover bg-center opacity-30" />
        
        <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-end pb-12">
          
          <Link 
            href="/dashboard-app" 
            className="absolute top-8 left-6 md:left-8 flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-105 transition-all shadow-lg backdrop-blur-md"
            aria-label="Back to Home"
          >
            <Home className="h-5 w-5" />
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 w-max">
            <Mic2 className="h-3.5 w-3.5" />
            MedOneX Audio Library
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Podcasts.
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Your academic journey, translated into sound. Explore hundreds of medical lectures and discussions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-30">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures, subjects..." 
              className="w-full h-14 bg-[#1a1a1a] border border-white/5 rounded-2xl pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1a1a1a] border border-white/5">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === "grid" ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === "list" ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Categories / Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
          {["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharma", "Micro"].map((cat) => (
            <button 
              key={cat}
              onClick={() => setSearch(cat)}
              className="h-20 flex items-center justify-center rounded-2xl bg-[#1a1a1a] border border-white/5 hover:bg-[#252525] hover:border-primary/50 transition-all group"
            >
              <span className="font-bold text-sm text-white/60 group-hover:text-primary transition-colors">{cat}</span>
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="space-y-16">
          {/* Latest Releases */}
          {latest.length > 0 && !search && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Latest Releases
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">
                {search ? `Results for "${search}"` : "All Audio Lectures"}
              </h2>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filtered.map((r) => (
                  <RecordCard 
                    key={r.id} 
                    record={r} 
                    onClick={() => setActiveRecord(r)} 
                    isActive={activeRecord?.id === r.id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((r, i) => (
                  <RecordListRow 
                    key={r.id} 
                    record={r} 
                    index={i} 
                    onClick={() => setActiveRecord(r)}
                    isActive={activeRecord?.id === r.id}
                  />
                ))}
              </div>
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
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-white/60 hover:text-white z-50 shadow-2xl transition-all"
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
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-4 rounded-[32px] transition-all cursor-pointer",
        isActive ? "bg-primary/10 border-primary/20" : "bg-[#1a1a1a] hover:bg-[#222] border border-white/5"
      )}
    >
      <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
          <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <Play className="h-6 w-6 ml-1" />
          </div>
        </div>
        <div className="h-full w-full bg-gradient-to-br from-[#333] to-[#111] flex items-center justify-center">
          <img 
            src={record.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.lecture.subject.name)}&background=22c55e&color=fff&size=400`} 
            className="h-full w-full object-cover transition-transform group-hover:scale-110" 
            alt={record.title} 
          />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{record.title}</h3>
        <p className="text-xs font-medium text-white/40 truncate">{record.artist || record.lecture.subject.name}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Audio</span>
        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
      </div>
    </motion.div>
  );
}

function RecordListRow({ record, index, onClick, isActive }: { record: RecordItem, index: number, onClick: () => void, isActive: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
        isActive ? "bg-primary/10" : "hover:bg-white/5"
      )}
    >
      <span className="w-8 text-sm font-bold text-white/20">{index + 1}</span>
      <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
        <img 
          src={record.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.lecture.subject.name)}&background=22c55e&color=fff&size=100`} 
          className="h-full w-full object-cover" 
          alt={record.title} 
        />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className={cn("text-sm font-bold truncate", isActive ? "text-primary" : "text-white")}>{record.title}</h4>
        <p className="text-xs font-medium text-white/40 truncate">{record.artist} • {record.lecture.subject.name}</p>
      </div>
      <div className="hidden md:flex items-center gap-6 text-xs font-bold text-white/40">
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(record.createdAt).toLocaleDateString()}</span>
        <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-4 w-4 ml-0.5 fill-current" />
        </div>
      </div>
    </button>
  );
}
