"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { useConfirm } from "@/contexts/ConfirmContext";

type ModuleItem = { id: string; name: string };

export function ModuleInlineManager({
  semesterId,
  initialModules,
}: {
  semesterId: string;
  initialModules: ModuleItem[];
}) {
  const [modules, setModules] = useState(initialModules);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function addModule() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/v1/semesters/${semesterId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setSaving(false);
    if (!res.ok) return toast.error(await apiErrorMessage(res, "Failed to add module"));
    const row = await res.json();
    setModules((prev) => [...prev, row]);
    setNewName("");
    toast.success("Module added");
  }

  async function renameModule(id: string, name: string) {
    const res = await fetch(`/api/v1/modules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Rename failed"));
      return;
    }
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
    toast.success("Module updated");
  }

  const confirm = useConfirm();
  async function removeModule(id: string) {
    const ok = await confirm({
      title: "Delete Module",
      message: "Are you sure you want to delete this module and ALL its content? This action cannot be undone.",
      confirmLabel: "Delete permanently",
      variant: "danger"
    });
    if (!ok) return;
    const res = await fetch(`/api/v1/modules/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Delete failed"));
      return;
    }
    setModules((prev) => prev.filter((m) => m.id !== id));
    toast.success("Module deleted");
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Doctor inline: Modules</p>
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
          placeholder="New module name"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={() => void addModule()}
          disabled={saving || !newName.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {modules.map((m) => (
          <ModuleRow key={m.id} module={m} onRename={renameModule} onDelete={removeModule} />
        ))}
      </div>
        </>
      ) : null}
    </div>
  );
}

function ModuleRow({
  module,
  onRename,
  onDelete,
}: {
  module: ModuleItem;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(module.name);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
      <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded border border-border px-2 py-1 text-sm" />
      <button onClick={() => void onRename(module.id, name.trim())} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">
        <Save className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => void onDelete(module.id)} className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

