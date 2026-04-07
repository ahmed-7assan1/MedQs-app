"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";

type SubjectItem = { id: string; name: string };

export function SubjectInlineManager({
  moduleId,
  initialSubjects,
}: {
  moduleId: string;
  initialSubjects: SubjectItem[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  async function addSubject() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/v1/modules/${moduleId}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) return toast.error(await apiErrorMessage(res, "Failed to add subject"));
    const row = await res.json();
    setSubjects((prev) => [...prev, row]);
    setNewName("");
    toast.success("Subject added");
  }

  async function renameSubject(id: string, name: string) {
    const res = await fetch(`/api/v1/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Rename failed"));
      return;
    }
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    toast.success("Subject updated");
  }

  async function deleteSubject(id: string) {
    if (!confirm("Delete this subject and all its lectures/questions?")) return;
    const res = await fetch(`/api/v1/subjects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Delete failed"));
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    toast.success("Subject deleted");
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Doctor inline: Subjects</p>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-border bg-background px-3 py-1 text-xs hover:bg-muted">
          {open ? "Close" : "Edit"}
        </button>
      </div>
      {open ? (
        <>
      <div className="mb-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New subject name"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button onClick={() => void addSubject()} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {subjects.map((s) => (
          <SubjectRow key={s.id} subject={s} onRename={renameSubject} onDelete={deleteSubject} />
        ))}
      </div>
        </>
      ) : null}
    </div>
  );
}

function SubjectRow({
  subject,
  onRename,
  onDelete,
}: {
  subject: SubjectItem;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(subject.name);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
      <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded border border-border px-2 py-1 text-sm" />
      <button onClick={() => void onRename(subject.id, name.trim())} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">
        <Save className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => void onDelete(subject.id)} className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

