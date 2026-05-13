"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Network, Video, FileText, Library } from "lucide-react";
import { ContentTreeTab } from "@/components/admin/academy/ContentTreeTab";
import { LecturesTab } from "@/components/admin/academy/LecturesTab";
import { PastPapersTab } from "@/components/admin/academy/PastPapersTab";
import { MedicalLibraryTab } from "@/components/admin/academy/MedicalLibraryTab";

type AcademyTab = "tree" | "lectures" | "papers" | "library";

export default function AcademyHubPage() {
  const [activeTab, setActiveTab] = useState<AcademyTab>("tree");

  const TABS: { id: AcademyTab; label: string; icon: any }[] = [
    { id: "tree", label: "Curriculum Tree", icon: Network },
    { id: "lectures", label: "Lectures & Videos", icon: Video },
    { id: "papers", label: "Past Papers", icon: FileText },
    { id: "library", label: "Medical Library", icon: Library },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* Premium Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Academy Hub</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Curriculum & Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the academic hierarchy, lecture materials, past papers, and reference library.
          </p>
        </div>
      </div>

      {/* Glassmorphic Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.02] bg-card/50 p-1.5 backdrop-blur-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-300",
              activeTab === id
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "tree" && <ContentTreeTab />}
        {activeTab === "lectures" && <LecturesTab />}
        {activeTab === "papers" && <PastPapersTab />}
        {activeTab === "library" && <MedicalLibraryTab />}
      </div>
    </div>
  );
}
