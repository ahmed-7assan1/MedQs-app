"use client";

import { useState, useMemo } from "react";
import FilterPills from "./FilterPills";
import ModulesGrid, { ModuleWithStats } from "./ModulesGrid";

interface SemesterGroup {
  semesterId: string;
  name: string;
  yearNumber: number;
  modules: ModuleWithStats[];
}

interface ModuleSectionProps {
  inProgress: ModuleWithStats[];
  completed: ModuleWithStats[];
  semesterGroups: SemesterGroup[];
  isGuest: boolean;
  isAdmin: boolean;
}

type FilterValue =
  | "All Modules"
  | "In Progress"
  | "Completed"
  | "Basic Sciences"
  | "Clinical Sciences"
  | "Electives";

export default function ModuleSection({
  inProgress,
  completed,
  semesterGroups,
  isGuest,
  isAdmin,
}: ModuleSectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All Modules");

  const content = useMemo(() => {
    switch (activeFilter) {
      case "In Progress":
        return inProgress.length > 0 ? (
          <ModulesGrid modules={inProgress} isGuest={isGuest} isAdmin={isAdmin} />
        ) : (
          <p className="text-sm text-muted-foreground">No modules in progress.</p>
        );
      case "Completed":
        return completed.length > 0 ? (
          <ModulesGrid modules={completed} isGuest={isGuest} isAdmin={isAdmin} />
        ) : (
          <p className="text-sm text-muted-foreground">No completed modules yet.</p>
        );
      default:
        return semesterGroups.map((sg) => (
          <div key={sg.semesterId} className="mb-8">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Year {sg.yearNumber} — {sg.name}
            </h3>
            <ModulesGrid modules={sg.modules} isGuest={isGuest} isAdmin={isAdmin} />
          </div>
        ));
    }
  }, [activeFilter, inProgress, completed, semesterGroups, isGuest, isAdmin]);

  return (
    <>
      <div className="mt-8">
        <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>
      <section className="mt-6">{content}</section>
    </>
  );
}
