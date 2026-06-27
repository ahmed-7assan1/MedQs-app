"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Building2, GraduationCap, BookOpen, HelpCircle,
  FileText, ChevronRight,
} from "lucide-react";

const CONTENT_TYPES = [
  { key: "universities", icon: Building2, label: "Universities" },
  { key: "faculties", icon: GraduationCap, label: "Faculties" },
  { key: "lectures", icon: BookOpen, label: "Lectures" },
  { key: "questions", icon: HelpCircle, label: "Questions" },
  { key: "past-papers", icon: FileText, label: "Past Papers" },
];

export default function ContentBrowserPage() {
  const [type, setType] = useState("universities");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type });
      if (search) params.set("search", search);
      const res = await fetch(`/api/v1/admin/platform/content-browser?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data ?? []);
    } catch (err) {
      setError("Failed to load content");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ActiveIcon = CONTENT_TYPES.find((t) => t.key === type)?.icon ?? Building2;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Content Browser</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map((t) => (
          <button key={t.key} onClick={() => { setType(t.key); setSearch(""); }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              type === t.key ? "bg-blue-500/20 text-blue-500" : "bg-card text-muted-foreground hover:bg-muted/40"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-48 rounded-xl border border-white/[0.02] bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500/40" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center text-sm text-red-500">{error}</div>
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No content found</div>
        ) : (
          <div className="divide-y divide-border/40">
            {data.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/20">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                  <ActiveIcon className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name ?? item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.university?.name && `${item.university.name} · `}
                    {item.semester?.name && `${item.semester.name} · `}
                    {item.module?.name && `${item.module.name} · `}
                    {item._count?.users !== undefined && `${item._count.users} users`}
                    {item._count?.questions !== undefined && `${item._count.questions} questions`}
                    {item._count?.videos !== undefined && `${item._count.videos} videos`}
                    {item._count?.attempts !== undefined && `${item._count.attempts} attempts`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item._count?.faculties !== undefined && <span>{item._count.faculties} faculties</span>}
                  {item._count?.posts !== undefined && <span>{item._count.posts} posts</span>}
                  {item._count?.medicalTeams !== undefined && <span>{item._count.medicalTeams} teams</span>}
                  {item._count?.reports !== undefined && item._count.reports > 0 &&
                    <span className="text-red-500">{item._count.reports} reports</span>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
