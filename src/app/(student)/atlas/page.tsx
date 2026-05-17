"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, ChevronRight, Info, ExternalLink, Zap, ArrowLeft, BrainCircuit, Activity, Heart, Eye, ArrowUpRight, Home, Bone, Dumbbell, Brain, Wind, Utensils, FlaskConical, Droplets, Shield, Star, BookOpen, Sparkles, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Custom drawer & modal imports
import AtlasAIDrawer from "@/components/AtlasAIDrawer";
import AtlasQuizModal from "@/components/AtlasQuizModal";

const ICON_MAP: Record<string, React.ElementType> = {
  Bone, Dumbbell, Brain, Wind, Utensils, FlaskConical, Droplets, Shield, Eye, Heart, Activity,
};

type AtlasSystem = {
  id: string; systemId: string; label: string; color: string; border: string;
  iconColor: string; iconName: string; desc: string;
  structures?: AtlasStructure[];
};

type AtlasStructure = {
  id: string; slug: string; name: string; latin?: string; type: string; desc: string;
  region?: string; systemId: string; fn?: string; blood?: string; nerve?: string;
  relations?: string[]; clinical?: string; memo?: string; imageUrl?: string; modelUrl?: string;
  system?: { label: string; iconColor: string };
};

const TYPE_COLORS = {
  bone:     { bg: "bg-teal-500/10",    text: "text-teal-400", border: "border-teal-500/20" },
  muscle:   { bg: "bg-red-500/10",      text: "text-red-400", border: "border-red-500/20" },
  nerve:    { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  organ:    { bg: "bg-pink-500/10",    text: "text-pink-400", border: "border-pink-500/20" },
  vessel:   { bg: "bg-rose-500/10",    text: "text-rose-400", border: "border-rose-500/20" },
  joint:    { bg: "bg-amber-500/10",  text: "text-amber-400", border: "border-amber-500/20" },
  ligament: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  gland:    { bg: "bg-emerald-500/10",  text: "text-emerald-400", border: "border-emerald-500/20" },
  special:  { bg: "bg-fuchsia-500/10",    text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
} as const;

type AtlasTypeKey = keyof typeof TYPE_COLORS;

function atlasTypeStyle(type: string) {
  const k = type as AtlasTypeKey;
  return k in TYPE_COLORS ? TYPE_COLORS[k] : TYPE_COLORS.organ;
}

export default function AtlasPage() {
  const [systems, setSystems] = useState<AtlasSystem[]>([]);
  const [structures, setStructures] = useState<AtlasStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & selections
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<AtlasStructure | null>(null);
  const [search, setSearch] = useState("");

  // Sub-features state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [personalNote, setPersonalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [relatedLectures, setRelatedLectures] = useState<any[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  // Modals & Drawers state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  // Load basic data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/v1/atlas");
        if (res.ok) {
          const sysData: AtlasSystem[] = await res.json();
          setSystems(sysData);
          const allStructs = sysData.flatMap(s => (s.structures || []).map(struct => ({
            ...struct,
            system: { label: s.label, iconColor: s.iconColor }
          })));
          setStructures(allStructs);
        }
      } catch (e) {
        console.error("Failed to load atlas database", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch bookmarks & personal notes for selected organ
  useEffect(() => {
    if (!selectedOrgan) return;

    // Reset details
    setIsBookmarked(false);
    setPersonalNote("");
    setRelatedLectures([]);

    // 1. Fetch Bookmark Status
    fetch(`/api/v1/atlas/bookmarks?structureId=${selectedOrgan.id}`)
      .then(res => res.json())
      .then(data => setIsBookmarked(!!data.bookmarked))
      .catch(e => console.error("Error checking bookmark status", e));

    // 2. Fetch Personal Note
    fetch(`/api/v1/atlas/notes?structureId=${selectedOrgan.id}`)
      .then(res => res.json())
      .then(data => setPersonalNote(data.content || ""))
      .catch(e => console.error("Error fetching note", e));

    // 3. Fetch Related lectures from curriculum search API
    setLoadingLectures(true);
    fetch(`/api/v1/videos/search?q=${encodeURIComponent(selectedOrgan.name)}`)
      .then(res => res.json())
      .then(data => setRelatedLectures(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(e => console.error("Error searching related lectures", e))
      .finally(() => setLoadingLectures(false));

  }, [selectedOrgan]);

  // Toggle Bookmark handler
  const handleToggleBookmark = async () => {
    if (!selectedOrgan) return;
    try {
      const res = await fetch("/api/v1/atlas/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: selectedOrgan.id })
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
      }
    } catch (e) {
      console.error("Bookmark toggle failed", e);
    }
  };

  // Save personal note handler
  const handleSaveNote = async () => {
    if (!selectedOrgan) return;
    setSavingNote(true);
    try {
      await fetch("/api/v1/atlas/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: selectedOrgan.id, content: personalNote })
      });
    } catch (e) {
      console.error("Note save failed", e);
    } finally {
      setSavingNote(false);
    }
  };

  // Filter logic
  const filteredStructures = useMemo(() => {
    let result = structures;
    if (activeSystem) {
      result = result.filter(s => s.systemId === activeSystem);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        (s.latin && s.latin.toLowerCase().includes(q)) ||
        (s.clinical && s.clinical.toLowerCase().includes(q))
      );
    }
    return result;
  }, [structures, activeSystem, search]);

  const activeSystemData = systems.find(s => s.systemId === activeSystem);
  const ActiveSysIcon = activeSystemData ? (ICON_MAP[activeSystemData.iconName] ?? Activity) : null;

  return (
    <div className="relative min-h-[85vh] w-full flex flex-col pb-40 text-white">

      {/* --- HERO SECTION --- */}
      {!selectedOrgan && (
        <div className="relative h-[320px] md:h-[400px] w-full overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/30 via-transparent dark:to-[#0a0a0a] to-slate-50 z-10" />
          <div className="absolute inset-0 dark:bg-black/30 bg-white/20 z-15" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=2000')] bg-cover bg-center opacity-30" />

          <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-end pb-12 pt-32 max-w-7xl">
            <Link
              href="/dashboard-app"
              className="absolute top-28 left-6 flex items-center justify-center h-10 w-10 rounded-full bg-black/30 border border-white/10 text-white hover:bg-black/50 transition-all shadow-sm backdrop-blur-md"
            >
              <Home className="h-5 w-5" />
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-4 w-max">
              <Activity className="h-3.5 w-3.5" />
              {activeSystemData ? `${activeSystemData.label} Module` : "Interactive Anatomy"}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2">
              {activeSystemData ? activeSystemData.label : "Atlas."}
            </h1>
            <p className="text-sm md:text-base text-white/60 max-w-xl font-bold uppercase tracking-widest drop-shadow-md">
              {activeSystemData ? activeSystemData.desc : "Explore the human body through detailed 3D structures and clinical correlations."}
            </p>
          </div>
        </div>
      )}

      {/* --- RENDER STATE MANAGER --- */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-white/40 font-bold text-sm uppercase tracking-widest">Loading interactive atlas...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* --- STATE 1: Landing Page (All Systems pills view) --- */}
          {!activeSystem && !selectedOrgan && !search && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 w-full"
            >
              <div className="container mx-auto px-6 max-w-7xl -mt-8 relative z-30">
                {/* Search Bar on Landing */}
                <div className="relative w-full lg:w-[480px] group mb-10 shadow-2xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-500/40 group-focus-within:text-cyan-500 transition-colors" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search structures, nerves, clinical notes..."
                    className="w-full h-14 bg-[#111115] border border-white/10 rounded-2xl pl-12 pr-12 text-base font-bold focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-white/20 text-white"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-white/30 hover:text-cyan-500 transition-colors" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {systems.map((sys) => {
                    const SysIcon = ICON_MAP[sys.iconName] ?? Activity;
                    const count = structures.filter(d => d.systemId === sys.systemId).length;
                    return (
                      <motion.button
                        key={sys.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSystem(sys.systemId)}
                        className={cn(
                          "group relative flex flex-col items-start p-6 rounded-[24px] border bg-[#111115] border-white/5 overflow-hidden text-left transition-all duration-300 shadow-xl hover:border-cyan-500/50"
                        )}
                      >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500", sys.color)} />

                        <div
                          className={cn("mb-5 relative z-10 p-3 rounded-2xl bg-white/5 border border-white/10 w-fit", sys.iconColor)}
                          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
                        >
                          <SysIcon className="w-8 h-8 stroke-[2.5]" />
                        </div>

                        <h3 className="text-lg font-black tracking-tight text-white mb-1 relative z-10">{sys.label} System</h3>
                        <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mb-6 line-clamp-2 relative z-10">{sys.desc}</p>

                        <div className="mt-auto flex items-center justify-between w-full relative z-10 pt-4 border-t border-white/5">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                            {count} Structures
                          </span>
                          <ArrowUpRight className={cn("w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 text-cyan-500")} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- STATE 2: System View (Grid of structures within a system or global search) --- */}
          {((activeSystem || search) && !selectedOrgan) && (
            <motion.div
              key="system-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col flex-1 container mx-auto px-6 max-w-7xl pt-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  {!search && (
                    <button
                      onClick={() => setActiveSystem(null)}
                      className="p-2 rounded-full bg-[#1a1a1f] border border-white/5 text-white/50 hover:text-cyan-500 transition-colors shadow-sm"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                      {search ? "Search Results" : (
                        <>
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className={cn("p-2 rounded-xl bg-white/5 border border-white/10", activeSystemData?.iconColor)}
                          >
                            {ActiveSysIcon && <ActiveSysIcon className="w-6 h-6 stroke-[2.5]" />}
                          </motion.span>
                          <span>{activeSystemData?.label} System</span>
                        </>
                      )}
                    </h2>
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">{filteredStructures.length} structures found</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* System Quick Quiz trigger */}
                  {activeSystem && (
                    <button
                      onClick={() => setQuizModalOpen(true)}
                      className="flex items-center gap-2 px-4 h-12 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white font-black text-xs rounded-2xl transition-all shadow-md"
                    >
                      <BrainCircuit className="w-4 h-4" /> Start Quick Quiz
                    </button>
                  )}

                  <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/40 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search structures..."
                      className="w-full h-12 bg-[#111115] border border-white/5 rounded-2xl pl-10 pr-10 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-white/20 text-white"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                        <X className="h-3 w-3 text-white/30 hover:text-cyan-500 transition-colors" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStructures.map((organ) => {
                  const tc = atlasTypeStyle(organ.type);
                  return (
                    <motion.button
                      key={organ.id}
                      layoutId={`card-${organ.id}`}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedOrgan(organ)}
                      className="flex flex-col text-left bg-[#111115] border border-white/5 rounded-[24px] p-5 hover:border-cyan-500/50 transition-all shadow-xl hover:shadow-2xl"
                    >
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div>
                          <h3 className="font-black tracking-tight text-white truncate pr-2 text-[16px]">{organ.name}</h3>
                          {organ.latin && <p className="text-xs text-white/40 font-serif italic mt-0.5">{organ.latin}</p>}
                        </div>
                        <span className={cn("text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-md shrink-0 border", tc.bg, tc.text, tc.border)}>
                          {organ.type}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-3 leading-relaxed mb-4 flex-1">
                        {organ.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                        <span className="text-[10px] font-black bg-black/30 text-white/40 px-2.5 py-1 rounded-md border border-white/5">
                          📍 {organ.region || "General"}
                        </span>
                        {organ.clinical && (
                          <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1 uppercase tracking-widest animate-pulse">
                            <Info className="w-3 h-3" /> Clinical
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {filteredStructures.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#1a1a1f] rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                      <Search className="w-6 h-6 text-cyan-500/50" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white">No structures found</h3>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* --- STATE 3: Detail View (Highly interactive, links, video suggestions, quiz, study notes) --- */}
          {selectedOrgan && (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col flex-1 container mx-auto px-6 max-w-7xl pt-32"
            >
              <div className="flex flex-col xl:flex-row gap-8">

                {/* Left Column: Visuals, AI Tutor, and Personal Notes */}
                <div className="w-full xl:w-[45%] flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedOrgan(null)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-cyan-500 transition-colors w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to List
                    </button>

                    {/* Bookmark star trigger */}
                    <button
                      onClick={handleToggleBookmark}
                      className={cn(
                        "p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                        isBookmarked
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                      )}
                    >
                      <Star className={cn("w-4 h-4", isBookmarked ? "fill-amber-400 stroke-amber-400" : "")} />
                      {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                  </div>

                  {/* Anatomical Image Display */}
                  <motion.div layoutId={`card-${selectedOrgan.id}`} className="relative aspect-square sm:aspect-video xl:aspect-square w-full rounded-[32px] border border-white/5 overflow-hidden bg-[#111115] flex flex-col items-center justify-center group shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-black/40 to-black" />

                    {selectedOrgan.imageUrl ? (
                      <img src={selectedOrgan.imageUrl} alt={selectedOrgan.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-6 drop-shadow-2xl opacity-50 text-cyan-500">
                          {(() => {
                            const SysIcon = ICON_MAP[selectedOrgan.system?.iconColor.replace("text-", "").toLowerCase() || "activity"] ?? Activity;
                            return <SysIcon className="w-32 h-32" />;
                          })()}
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-black/85 border border-white/10 backdrop-blur-md">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Anatomy visualization</span>
                        </div>
                      </div>
                    )}

                    {/* Decorative grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
                  </motion.div>

                  {/* Ask AI & Quiz Actions row */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAiDrawerOpen(true)}
                      className="relative group overflow-hidden rounded-[24px] p-[1px] focus:outline-none flex-1 shadow-lg"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-center justify-center gap-2 bg-[#1a1a1f] px-4 py-3.5 rounded-[24px] w-full text-sm font-black tracking-tight text-white">
                        <BrainCircuit className="w-4 h-4 text-cyan-400" /> Ask AI Tutor
                      </div>
                    </button>

                    <button
                      onClick={() => setQuizModalOpen(true)}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-sm rounded-[24px] py-3.5 shadow-lg transition-all"
                    >
                      <Sparkles className="w-4 h-4" /> Start Quick Quiz
                    </button>
                  </div>

                  {/* Personal Study Notes block */}
                  <div className="bg-[#111115] border border-white/5 rounded-[28px] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                        <BookOpen className="w-4 h-4 text-cyan-400" /> Personal Study Notes
                      </h4>
                      {personalNote && (
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          className="text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
                        >
                          {savingNote ? "Saving..." : "Save Note"}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={personalNote}
                      onChange={e => setPersonalNote(e.target.value)}
                      onBlur={handleSaveNote}
                      placeholder="Write your clinical mnemonics, study tips, or review points here. Note saves automatically."
                      rows={4}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 resize-none"
                    />
                  </div>
                </div>

                {/* Right Column: Full details & relations & curriculum references */}
                <div className="w-full xl:w-[55%] flex flex-col">
                  <div className="mb-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2">{selectedOrgan.name}</h1>
                        {selectedOrgan.latin && <p className="text-lg text-white/40 font-serif italic">{selectedOrgan.latin}</p>}
                      </div>
                      {(() => {
                        const tc = atlasTypeStyle(selectedOrgan.type);
                        return (
                          <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border shrink-0", tc.bg, tc.text, tc.border)}>
                            {selectedOrgan.type}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-white/80 text-lg leading-relaxed font-medium">{selectedOrgan.desc}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {selectedOrgan.fn && (
                      <div className="bg-[#111115] border border-white/5 p-5 rounded-[24px] shadow-sm">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                          <Activity className="w-4 h-4 text-cyan-400" /> Function / Action
                        </h4>
                        <p className="text-sm text-white/85 leading-relaxed font-medium">{selectedOrgan.fn}</p>
                      </div>
                    )}
                    {selectedOrgan.blood && (
                      <div className="bg-[#111115] border border-white/5 p-5 rounded-[24px] shadow-sm">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                          <Heart className="w-4 h-4 text-rose-400" /> Blood Supply
                        </h4>
                        <p className="text-sm text-white/85 leading-relaxed font-medium">{selectedOrgan.blood}</p>
                      </div>
                    )}
                    {selectedOrgan.nerve && (
                      <div className="bg-[#111115] border border-white/5 p-5 rounded-[24px] shadow-sm">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                          <Zap className="w-4 h-4 text-amber-400" /> Innervation
                        </h4>
                        <p className="text-sm text-white/85 leading-relaxed font-medium">{selectedOrgan.nerve}</p>
                      </div>
                    )}

                    {/* Dynamic clickable Hyperlinked Relations */}
                    {selectedOrgan.relations && selectedOrgan.relations.length > 0 && (
                      <div className="bg-[#111115] border border-white/5 p-5 rounded-[24px] shadow-sm">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                          <Eye className="w-4 h-4 text-emerald-400" /> Relations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrgan.relations.map(relName => {
                            // Find structure with matching name to make it clickable
                            const matchingStruct = structures.find(s => s.name.toLowerCase() === relName.toLowerCase() || s.slug.toLowerCase() === relName.toLowerCase().replace(/\s+/g, "-"));
                            return (
                              <button
                                key={relName}
                                onClick={() => {
                                  if (matchingStruct) {
                                    setSelectedOrgan(matchingStruct);
                                  }
                                }}
                                disabled={!matchingStruct}
                                className={cn(
                                  "px-2.5 py-1 text-xs rounded-md border font-bold transition-all",
                                  matchingStruct
                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                                    : "bg-black/30 border-white/5 text-white/40"
                                )}
                              >
                                {relName} {matchingStruct && "↗"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clinical Significance Note */}
                  {selectedOrgan.clinical && (
                    <div className="relative overflow-hidden rounded-[24px] border border-rose-500/30 bg-rose-500/5 p-6 mb-6">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-400 to-rose-600" />
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-3 ml-2">
                        <Info className="w-4 h-4" /> Clinical Significance
                      </h4>
                      <p className="text-sm text-rose-100/90 leading-relaxed font-medium ml-2">{selectedOrgan.clinical}</p>
                    </div>
                  )}

                  {/* Mnemonic block */}
                  {selectedOrgan.memo && (
                    <div className="relative overflow-hidden rounded-[24px] border border-indigo-500/30 bg-indigo-500/5 p-6 mb-6">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-indigo-600" />
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 ml-2">
                        <Zap className="w-4 h-4" /> Mnemonic / Memory Aid
                      </h4>
                      <p className="text-sm text-indigo-100/90 leading-relaxed font-serif italic text-lg ml-2">"{selectedOrgan.memo}"</p>
                    </div>
                  )}

                  {/* Curriculum Linked Lectures module */}
                  <div className="bg-[#111115] border border-white/5 rounded-[28px] p-6 mb-6">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
                      <Play className="w-4 h-4 text-cyan-400 animate-pulse" /> Related Curriculum Lectures
                    </h4>
                    {loadingLectures ? (
                      <div className="flex items-center gap-2 text-white/30 text-xs"><Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Locating linked videos...</div>
                    ) : relatedLectures.length === 0 ? (
                      <p className="text-xs text-white/30 font-bold uppercase tracking-wider">No lectures currently tagged to this structure.</p>
                    ) : (
                      <div className="space-y-3">
                        {relatedLectures.map((video: any) => (
                          <a
                            key={video.id}
                            href={`/videos?v=${video.videoId}`}
                            className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/20 rounded-2xl transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 aspect-video rounded-lg bg-black/40 overflow-hidden relative border border-white/10">
                                <img src={video.thumbnail || "https://img.youtube.com/vi/placeholder/mqdefault.jpg"} alt={video.title} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{video.title}</h5>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-wider mt-0.5">{video.subjectName || "Medical Lecture"}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External research links */}
                  <div className="mt-auto pt-4 flex gap-3 flex-wrap">
                    {[["Radiopaedia", `https://radiopaedia.org/search?q=${encodeURIComponent(selectedOrgan.name)}`],
                      ["Kenhub", `https://www.kenhub.com/en/library/search?q=${encodeURIComponent(selectedOrgan.name)}`]].map(([label, url]) => (
                      <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1f] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {label}
                      </a>
                    ))}
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* --- Dynamic Bottom Button Bar for System Switching (Fixed above Floating Island) --- */}
      <AnimatePresence>
        {(activeSystem || selectedOrgan) && !search && !loading && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl"
          >
            <div className="bg-[#16161c]/90 backdrop-blur-xl border border-white/10 p-2 rounded-[24px] shadow-2xl flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges">
              <button
                onClick={() => { setActiveSystem(null); setSelectedOrgan(null); }}
                className="flex flex-col items-center justify-center p-2 min-w-[60px] rounded-[16px] text-white/50 hover:bg-white/5 transition-colors shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center mb-1">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
              </button>

              <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-1" />

              {systems.map((sys) => {
                const SysIcon = ICON_MAP[sys.iconName] ?? Activity;
                return (
                  <button
                    key={sys.id}
                    onClick={() => {
                      setActiveSystem(sys.systemId);
                      setSelectedOrgan(null);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 min-w-[64px] rounded-[16px] transition-all shrink-0",
                      activeSystem === sys.systemId && !selectedOrgan
                        ? "bg-cyan-500/10 text-cyan-400 font-black"
                        : "text-white/50 hover:bg-white/5"
                    )}
                  >
                    <div className="mb-1">
                      <SysIcon className={cn("w-6 h-6 stroke-[2.5]", activeSystem === sys.systemId && !selectedOrgan ? sys.iconColor : "")} />
                    </div>
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider", activeSystem === sys.systemId && !selectedOrgan ? "text-cyan-400" : "")}>
                      {sys.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DRAWERS & MODALS --- */}
      <AtlasAIDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        structureId={selectedOrgan?.id}
        structureName={selectedOrgan?.name}
        systemId={selectedOrgan?.systemId || activeSystem || undefined}
        systemLabel={selectedOrgan?.system?.label || activeSystemData?.label || undefined}
      />

      <AtlasQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        structureId={selectedOrgan?.id}
        systemId={selectedOrgan?.systemId || activeSystem || undefined}
        targetName={selectedOrgan?.name || activeSystemData?.label || "Anatomy"}
      />

    </div>
  );
}
