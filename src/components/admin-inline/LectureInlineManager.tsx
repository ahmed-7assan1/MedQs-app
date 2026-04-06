"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type LectureItem = { id: string; title: string; videoUrl?: string | null };

export function LectureInlineManager({
  subjectId,
  initialLectures,
}: {
  subjectId: string;
  initialLectures: LectureItem[];
}) {
  const [lectures, setLectures] = useState(initialLectures);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [open, setOpen] = useState(false);

  async function addLecture() {
    if (!title.trim()) return;
    const res = await fetch(`/api/v1/subjects/${subjectId}/lectures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), videoUrl: videoUrl.trim() || undefined }),
    });
    if (!res.ok) return toast.error("Failed to add lecture");
    const row = await res.json();
    setLectures((prev) => [...prev, row]);
    setTitle("");
    setVideoUrl("");
    toast.success("Lecture added");
  }

  async function renameLecture(id: string, nextTitle: string, nextVideoUrl: string) {
    const res = await fetch(`/api/v1/lectures/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle.trim(), videoUrl: nextVideoUrl.trim() || null }),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    const row = await res.json();
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, title: row.title, videoUrl: row.videoUrl } : l)));
    toast.success("Lecture updated");
  }

  async function deleteLecture(id: string) {
    if (!confirm("Delete lecture and all its files/questions/cards?")) return;
    const res = await fetch(`/api/v1/lectures/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    setLectures((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lecture deleted");
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Admin inline: Lectures</p>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-border bg-background px-3 py-1 text-xs hover:bg-muted">
          {open ? "Close" : "Edit"}
        </button>
      </div>
      {open ? (
        <>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL (optional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button onClick={() => void addLecture()} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {lectures.map((l) => (
          <LectureRow key={l.id} lecture={l} onSave={renameLecture} onDelete={deleteLecture} />
        ))}
      </div>
        </>
      ) : null}
    </div>
  );
}

function LectureRow({
  lecture,
  onSave,
  onDelete,
}: {
  lecture: LectureItem;
  onSave: (id: string, title: string, videoUrl: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(lecture.title);
  const [videoUrl, setVideoUrl] = useState(lecture.videoUrl ?? "");
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-border px-2 py-1 text-sm" />
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL" className="rounded border border-border px-2 py-1 text-sm" />
        <button onClick={() => void onSave(lecture.id, title, videoUrl)} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">
          <Save className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => void onDelete(lecture.id)} className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

