"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Loader2, Sparkles, Link as LinkIcon, Calendar, 
  Trash2, Video, Mic2, ArrowRight, CheckCircle2, 
  ChevronDown, Search, Layers, BookOpen, PlusCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SmartPlaylistSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  semesterId: string;
  semesterName: string;
  onSuccess: () => void;
}

/** 
 * Custom Dropdown for Subject Selection
 */
function CustomSubjectSelect({ value, subjects, onChange }: { value: string, subjects: any[], onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = subjects.find(s => s.id === value);
  
  const grouped: Record<string, any[]> = {};
  subjects.forEach(s => {
    if (!grouped[s.moduleName]) grouped[s.moduleName] = [];
    grouped[s.moduleName].push(s);
  });

  const filteredGroups = Object.entries(grouped).map(([moduleName, moduleSubjects]) => {
    const matching = moduleSubjects.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      moduleName.toLowerCase().includes(search.toLowerCase())
    );
    return { moduleName, subjects: matching };
  }).filter(g => g.subjects.length > 0);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/20 transition-all text-left">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="h-3 w-3 text-blue-400 shrink-0" />
          <span className="text-[10px] font-black text-white/80 truncate">
            {selected ? `[${selected.moduleName}] ➔ ${selected.name}` : "Select Subject..."}
          </span>
        </div>
        <ChevronDown className={cn("h-3 w-3 text-white/20 transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[120] top-full mt-2 left-0 right-0 max-h-[250px] overflow-hidden flex flex-col bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="p-2 border-b border-white/5"><input autoFocus placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-7 bg-black/40 border-none rounded-lg px-2 text-[10px] text-white" /></div>
            <div className="overflow-y-auto p-1 custom-scrollbar">
              {filteredGroups.map(({ moduleName, subjects: subjs }) => (
                <div key={moduleName} className="space-y-0.5">
                  <p className="px-2 py-1 text-[8px] font-black text-blue-400 uppercase tracking-widest opacity-50">{moduleName}</p>
                  {subjs.map(sub => (
                    <button key={sub.id} onClick={() => { onChange(sub.id); setIsOpen(false); }} className={cn("w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-[10px] font-bold", value === sub.id ? "bg-blue-600 text-white" : "hover:bg-white/5 text-white/60")}>
                      {sub.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 
 * Custom Dropdown for Lecture Selection
 */
function CustomLectureSelect({ value, lectures, onChange }: { value: string | null, lectures: any[], onChange: (val: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = lectures.find(l => l.id === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/20 transition-all text-left">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-3 w-3 text-purple-400 shrink-0" />
          <span className="text-[10px] font-black text-white/80 truncate">
            {selected ? selected.title : "Auto-Create New Lecture"}
          </span>
        </div>
        <ChevronDown className={cn("h-3 w-3 text-white/20 transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[120] top-full mt-2 left-0 right-0 max-h-[200px] overflow-hidden flex flex-col bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="overflow-y-auto p-1 custom-scrollbar">
              <button onClick={() => { onChange(null); setIsOpen(false); }} className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left text-[10px] font-black", !value ? "bg-purple-600 text-white" : "hover:bg-white/5 text-purple-400")}>
                <PlusCircle className="h-3 w-3" /> CREATE NEW LECTURE
              </button>
              <div className="h-px bg-white/5 my-1" />
              {lectures.map(lec => (
                <button key={lec.id} onClick={() => { onChange(lec.id); setIsOpen(false); }} className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left text-[10px] font-bold", value === lec.id ? "bg-blue-600 text-white" : "hover:bg-white/5 text-white/60")}>
                  {lec.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SmartPlaylistSyncDialog({ isOpen, onClose, semesterId, semesterName, onSuccess }: SmartPlaylistSyncDialogProps) {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [editionYear, setEditionYear] = useState(new Date().getFullYear().toString());
  const [mediaType, setMediaType] = useState<"video" | "podcast">("video");
  const [overwrite, setOverwrite] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  const handlePreview = async () => {
    if (!playlistUrl.trim()) return toast.error("Please enter a playlist URL");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/playlist-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl, semesterId, editionYear, mediaType, action: "preview" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewData(data.previewData);
        setAvailableSubjects(data.availableSubjects);
      } else toast.error(data.error || "Failed to fetch preview");
    } catch (e) { toast.error("Network error"); } finally { setLoading(false); }
  };

  const handleCommit = async () => {
    if (!previewData?.length) return toast.error("No items to sync.");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/playlist-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl, semesterId, editionYear, mediaType, overwrite, autoSync, action: "commit", items: previewData }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); onSuccess(); } else toast.error(data.error || "Sync failed");
    } catch (e) { toast.error("Network error"); } finally { setLoading(false); }
  };

  const updateItem = (idx: number, updates: any) => {
    if (!previewData) return;
    const newData = [...previewData];
    newData[idx] = { ...newData[idx], ...updates };
    setPreviewData(newData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-card rounded-[32px] shadow-2xl border border-white/10 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-white/5 bg-background/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]"><Sparkles className="h-5 w-5" /></div>
            <div><h2 className="text-xl font-black tracking-tight">AI Playlist Sync</h2><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{semesterName}</p></div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!previewData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setMediaType("video")} className={cn("flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all", mediaType === "video" ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white")}><Video className="h-6 w-6" /><span className="text-xs font-bold uppercase tracking-wider">Save as Videos</span></button>
                <button onClick={() => setMediaType("podcast")} className={cn("flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all", mediaType === "podcast" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white")}><Mic2 className="h-6 w-6" /><span className="text-xs font-bold uppercase tracking-wider">Save as Podcasts</span></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Playlist URL</label><div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input value={playlistUrl} onChange={(e) => setPlaylistUrl(e.target.value)} placeholder="YouTube Playlist or Spotify link..." className="w-full h-12 bg-background border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/10" /></div></div>
                <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Edition Year</label><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input type="number" value={editionYear} onChange={(e) => setEditionYear(e.target.value)} placeholder="e.g. 2026" className="w-full h-12 bg-background border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" /></div></div>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <label className="flex items-center gap-3 cursor-pointer"><div className="relative flex items-center justify-center"><input type="checkbox" className="sr-only peer" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /><div className="w-10 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div></div><div className="flex-1"><p className="text-sm font-bold text-white">Overwrite Existing</p><p className="text-xs text-white/40">Delete current {mediaType}s before syncing.</p></div></label>
                <div className="h-px w-full bg-white/5 my-2" />
                <label className="flex items-center gap-3 cursor-pointer"><div className="relative flex items-center justify-center"><input type="checkbox" className="sr-only peer" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} /><div className="w-10 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div></div><div className="flex-1"><p className="text-sm font-bold text-white">Daily Auto-Sync</p><p className="text-xs text-white/40">Check this playlist every day for new items.</p></div></label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {previewData.map((item, idx) => (
                <div key={idx} className="group/item flex flex-col gap-4 p-5 rounded-[24px] bg-white/5 border border-white/5 hover:border-white/10 transition-all shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-16 shrink-0 rounded-lg overflow-hidden bg-black border border-white/5 relative">{item.thumbnail && <img src={item.thumbnail} className="h-full w-full object-cover" alt="" />}</div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-black text-white leading-tight mb-1 truncate">{item.title}</p></div>
                    <button onClick={() => setPreviewData(previewData.filter((_, i) => i !== idx))} className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover/item:opacity-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/20 uppercase ml-1">Subject</p>
                      <CustomSubjectSelect 
                        value={item.matchedSubjectId} 
                        subjects={availableSubjects} 
                        onChange={(subId) => {
                          const sub = availableSubjects.find(s => s.id === subId);
                          updateItem(idx, { matchedSubjectId: subId, matchedSubjectName: sub.name, matchedModuleName: sub.moduleName, matchedLectureId: null });
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/20 uppercase ml-1">Lecture (Chapter)</p>
                      <CustomLectureSelect 
                        value={item.matchedLectureId} 
                        lectures={availableSubjects.find(s => s.id === item.matchedSubjectId)?.lectures || []} 
                        onChange={(lecId) => updateItem(idx, { matchedLectureId: lecId })} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 p-6 border-t border-white/5 bg-background/50 flex justify-end gap-3">
          {previewData ? (
            <><button onClick={() => setPreviewData(null)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white">Reset</button><button onClick={handleCommit} disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)]">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Syncing...</> : <>Confirm Sync</>}</button></>
          ) : (
            <><button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white">Cancel</button><button onClick={handlePreview} disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)]">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <>Preview Sync <ArrowRight className="h-4 w-4" /></>}</button></>
          )}
        </div>
      </motion.div>
    </div>
  );
}
