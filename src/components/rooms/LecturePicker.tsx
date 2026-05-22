"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, MagnifyingGlass, Check } from "@phosphor-icons/react";

interface Lecture {
  id: string;
  title: string;
  type: string;
  subject: {
    id: string;
    name: string;
    module: { id: string; name: string } | null;
  };
}

interface Props {
  roomId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (lectureId: string, lectureTitle: string) => void;
  selectedId?: string | null;
}

export default function LecturePicker({ roomId, open, onClose, onSelect, selectedId }: Props) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/v1/rooms/${roomId}/lectures`)
      .then((r) => r.json())
      .then((data) => {
        setLectures(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId, open]);

  if (!open) return null;

  const filtered = lectures.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Lecture[]> = {};
  for (const l of filtered) {
    const moduleName = l.subject.module?.name ?? "General";
    if (!grouped[moduleName]) grouped[moduleName] = [];
    grouped[moduleName].push(l);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-bold">Choose a Lecture</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No lectures found</p>
          ) : (
            Object.entries(grouped).map(([moduleName, modLectures]) => (
              <div key={moduleName}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{moduleName}</p>
                <div className="space-y-1">
                  {modLectures.map((l) => {
                    const isSelected = l.id === selectedId;
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          onSelect(l.id, l.title);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                          <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{l.title}</p>
                          <p className="text-xs text-gray-500 truncate">{l.subject.name}</p>
                        </div>
                        {isSelected && <Check size={18} weight="bold" className="text-blue-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
