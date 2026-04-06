"use client";
import { useState, useEffect } from "react";
import {
  Plus, Video, Layers, Trash2, Save, Loader2,
  BookOpen, ChevronDown, ChevronUp, Pencil, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Module   { id: string; name: string }
interface Subject  { id: string; name: string; moduleId: string }
interface Flashcard { id: string; front: string; back: string }
interface LectureFile { id: string; name: string; url: string; mimeType: string }
interface Lecture  {
  id: string; title: string; videoUrl?: string; subjectId: string; order: number;
  flashcards?: Flashcard[];
  files?: LectureFile[];
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
  const [newCards, setNewCards] = useState([{ front: "", back: "" }]);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/modules-all").then(r => r.json()),
      fetch("/api/v1/subjects-all").then(r => r.json()),
    ]).then(([m, s]) => { setModules(m); setSubjects(s); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    fetch(`/api/v1/subjects/${selectedSubject}/lectures`)
      .then(r => r.json())
      .then(setLectures);
  }, [selectedSubject]);

  const filteredSubjects = subjects.filter(s => s.moduleId === selectedModule);

  // Load flashcards for a lecture when expanded
  async function expandLecture(lecId: string) {
    if (expanded === lecId) { setExpanded(null); return; }
    setExpanded(lecId);
    // Fetch full lecture with flashcards if not already loaded
    const existing = lectures.find(l => l.id === lecId);
    if (existing?.flashcards) return;
    const res = await fetch(`/api/v1/lectures/${lecId}`);
    const data = await res.json();
    setLectures(prev =>
      prev.map(l =>
        l.id === lecId
          ? { ...l, flashcards: data.flashcards ?? [], files: data.files ?? [], title: data.title ?? l.title, videoUrl: data.videoUrl ?? l.videoUrl }
          : l
      )
    );
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
          flashcards: newCards.filter(c => c.front.trim() && c.back.trim()),
        }),
      });
      if (res.ok) {
        const lec = await res.json();
        setLectures(prev => [...prev, lec]);
        toast.success("Lecture created!");
        setTitle(""); setVideoUrl(""); setNewCards([{ front: "", back: "" }]);
        setShowForm(false);
      } else { toast.error("Failed to create"); }
    } finally { setSaving(false); }
  }

  async function deleteLecture(id: string) {
    if (!confirm("Delete this lecture? All flashcards and questions inside will be lost.")) return;
    const res = await fetch(`/api/v1/lectures/${id}`, { method: "DELETE" });
    if (res.ok) { setLectures(prev => prev.filter(l => l.id !== id)); toast.success("Deleted"); }
    else toast.error("Failed to delete");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Lectures</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage lecture content and flashcards</p>
      </div>

      {/* Filter */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Module</label>
          <select value={selectedModule} onChange={e => { setSelectedModule(e.target.value); setSelectedSubject(""); setLectures([]); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select module...</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedModule}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
            <option value="">Select subject...</option>
            {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {selectedSubject && (
        <button onClick={() => setShowForm(p => !p)}
          className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Lecture"}
        </button>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in">
          <h2 className="font-semibold">New Lecture</h2>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Shoulder Joint"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" /> Video URL (optional)
            </label>
            <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/embed/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Flashcards for new lecture */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Flashcards</label>
              <button onClick={() => setNewCards(c => [...c, { front: "", back: "" }])}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors">
                <Plus className="h-3 w-3" /> Add card
              </button>
            </div>
            <div className="space-y-2">
              {newCards.map((card, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={card.front} onChange={e => setNewCards(c => c.map((x, j) => j === i ? { ...x, front: e.target.value } : x))}
                    placeholder="Front (question)"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input type="text" value={card.back} onChange={e => setNewCards(c => c.map((x, j) => j === i ? { ...x, back: e.target.value } : x))}
                    placeholder="Back (answer)"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={() => setNewCards(c => c.filter((_, j) => j !== i))}
                    className="rounded-lg p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={createLecture} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Lecture"}
            </button>
          </div>
        </div>
      )}

      {/* Lectures list */}
      {lectures.length === 0 && selectedSubject && !showForm ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-12 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium">No lectures yet</p>
          <p className="text-xs text-muted-foreground">Click "Add Lecture" to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lectures.map((lec, i) => (
            <LectureRow
              key={lec.id}
              lecture={lec}
              index={i}
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

// ─── LectureRow with inline flashcard CRUD ────────────────────────────────────

function LectureRow({ lecture, index, expanded, onExpand, onDelete, onFlashcardsChange, onLecturePatch }: {
  lecture: Lecture; index: number; expanded: boolean;
  onExpand: () => void; onDelete: () => void;
  onFlashcardsChange: (cards: Flashcard[]) => void;
  onLecturePatch: (patch: Partial<Lecture>) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
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

  function startEdit(card: Flashcard) {
    setEditing(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  async function saveCard(cardId: string) {
    setSavingCard(true);
    const res = await fetch(`/api/v1/flashcards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front: editFront, back: editBack }),
    });
    setSavingCard(false);
    if (res.ok) {
      const updated = await res.json();
      onFlashcardsChange(cards.map(c => c.id === cardId ? updated : c));
      setEditing(null);
      toast.success("Card updated");
    } else toast.error("Failed to update");
  }

  async function deleteCard(cardId: string) {
    if (!confirm("Delete this flashcard?")) return;
    const res = await fetch(`/api/v1/flashcards/${cardId}`, { method: "DELETE" });
    if (res.ok) {
      onFlashcardsChange(cards.filter(c => c.id !== cardId));
      toast.success("Card deleted");
    } else toast.error("Failed to delete");
  }

  async function addCard() {
    if (!addFront.trim() || !addBack.trim()) return;
    setAddingCard(true);
    const res = await fetch(`/api/v1/lectures/${lecture.id}/flashcards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front: addFront, back: addBack }),
    });
    setAddingCard(false);
    if (res.ok) {
      const card = await res.json();
      onFlashcardsChange([...cards, card]);
      setAddFront(""); setAddBack("");
      toast.success("Card added");
    } else toast.error("Failed to add card");
  }

  async function saveLectureMeta() {
    if (!editTitle.trim()) {
      toast.error("Lecture title is required");
      return;
    }
    setSavingLecture(true);
    const res = await fetch(`/api/v1/lectures/${lecture.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim(), videoUrl: editVideo.trim() || null }),
    });
    setSavingLecture(false);
    if (res.ok) {
      const updated = await res.json();
      onLecturePatch({ title: updated.title, videoUrl: updated.videoUrl });
      toast.success("Lecture updated");
    } else {
      toast.error("Failed to update lecture");
    }
  }

  async function uploadLectureFile(file: File) {
    setUploadingFile(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/v1/lectures/${lecture.id}/files`, { method: "POST", body: form });
    setUploadingFile(false);
    if (res.ok) {
      const created = await res.json();
      onLecturePatch({ files: [...files, created] });
      toast.success("File uploaded");
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(typeof err.error === "string" ? err.error : "Upload failed");
    }
  }

  async function renameFile(fileId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("File name is required");
      return;
    }
    setRenamingFileId(fileId);
    const res = await fetch(`/api/v1/lectures/${lecture.id}/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setRenamingFileId(null);
    if (res.ok) {
      const updated = await res.json();
      onLecturePatch({ files: files.map((f) => (f.id === fileId ? updated : f)) });
      toast.success("File renamed");
    } else toast.error("Rename failed");
  }

  async function deleteFile(fileId: string) {
    if (!confirm("Delete this file?")) return;
    const res = await fetch(`/api/v1/lectures/${lecture.id}/files/${fileId}`, { method: "DELETE" });
    if (res.ok) {
      onLecturePatch({ files: files.filter((f) => f.id !== fileId) });
      toast.success("File deleted");
    } else toast.error("Delete failed");
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors" onClick={onExpand}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{lecture.title}</p>
          {lecture.videoUrl && <p className="text-xs text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3" /> Has video</p>}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{cards.length} cards</span>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Flashcards inline editor */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 animate-fade-in">
          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture details</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Lecture title"
                className="rounded border border-border bg-background px-2 py-2 text-sm"
              />
              <input
                value={editVideo}
                onChange={(e) => setEditVideo(e.target.value)}
                placeholder="Video URL (optional)"
                className="rounded border border-border bg-background px-2 py-2 text-sm"
              />
              <button
                onClick={saveLectureMeta}
                disabled={savingLecture}
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {savingLecture ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture files</p>
              <label className="cursor-pointer rounded border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-muted">
                {uploadingFile ? "Uploading..." : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void uploadLectureFile(file);
                  }}
                />
              </label>
            </div>
            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2">
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

          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Flashcards ({cards.length})</span>
          </div>

          <div className="space-y-2">
            {cards.map(card => (
              <div key={card.id} className="rounded-lg border border-border bg-background">
                {editing === card.id ? (
                  <div className="flex gap-2 p-2">
                    <input value={editFront} onChange={e => setEditFront(e.target.value)}
                      className="flex-1 rounded border border-border bg-muted/50 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                    <input value={editBack} onChange={e => setEditBack(e.target.value)}
                      className="flex-1 rounded border border-border bg-muted/50 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                    <button onClick={() => saveCard(card.id)} disabled={savingCard}
                      className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      {savingCard ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => setEditing(null)} className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <p className="text-xs font-medium text-muted-foreground truncate">{card.front}</p>
                      <p className="text-xs truncate">{card.back}</p>
                    </div>
                    <button onClick={() => startEdit(card)} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteCard(card.id)} className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add new card inline */}
            <div className="flex gap-2">
              <input value={addFront} onChange={e => setAddFront(e.target.value)} onKeyDown={e => e.key === "Enter" && addCard()}
                placeholder="New front (question)"
                className="flex-1 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              <input value={addBack} onChange={e => setAddBack(e.target.value)} onKeyDown={e => e.key === "Enter" && addCard()}
                placeholder="Back (answer)"
                className="flex-1 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              <button onClick={addCard} disabled={addingCard || !addFront.trim() || !addBack.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {addingCard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LectureFileRow({
  file,
  renaming,
  onRename,
  onDelete,
}: {
  file: LectureFile;
  renaming: boolean;
  onRename: (fileId: string, name: string) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
}) {
  const [name, setName] = useState(file.name);
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
      />
      <a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
        Open
      </a>
      <button
        onClick={() => void onRename(file.id, name)}
        disabled={renaming}
        className="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-60"
      >
        Save
      </button>
      <button
        onClick={() => void onDelete(file.id)}
        className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Delete
      </button>
    </div>
  );
}
