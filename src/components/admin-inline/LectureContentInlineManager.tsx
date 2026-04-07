"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Save, Trash2, Upload, Pencil, Video, MessageSquare, Sparkles, LayoutGrid, Brain, Map } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { AdminLectureAIAssistant } from "@/components/admin-inline/AdminLectureAIAssistant";

type Flashcard = { id: string; front: string; back: string };
type LectureFile = { id: string; name: string; url: string; mimeType: string };
type LectureVideo = {
  id: string;
  title: string;
  url: string;
  sharingEnabled: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
};

export function LectureContentInlineManager({
  lectureId,
  initialFlashcards,
  initialFiles,
  initialNotes,
  initialVideos,
}: {
  lectureId: string;
  initialFlashcards: Flashcard[];
  initialFiles: LectureFile[];
  initialNotes: string;
  initialVideos: LectureVideo[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [cards, setCards] = useState(initialFlashcards);
  const [videos, setVideos] = useState(initialVideos);
  const [notes, setNotes] = useState(initialNotes);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [sectionOpen, setSectionOpen] = useState<null | "notes" | "files" | "flashcards" | "videos" | "extras">(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [extrasBusy, setExtrasBusy] = useState(false);
  const [extrasSource, setExtrasSource] = useState("");
  const [extrasFile, setExtrasFile] = useState<File | null>(null);
  const [extrasDraft, setExtrasDraft] = useState<any | null>(null);
  const [extrasUiTabs, setExtrasUiTabs] = useState<{ mindmaps: boolean; cases: boolean; mnemonics: boolean }>({
    mindmaps: true,
    cases: true,
    mnemonics: true,
  });
  const [wantOverviewCards, setWantOverviewCards] = useState(true);
  const [wantMnemonics, setWantMnemonics] = useState(true);
  const [wantCases, setWantCases] = useState(true);
  const [wantMindMaps, setWantMindMaps] = useState(false);

  async function addCard() {
    if (!front.trim() || !back.trim()) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/flashcards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front: front.trim(), back: back.trim() }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Failed to add flashcard"));
      return;
    }
    const row = await res.json();
    setCards((prev) => [...prev, row]);
    setFront("");
    setBack("");
    toast.success("Flashcard added");
  }

  async function deleteCard(id: string) {
    const res = await fetch(`/api/v1/flashcards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Delete failed"));
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast.success("Flashcard deleted");
  }

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/v1/lectures/${lectureId}/files`, { method: "POST", body: form });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Upload failed"));
      return;
    }
    const row = await res.json();
    setFiles((prev) => [...prev, row]);
    toast.success("File uploaded");
  }

  async function renameFile(id: string, name: string) {
    const res = await fetch(`/api/v1/lectures/${lectureId}/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Rename failed"));
      return;
    }
    const row = await res.json();
    setFiles((prev) => prev.map((f) => (f.id === id ? row : f)));
    toast.success("File renamed");
  }

  async function deleteFile(id: string) {
    const res = await fetch(`/api/v1/lectures/${lectureId}/files/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Delete failed"));
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success("File deleted");
  }

  async function saveNotes() {
    const res = await fetch(`/api/v1/lectures/${lectureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notesMarkdown: notes }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Failed to save notes"));
      return;
    }
    toast.success("Notes updated");
  }

  async function generateExtras() {
    if (!confirm("Generate interactive extras with AI and save to this lecture?")) return;
    setExtrasBusy(true);
    try {
      const useFile = Boolean(extrasFile);
      const src = (extrasSource || notes || "").trim();
      if (!useFile && !src) {
        toast.error("Upload a file, or add notes / paste source text first");
        return;
      }

      const res = useFile
        ? await (async () => {
            const fd = new FormData();
            fd.append("lectureId", lectureId);
            fd.append("file", extrasFile!);
            if (wantOverviewCards) fd.append("overviewCards", "1");
            if (wantMnemonics) fd.append("mnemonics", "1");
            if (wantCases) fd.append("cases", "1");
            if (wantMindMaps) fd.append("mindMaps", "1");
            fd.append("dryRun", "1");
            return fetch("/api/v1/admin/ai/lecture-extras-from-file", { method: "POST", body: fd });
          })()
        : await fetch("/api/v1/admin/ai/lecture-extras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lectureId,
              sourceText: src,
              overviewCards: wantOverviewCards,
              mnemonics: wantMnemonics,
              cases: wantCases,
              mindMaps: wantMindMaps,
              dryRun: true,
            }),
          });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res, "AI generation failed"));
        return;
      }
      const j = await res.json().catch(() => ({}));
      setExtrasDraft(j?.draft ?? null);
      toast.success("AI draft ready — review before saving");
    } finally {
      setExtrasBusy(false);
    }
  }

  async function applyExtrasDraft() {
    if (!extrasDraft) return;
    if (!confirm("Save this AI draft to the lecture extras?")) return;
    setExtrasBusy(true);
    try {
      const useFile = Boolean(extrasFile);
      const src = (extrasSource || notes || "").trim();
      const res = useFile
        ? await (async () => {
            const fd = new FormData();
            fd.append("lectureId", lectureId);
            fd.append("file", extrasFile!);
            if (wantOverviewCards) fd.append("overviewCards", "1");
            if (wantMnemonics) fd.append("mnemonics", "1");
            if (wantCases) fd.append("cases", "1");
            if (wantMindMaps) fd.append("mindMaps", "1");
            return fetch("/api/v1/admin/ai/lecture-extras-from-file", { method: "POST", body: fd });
          })()
        : await fetch("/api/v1/admin/ai/lecture-extras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lectureId,
              sourceText: src,
              overviewCards: wantOverviewCards,
              mnemonics: wantMnemonics,
              cases: wantCases,
              mindMaps: wantMindMaps,
              dryRun: false,
            }),
          });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res, "Failed to save extras"));
        return;
      }
      const j = await res.json().catch(() => ({}));
      toast.success(
        `Saved: ${Number(j.overviewCards ?? 0)} cards · ${Number(j.mnemonics ?? 0)} mnemonics · ${Number(
          j.cases ?? 0
        )} cases${j.mindMaps ? " · mind map" : ""}`
      );
      setExtrasDraft(null);
      setExtrasFile(null);
    } finally {
      setExtrasBusy(false);
    }
  }

  async function saveExtrasVisibility(next: { mindmaps: boolean; cases: boolean; mnemonics: boolean }) {
    setExtrasUiTabs(next);
    const res = await fetch(`/api/v1/lectures/${lectureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uiConfig: {
          tabs: {
            mindmaps: next.mindmaps,
            cases: next.cases,
            mnemonics: next.mnemonics,
          },
        },
      }),
    });
    if (!res.ok) toast.error(await apiErrorMessage(res, "Failed to update visibility"));
    else toast.success("Visibility updated");
  }

  async function deleteExtrasKeys(keys: string[]) {
    if (!confirm("Delete this content from the lecture?")) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extrasDeleteKeys: keys }),
    });
    if (!res.ok) toast.error(await apiErrorMessage(res, "Delete failed"));
    else toast.success("Deleted");
  }

  async function addVideo() {
    if (!videoTitle.trim() || !videoUrl.trim()) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: videoTitle.trim(), url: videoUrl.trim() }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Failed to add video"));
      return;
    }
    const row = await res.json();
    setVideos((prev) => [...prev, row]);
    setVideoTitle("");
    setVideoUrl("");
    toast.success("Video added");
  }

  async function patchVideo(id: string, patch: Partial<LectureVideo>) {
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Video update failed"));
      return;
    }
    const row = await res.json();
    setVideos((prev) => prev.map((v) => (v.id === id ? row : v)));
    toast.success("Video updated");
  }

  async function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Delete failed"));
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success("Video deleted");
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Doctor inline: Lecture content</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setSectionOpen(sectionOpen === "notes" ? null : "notes")} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          <Pencil className="h-3.5 w-3.5" /> Edit notes
        </button>
        <button onClick={() => setSectionOpen(sectionOpen === "videos" ? null : "videos")} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          <Video className="h-3.5 w-3.5" /> Edit videos
        </button>
        <button onClick={() => setSectionOpen(sectionOpen === "files" ? null : "files")} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          <Upload className="h-3.5 w-3.5" /> Edit files
        </button>
        <button onClick={() => setSectionOpen(sectionOpen === "flashcards" ? null : "flashcards")} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          <MessageSquare className="h-3.5 w-3.5" /> Edit flashcards
        </button>
        <Link href={`/admin/questions`} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          Manage questions
        </Link>
      </div>

      {/* Unified AI area */}
      <div className="mb-4 rounded-lg border border-border bg-background p-3">
        <button
          type="button"
          onClick={() => setSectionOpen(sectionOpen === "extras" ? null : "extras")}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-left text-xs font-semibold hover:bg-muted"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI assistant (notes, cards, questions, extras)
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">{sectionOpen === "extras" ? "Hide" : "Show"}</span>
        </button>

        {sectionOpen === "extras" ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <AdminLectureAIAssistant lectureId={lectureId} />
            </div>

            <p className="text-xs text-muted-foreground">
              These appear as optional tabs on the lecture page. Upload a file (recommended) or use your lecture notes / pasted source.
            </p>
            <label className="inline-flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted">
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                {extrasFile ? extrasFile.name : "Upload PDF/DOCX/TXT/MD for extras"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  setExtrasFile(f);
                }}
              />
            </label>
            <textarea
              value={extrasSource}
              onChange={(e) => setExtrasSource(e.target.value)}
              rows={5}
              placeholder="Optional: paste source text for AI (leave empty to use lecture notes)..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <input type="checkbox" checked={wantOverviewCards} onChange={(e) => setWantOverviewCards(e.target.checked)} />
                <LayoutGrid className="h-4 w-4 text-primary" /> Overview cards
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <input type="checkbox" checked={wantMnemonics} onChange={(e) => setWantMnemonics(e.target.checked)} />
                <Brain className="h-4 w-4 text-primary" /> Mnemonics
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <input type="checkbox" checked={wantCases} onChange={(e) => setWantCases(e.target.checked)} />
                <MessageSquare className="h-4 w-4 text-primary" /> Clinical cases
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <input type="checkbox" checked={wantMindMaps} onChange={(e) => setWantMindMaps(e.target.checked)} />
                <Map className="h-4 w-4 text-primary" /> Mind maps (markdown)
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void generateExtras()}
                disabled={extrasBusy || (!wantOverviewCards && !wantMnemonics && !wantCases && !wantMindMaps)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {extrasBusy ? "Generating..." : "Generate draft"}
              </button>
            </div>

            {extrasDraft ? (
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-xs font-semibold">Overview cards</p>
                    <p className="text-[11px] text-muted-foreground">{Array.isArray(extrasDraft.overviewCards) ? extrasDraft.overviewCards.length : 0} cards</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-xs font-semibold">Mnemonics</p>
                    <p className="text-[11px] text-muted-foreground">{Array.isArray(extrasDraft.mnemonics) ? extrasDraft.mnemonics.length : 0} items</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-xs font-semibold">Cases</p>
                    <p className="text-[11px] text-muted-foreground">{Array.isArray(extrasDraft.cases) ? extrasDraft.cases.length : 0} cases</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-xs font-semibold">Mind map</p>
                    <p className="text-[11px] text-muted-foreground">{String(extrasDraft.mindMapsMarkdown ?? "").trim() ? "Included" : "—"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setExtrasDraft(null)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => void applyExtrasDraft()}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    disabled={extrasBusy}
                  >
                    Save to lecture
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student visibility</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={extrasUiTabs.mindmaps}
                    onChange={(e) => void saveExtrasVisibility({ ...extrasUiTabs, mindmaps: e.target.checked })}
                  />
                  Mind maps
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={extrasUiTabs.cases}
                    onChange={(e) => void saveExtrasVisibility({ ...extrasUiTabs, cases: e.target.checked })}
                  />
                  Cases
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={extrasUiTabs.mnemonics}
                    onChange={(e) => void saveExtrasVisibility({ ...extrasUiTabs, mnemonics: e.target.checked })}
                  />
                  Mnemonics
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void deleteExtrasKeys(["mindMapsMarkdown"])}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  Delete mind map
                </button>
                <button
                  type="button"
                  onClick={() => void deleteExtrasKeys(["cases"])}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  Delete cases
                </button>
                <button
                  type="button"
                  onClick={() => void deleteExtrasKeys(["mnemonics"])}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  Delete mnemonics
                </button>
                <button
                  type="button"
                  onClick={() => void deleteExtrasKeys(["overviewCards"])}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  Delete overview cards
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {sectionOpen === "notes" && (
        <div className="mb-4 rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Write lecture notes in markdown..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="mt-2 flex justify-end">
            <button onClick={() => void saveNotes()} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              <Save className="h-3.5 w-3.5" /> Save notes
            </button>
          </div>
        </div>
      )}

      {sectionOpen === "videos" && (
        <div className="mb-4 rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture videos</p>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" className="rounded border border-border px-2 py-1.5 text-sm" />
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL" className="rounded border border-border px-2 py-1.5 text-sm" />
            <button onClick={() => void addVideo()} className="inline-flex items-center justify-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              <Plus className="h-3.5 w-3.5" /> Add video
            </button>
          </div>
          <div className="space-y-2">
            {videos.length === 0 ? (
              <p className="text-xs text-muted-foreground">No videos yet.</p>
            ) : (
              videos.map((v) => (
                <VideoRow key={v.id} video={v} onPatch={patchVideo} onDelete={deleteVideo} />
              ))
            )}
          </div>
        </div>
      )}

      {sectionOpen === "files" && (
        <>
          <div className="mb-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">
              <Upload className="h-3.5 w-3.5" /> Upload file
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void uploadFile(file);
                }}
              />
            </label>
          </div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Files</p>
          <div className="mb-4 space-y-1.5">
            {files.length === 0 ? <p className="text-xs text-muted-foreground">No files.</p> : files.map((f) => <FileRow key={f.id} file={f} onRename={renameFile} onDelete={deleteFile} />)}
          </div>
        </>
      )}

      {sectionOpen === "flashcards" && (
        <>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Flashcard front" className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
            <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="Flashcard back" className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
            <button onClick={() => void addCard()} className="inline-flex items-center justify-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              <Plus className="h-3.5 w-3.5" /> Add card
            </button>
          </div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Flashcards</p>
          <div className="space-y-1.5">
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground">No flashcards.</p>
            ) : (
              cards.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
                  <span className="flex-1 truncate text-xs text-muted-foreground">{c.front}</span>
                  <span className="flex-1 truncate text-xs">{c.back}</span>
                  <button onClick={() => void deleteCard(c.id)} className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FileRow({
  file,
  onRename,
  onDelete,
}: {
  file: LectureFile;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(file.name);
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
      <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded border border-border px-2 py-1 text-xs" />
      <a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
        Open
      </a>
      <button onClick={() => void onRename(file.id, name)} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">
        <Save className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => void onDelete(file.id)} className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function VideoRow({
  video,
  onPatch,
  onDelete,
}: {
  video: LectureVideo;
  onPatch: (id: string, patch: Partial<LectureVideo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(video.title);
  const [url, setUrl] = useState(video.url);
  const [sharingEnabled, setSharingEnabled] = useState(video.sharingEnabled);
  return (
    <div className="rounded border border-border p-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-border px-2 py-1 text-xs" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="rounded border border-border px-2 py-1 text-xs" />
        <button onClick={() => void onPatch(video.id, { title: title.trim(), url: url.trim(), sharingEnabled })} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">
          Save
        </button>
        <button onClick={() => void onDelete(video.id)} className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
          Delete
        </button>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={sharingEnabled}
          onChange={(e) => {
            setSharingEnabled(e.target.checked);
            void onPatch(video.id, { sharingEnabled: e.target.checked });
          }}
        />
        Allow sharing for this video
      </label>
      <p className="mt-1 text-[10px] text-muted-foreground">Likes {video.likesCount} · Comments {video.commentsCount} · Shares {video.sharesCount}</p>
    </div>
  );
}

