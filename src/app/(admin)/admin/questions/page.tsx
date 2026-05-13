"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, Layers, Copy } from "lucide-react";
import { QuestionsBankTab } from "@/components/admin/questions/QuestionsBankTab";
import { QuizCreatorTab } from "@/components/admin/questions/QuizCreatorTab";
import { DuplicatesTab } from "@/components/admin/questions/DuplicatesTab";

type AssessmentTab = "bank" | "creator" | "duplicates";

export default function UnifiedAssessmentPage() {
  const [activeTab, setActiveTab] = useState<AssessmentTab>("bank");

  const TABS: { id: AssessmentTab; label: string; icon: any }[] = [
    { id: "bank", label: "Question Bank", icon: HelpCircle },
    { id: "creator", label: "Quiz Creator", icon: Layers },
    { id: "duplicates", label: "Duplicates Audit", icon: Copy },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* Premium Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Assessment Hub</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Evaluation & Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the central question bank, create quizzes, and resolve duplicate entries.
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
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
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
        {activeTab === "bank" && <QuestionsBankTab />}
        {activeTab === "creator" && <QuizCreatorTab />}
        {activeTab === "duplicates" && <DuplicatesTab />}
      </div>
    </div>
  );
}
