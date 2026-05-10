"use client";
import { useState, useEffect } from "react";
import {
  Plus, Video, Layers, Trash2, Save, Loader2,
  BookOpen, ChevronDown, Pencil, Check, X, FileText, ExternalLink, Library
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

interface Module   { id: string; name: string }
interface Subject  { id: string; name: string; moduleId: string }
interface Flashcard { id: string; front: string; back: string }
interface LectureFile { id: string; name: string; url: string; mimeType: string }
interface Lecture  {
  id: string; title: string; videoUrl?: string; subjectId: string; order: number;
  type: "LECTURE" | "PRACTICAL";
  flashcards?: Flashcard[];
  files?: LectureFile[];
  checklist?: { id: string; items: { id: string; content: string; points: number }[] };
}

export default function AdminLecturesPage() {
  const [modules,  setModules]  = useState<Module[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedModule,  setSelectedModule]  = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // New lecture form
  const [title,    setTitle]    = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lectureType, setLectureType] = useState<"LECTURE" | "PRACTICAL">("LECTURE");
  const [checklistItems, setChecklistItems] = useState([{ content: "", points: 1 }]);
  const [newCards, setNewCards] = useState([{ front: "", back: "" }]);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/modules-all").then(r => r.json()),
      fetch("/api/v1/subjects-all").then(r => r.json()),
    ]).then(([m, s]) => {
      setModules(unwrapApiList<Module>(m));
      setSubjects(unwrapApiList<Subject>(s));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setLectures([]);
      return;
    }
    setLoading(true);
    fetch(`/api/v1/subjects/${selectedSubject}/lectures`)
      .then(r => r.json())
      .then(data => {
        setLectures(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedSubject]);

  const filteredSubjects = subjects.filter(s => s.moduleId === selectedModule);

  async function expandLecture(lecId: string) {
    if (expanded === lecId) { setExpanded(null); return; }
    setExpanded(lecId);
    const existing = lectures.find(l => l.id === lecId);
    if (existing?.flashcards) return;
    
    try {
      const res = await fetch(`/api/v1/lectures/${lecId}`);
      const data = await res.json();
      setLectures(prev =>
        prev.map(l =>
          l.id === lecId
            ? { ...l, flashcards: data.flashcards ?? [], files: data.files ?? [], title: data.title ?? l.title, videoUrl: data.videoUrl ?? l.videoUrl }
            : l
        )
      );
    } catch {}
  }

  async function createLecture() {
    if (!title.trim() || !selectedSubject) return toast.error("Fill in title and select a subject");
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/subjects/${selectedSubject}/lectures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          videoUrl: videoUrl || undefined,
          type: lectureType,
          checklist: lectureType === "PRACTICAL" ? {
            title: `${title} Checklist`,
            items: checklistItems.filter(i => i.content.trim())
          } : undefined,
          flashcards: newCards.filter(c => c.front.trim() && c.back.trim()),
        }),
      });
      if (res.ok) {
        const lec = await res.json();
        setLectures(prev => [...prev, lec]);
        toast.success("Lecture published!");
        setTitle(""); setVideoUrl(""); setNewCards([{ front: "", back: "" }]);
        setShowForm(false);
      } else {
        toast.error(await apiErrorMessage(res, "Failed to create"));
      }
    } finally { setSaving(false); }
  }

  async function deleteLecture(id: string) {
    if (!confirm("Delete this lecture? All flashcards and files will be removed.")) return;
    const res = await fetch(`/api/v1/lectures/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLectures((prev) => prev.filter((l) => l.id !== id));
      toast.success("Deleted");
    } else toast.error(await apiErrorMessage(res, "Failed to delete"));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#534AB7] mb-2">Curriculum Assets</p>
          <h1 className="font-display text-3xl font-bold md:text-4xl text-white tracking-tight">Lectures Directory</h1>
          <p className="mt-2 text-sm text-white/50 max-w-lg">
            Manage educational sessions, video content, and active-recall resources in a unified dark interface.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/[0.02] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-white/60 sm:flex">
            <Video className="h-4 w-4 text-[#534AB7]" />
            <span>{lectures.length.toLocaleString()} Items</span>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-2 rounded-2xl bg-[#534AB7] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#534AB7]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all font-display"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Lecture"}
          </button>
        </div>
      </div>

      {/* Scope Filter Section */}
      <div className="rounded-[2rem] border border-white/[0.02] bg-white/[0.02] p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#534AB7]/10 text-[#534AB7]">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Scope Config</span>
          </div>
          <p className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-white/30">Define subject scope to list content</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Module Selection</label>
            <MedqsSelect
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setSelectedSubject("");
                setLectures([]);
              }}
              className="w-full h-12 rounded-xl border-white/[0.02] bg-black/40 text-white focus:ring-[#534AB7]/40"
            >
              <option value="">Choose Module…</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </MedqsSelect>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Subject Selection</label>
            <MedqsSelect
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedModule}
              className="w-full h-12 rounded-xl border-white/[0.02] bg-black/40 text-white focus:ring-[#534AB7]/40"
            >
              <option value="">Choose Subject…</option>
              {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </MedqsSelect>
          </div>
          <div className="space-y-2 flex flex-col justify-end">
             <button 
               onClick={() => {
                 toast.success("Tip: Use Medical Library to discovery & import entire lectures!");
                 window.open("/admin/medical-library", "_blank");
               }}
               className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl border border-[#534AB7]/30 bg-[#534AB7]/10 text-[#534AB7] text-[11px] font-black uppercase tracking-widest hover:bg-[#534AB7] hover:text-white transition-all w-full lg:w-auto"
             >
               <Library className="h-4 w-4" />
               Discover Library
             </button>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-[2rem] border border-[#534AB7]/20 bg-white/[0.02] p-8 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4 border-b border-white/[0.02] pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#534AB7]/10 text-[#534AB7]">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">New Educational Session</h2>
              <p className="text-sm text-white/50">Configure the session title and attach media resources.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Lecture Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clinical Approach to Shock"
                  className="w-full h-12 rounded-xl border border-white/[0.02] bg-black/40 px-4 text-sm text-white focus:ring-[#534AB7]/40 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Video Resource (Embed Link)</label>
                <div className="relative">
                  <Video className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    className="w-full h-12 rounded-xl border border-white/[0.02] bg-black/40 pl-10 pr-4 text-sm text-white focus:ring-[#534AB7]/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Session Type</label>
                <div className="flex gap-2">
                  {(["LECTURE", "PRACTICAL"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLectureType(t)}
                      className={cn(
                        "flex-1 h-11 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        lectureType === t ? "bg-[#534AB7] border-[#534AB7] text-white" : "bg-black/40 border-white/5 text-white/40 hover:border-white/20"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              {lectureType === "PRACTICAL" && (
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Procedure Checklist</label>
                     <button type="button" onClick={() => setChecklistItems([...checklistItems, { content: "", points: 1 }])} className="text-[10px] font-bold text-primary uppercase">+ Add Step</button>
                   </div>
                   <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                      {checklistItems.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            placeholder="Step description…" 
                            className="flex-1 h-10 rounded-lg bg-black/40 border border-white/5 px-3 text-xs text-white"
                            value={item.content}
                            onChange={(e) => setChecklistItems(prev => prev.map((x, j) => j === i ? { ...x, content: e.target.value } : x))}
                          />
                          <input 
                            type="number"
                            className="w-16 h-10 rounded-lg bg-black/40 border border-white/5 px-2 text-xs text-center text-white"
                            value={item.points}
                            onChange={(e) => setChecklistItems(prev => prev.map((x, j) => j === i ? { ...x, points: parseInt(e.target.value) || 1 } : x))}
                          />
                          <button onClick={() => setChecklistItems(prev => prev.filter((_, j) => j !== i))} className="h-10 w-10 shrink-0 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"><X className="h-3 w-3"/></button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Starter Study Cards</label>
                <button
                  type="button"
                  onClick={() => setNewCards([...newCards, { front: "", back: "" }])}
                  className="text-[10px] font-bold text-[#534AB7] uppercase hover:underline"
                >
                  + Add Item
                </button>
              </div>
              <div className="space-y-2">
                {newCards.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="Card Front (Term)"
                      className="flex-1 h-11 rounded-xl border border-white/[0.02] bg-black/40 px-3 text-xs text-white focus:ring-[#534AB7]/40 focus:outline-none"
                      value={c.front}
                      onChange={(e) => setNewCards(prev => prev.map((x, j) => j === i ? { ...x, front: e.target.value } : x))}
                    />
                    <input
                      placeholder="Card Back (Info)"
                      className="flex-1 h-11 rounded-xl border border-white/[0.02] bg-black/40 px-3 text-xs text-white focus:ring-[#534AB7]/40 focus:outline-none"
                      value={c.back}
                      onChange={(e) => setNewCards(prev => prev.map((x, j) => j === i ? { ...x, back: e.target.value } : x))}
                    />
                    <button
                      onClick={() => setNewCards(prev => prev.filter((_, j) => i !== j))}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.02] pt-6">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-white/40 hover:text-white">Discard Session</button>
            <button
              onClick={createLecture}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-[#534AB7] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#534AB7]/30 hover:-translate-y-0.5 disabled:opacity-60 transition-all font-display"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
             Build Course
            </button>
          </div>
        </div>
      )}

      {/* Lectures list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : !selectedSubject ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/[0.02] py-24 text-center bg-white/[0.02]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] mb-4">
            <Layers className="h-8 w-8 text-white/30" />
          </div>
          <p className="font-display text-lg font-bold text-white">Scope Undefined</p>
          <p className="max-w-xs text-sm text-white/40 mt-1">Please select a module and subject to manage curriculum content.</p>
        </div>
      ) : lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/[0.02] py-24 text-center bg-white/[0.02]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] mb-4">
            <BookOpen className="h-8 w-8 text-white/30" />
          </div>
          <p className="font-display text-lg font-bold text-white">Subject is Empty</p>
          <p className="max-w-xs text-sm text-white/40 mt-1">Start building the curriculum by adding the first lecture session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lectures.sort((a,b) => a.order - b.order).map((lec, idx) => (
            <LectureRow
              key={lec.id}
              lecture={lec}
              index={idx}
              expanded={expanded === lec.id}
              onExpand={() => expandLecture(lec.id)}
              onDelete={() => deleteLecture(lec.id)}
              onFlashcardsChange={(cards) =>
                setLectures(prev => prev.map(l => l.id === lec.id ? { ...l, flashcards: cards } : l))
              }
              onLecturePatch={(patch) =>
                setLectures((prev) => prev.map((l) => (l.id === lec.id ? { ...l, ...patch } : l)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LectureRow({ lecture, index, expanded, onExpand, onDelete, onFlashcardsChange, onLecturePatch }: {
  lecture: Lecture; index: number; expanded: boolean;
  onExpand: () => void; onDelete: () => void;
  onFlashcardsChange: (cards: Flashcard[]) => void;
  onLecturePatch: (patch: Partial<Lecture>) => void;
}) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack,  setEditBack]  = useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [addFront, setAddFront] = useState("");
  const [addBack,  setAddBack]  = useState("");
  const [addingCard, setAddingCard] = useState(false);
  
  const [editTitle, setEditTitle] = useState(lecture.title);
  const [editVideo, setEditVideo] = useState(lecture.videoUrl ?? "");
  const [savingLecture, setSavingLecture] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);

  const cards = lecture.flashcards ?? [];
  const files = lecture.files ?? [];

  function startEditCard(card: Flashcard) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  async function saveCard(cardId: string) {
    setSavingCard(true);
    try {
      const res = await fetch(`/api/v1/flashcards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: editFront, back: editBack }),
      });
      if (res.ok) {
        const updated = await res.json();
        onFlashcardsChange(cards.map(c => c.id === cardId ? updated : c));
        setEditingCardId(null);
        toast.success("Card updated");
      }
    } finally { setSavingCard(false); }
  }

  async function deleteCard(cardId: string) {
    if (!confirm("Remove this card?")) return;
    const res = await fetch(`/api/v1/flashcards/${cardId}`, { method: "DELETE" });
    if (res.ok) {
      onFlashcardsChange(cards.filter(c => c.id !== cardId));
      toast.success("Card removed");
    }
  }

  async function addCard() {
    if (!addFront.trim() || !addBack.trim()) return;
    setAddingCard(true);
    try {
      const res = await fetch(`/api/v1/lectures/${lecture.id}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: addFront, back: addBack }),
      });
      if (res.ok) {
        const card = await res.json();
        onFlashcardsChange([...cards, card]);
        setAddFront(""); setAddBack("");
        toast.success("New card added");
      }
    } finally { setAddingCard(false); }
  }

  async function saveLectureMeta() {
    if (!editTitle.trim()) return toast.error("Title is required");
    setSavingLecture(true);
    try {
      const res = await fetch(`/api/v1/lectures/${lecture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), videoUrl: editVideo.trim() || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        onLecturePatch({ title: updated.title, videoUrl: updated.videoUrl });
        toast.success("Lecture metrics updated");
      }
    } finally { setSavingLecture(false); }
  }

  async function uploadLectureFile(file: File) {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/v1/lectures/${lecture.id}/files`, { method: "POST", body: formData });
      if (res.ok) {
        const created = await res.json();
        onLecturePatch({ files: [...files, created] });
        toast.success("Attachment linked");
      }
    } finally { setUploadingFile(false); }
  }

  async function renameFile(fileId: string, name: string) {
    if (!name.trim()) return;
    setRenamingFileId(fileId);
    try {
      const res = await fetch(`/api/v1/lectures/${lecture.id}/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onLecturePatch({ files: files.map((f) => (f.id === fileId ? updated : f)) });
        toast.success("File renamed");
      }
    } finally { setRenamingFileId(null); }
  }

  async function deleteFile(fileId: string) {
    if (!confirm("Remove this attachment?")) return;
    const res = await fetch(`/api/v1/lectures/${lecture.id}/files/${fileId}`, { method: "DELETE" });
    if (res.ok) {
      onLecturePatch({ files: files.filter((f) => f.id !== fileId) });
      toast.success("Attachment removed");
    }
  }

  return (
    <div className={cn(
      "overflow-hidden rounded-3xl border transition-all duration-300",
      expanded ? "border-[#534AB7]/30 bg-white/[0.02] shadow-lg ring-1 ring-[#534AB7]/10" : "border-white/[0.02] bg-[#110f17] hover:border-white/[0.15]"
    )}>
      <div className="flex cursor-pointer items-center justify-between p-5" onClick={onExpand}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[#534AB7]/10 shadow-inner">
            <BookOpen className="h-6 w-6 text-[#534AB7]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold truncate text-white">{lecture.title}</h3>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
                <Video className={cn("h-3.5 w-3.5", lecture.videoUrl ? "text-[#534AB7]" : "text-white/20")} />
                <span>{lecture.videoUrl ? "Active Media" : "Text Only"}</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-tighter">Session {index + 1}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 text-muted-foreground", expanded && "rotate-180")}>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.02] p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-400">
            {/* Session Config */}
            <div className="rounded-2xl border border-white/[0.02] bg-black/20 p-5 space-y-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Session Configuration</p>
               <div className="grid gap-4 sm:grid-cols-2 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Display Title</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Lecture Title"
                      className="w-full h-12 rounded-xl border border-white/[0.02] bg-black/40 px-4 text-sm text-white focus:ring-[#534AB7]/40 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Video Asset</label>
                    <input
                      value={editVideo}
                      onChange={(e) => setEditVideo(e.target.value)}
                      placeholder="Video Asset URL"
                      className="w-full h-12 rounded-xl border border-white/[0.02] bg-black/40 px-4 text-sm text-white focus:ring-[#534AB7]/40 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={saveLectureMeta}
                    disabled={savingLecture}
                    className="flex items-center gap-2 rounded-xl bg-[#534AB7] px-6 h-12 text-xs font-bold text-white shadow-lg shadow-[#534AB7]/30 hover:-translate-y-0.5 disabled:opacity-60 transition-all uppercase tracking-widest sm:col-span-2"
                  >
                    {savingLecture ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Session Settings
                  </button>
               </div>
            </div>

           {/* Attachments */}
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Learning Handouts
                </h4>
                <label className="flex items-center gap-2 rounded-lg border border-white/[0.02] bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight hover:bg-muted cursor-pointer transition-all">
                  {uploadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {uploadingFile ? "Syncing…" : "Upload File"}
                  <input type="file" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadLectureFile(f);
                    e.target.value = "";
                  }} />
                </label>
              </div>
              
              {files.length === 0 ? (
                <div className="py-4 text-center rounded-xl border border-dashed border-white/[0.05] bg-muted/5">
                  <p className="text-xs text-muted-foreground italic tracking-tight opacity-60">Empty handout bank</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {files.map((file) => (
                    <LectureFileRow
                      key={file.id}
                      file={file}
                      renaming={renamingFileId === file.id}
                      onRename={renameFile}
                      onDelete={deleteFile}
                    />
                  ))}
                </div>
              )}
           </div>

           {/* Flashcards */}
           <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold flex items-center gap-2 text-white">
                  <Layers className="h-4 w-4 text-[#534AB7]" />
                  Flashcard Bank ({cards.length})
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {cards.map(card => {
                    const isEditing = editingCardId === card.id;
                    return (
                        <div key={card.id} className={cn(
                          "group relative rounded-2xl border p-4 transition-all duration-200",
                          isEditing ? "border-[#534AB7]/40 bg-[#534AB7]/5 ring-1 ring-[#534AB7]/10 scale-[1.02]" : "border-white/[0.02] bg-black/40 hover:border-white/[0.15]"
                        )}>
                           {isEditing ? (
                             <div className="space-y-3">
                                <textarea
                                  value={editFront}
                                  onChange={(e) => setEditFront(e.target.value)}
                                  className="w-full bg-transparent p-0 text-xs font-bold border-none focus:ring-0 min-h-[50px]"
                                />
                                <div className="h-px w-full bg-blue-500/20" />
                                <textarea
                                  value={editBack}
                                  onChange={(e) => setEditBack(e.target.value)}
                                  className="w-full bg-transparent p-0 text-xs border-none focus:ring-0 min-h-[50px]"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                   <button onClick={() => setEditingCardId(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
                                   <button onClick={() => saveCard(card.id)} disabled={savingCard} className="h-7 w-7 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm disabled:opacity-50">
                                      {savingCard ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
                                   </button>
                                </div>
                             </div>
                           ) : (
                             <div onClick={() => startEditCard(card)} className="cursor-text group-hover:opacity-80 transition-opacity">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 leading-none opacity-60">Question</p>
                                <p className="text-xs font-bold mb-3 line-clamp-2">{card.front}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 leading-none opacity-60">Fact</p>
                                <p className="text-xs line-clamp-2">{card.back}</p>
                                
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={(e) => { e.stopPropagation(); startEditCard(card); }} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-white/[0.02] text-muted-foreground hover:text-blue-500"><Pencil className="h-3.5 w-3.5" /></button>
                                   <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-white/[0.02] text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                             </div>
                           )}
                        </div>
                    )
                 })}
                 
                 {/* Quick Add Card */}
                 <div className="rounded-2xl border border-dashed border-white/[0.02] bg-muted/5 p-4 space-y-3 flex flex-col justify-center min-h-[140px]">
                    <textarea 
                      placeholder="Type term…" 
                      className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 min-h-[40px] placeholder:font-normal"
                      value={addFront}
                      onChange={(e) => setAddFront(e.target.value)}
                    />
                    <div className="h-px w-full bg-border/40" />
                    <textarea 
                      placeholder="Type definition…" 
                      className="bg-transparent border-none p-0 text-xs focus:ring-0 min-h-[40px]"
                      value={addBack}
                      onChange={(e) => setAddBack(e.target.value)}
                    />
                    <button
                      onClick={addCard}
                      disabled={addingCard || !addFront.trim() || !addBack.trim()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 text-blue-600 h-9 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white disabled:opacity-40"
                    >
                      {addingCard ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Add Card
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function LectureFileRow({ file, renaming, onRename, onDelete }: {
  file: LectureFile; renaming: boolean;
  onRename: (fileId: string, name: string) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
}) {
  const [name, setName] = useState(file.name);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-background/50 px-4 py-2.5 group transition-all hover:border-border hover:shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/5 text-blue-500">
        <FileText className="h-4 w-4" />
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium focus:outline-none"
      />
      <div className="flex items-center gap-1.5 ">
        <a href={file.url} target="_blank" rel="noreferrer" className="flex h-8 items-center px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <ExternalLink className="h-3 w-3 mr-1.5" /> Open
        </a>
        <button
          onClick={() => void onRename(file.id, name)}
          disabled={renaming || name === file.name}
          className="flex h-8 items-center px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
        >
          {renaming ? "Syncing…" : "Rename"}
        </button>
        <button
          onClick={() => void onDelete(file.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}


