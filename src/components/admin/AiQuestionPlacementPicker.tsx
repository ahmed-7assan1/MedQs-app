"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

type SemesterRef = { id: string; name: string };

export type ModuleWithSemester = {
  id: string;
  name: string;
  semesterId: string;
  semester?: SemesterRef | null;
};

type SubjectOpt = { id: string; name: string; moduleId: string };
type LectureOpt = { id: string; title: string; subjectId: string; order: number };

type TargetMode = "lecture" | "subject_full";

type Props = {
  onChange: (lectureId: string) => void;
  disabled?: boolean;
  /** Unique name for radio inputs when multiple pickers mount on one page */
  radioGroupName?: string;
};

export function AiQuestionPlacementPicker({
  onChange,
  disabled,
  radioGroupName = "ai-question-placement",
}: Props) {
  const [modules, setModules] = useState<ModuleWithSemester[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);
  const [lectures, setLectures] = useState<LectureOpt[]>([]);

  const [moduleId, setModuleId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [targetMode, setTargetMode] = useState<TargetMode>("lecture");
  const [pickLectureId, setPickLectureId] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingLectures, setLoadingLectures] = useState(false);
  const [ensuringFullQuiz, setEnsuringFullQuiz] = useState(false);

  const lastEmitted = useRef<string>("");

  useEffect(() => {
    fetch("/api/v1/modules-all")
      .then((r) => r.json())
      .then((data) => setModules(unwrapApiList(data)))
      .catch(() => setModules([]));
  }, []);

  useEffect(() => {
    if (!moduleId) {
      setSubjects([]);
      setSubjectId("");
      return;
    }
    setLoadingSubjects(true);
    fetch(`/api/v1/modules/${moduleId}/subjects`)
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }, [moduleId]);

  useEffect(() => {
    if (!subjectId) {
      setLectures([]);
      setPickLectureId("");
      return;
    }
    setLoadingLectures(true);
    fetch(`/api/v1/subjects/${subjectId}/lectures`)
      .then((r) => r.json())
      .then((data) => setLectures(Array.isArray(data) ? data : []))
      .catch(() => setLectures([]))
      .finally(() => setLoadingLectures(false));
  }, [subjectId]);

  // Emit lecture id for "specific lecture" mode
  useEffect(() => {
    if (disabled) return;
    if (targetMode !== "lecture") return;
    if (!pickLectureId) {
      if (lastEmitted.current !== "") {
        lastEmitted.current = "";
        onChange("");
      }
      return;
    }
    if (lastEmitted.current !== pickLectureId) {
      lastEmitted.current = pickLectureId;
      onChange(pickLectureId);
    }
  }, [targetMode, pickLectureId, onChange, disabled]);

  // Ensure full-subject quiz lecture and emit its id
  useEffect(() => {
    if (disabled) return;
    if (targetMode !== "subject_full") return;
    if (!subjectId) {
      if (lastEmitted.current !== "") {
        lastEmitted.current = "";
        onChange("");
      }
      return;
    }

    let cancelled = false;
    setEnsuringFullQuiz(true);
    fetch(`/api/v1/subjects/${subjectId}/full-quiz-lecture`, { method: "POST" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
        return data.lecture as { id: string };
      })
      .then((lec) => {
        if (cancelled || !lec?.id) return;
        if (lastEmitted.current !== lec.id) {
          lastEmitted.current = lec.id;
          onChange(lec.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          lastEmitted.current = "";
          onChange("");
        }
      })
      .finally(() => {
        if (!cancelled) setEnsuringFullQuiz(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetMode, subjectId, onChange, disabled]);

  function onModuleChange(id: string) {
    setModuleId(id);
    setSubjectId("");
    setPickLectureId("");
    setLectures([]);
    lastEmitted.current = "";
    onChange("");
  }

  function onSubjectChange(id: string) {
    setSubjectId(id);
    setPickLectureId("");
    lastEmitted.current = "";
    onChange("");
  }

  function onTargetModeChange(mode: TargetMode) {
    setTargetMode(mode);
    setPickLectureId("");
    lastEmitted.current = "";
    onChange("");
  }

  const moduleLabel = (m: ModuleWithSemester) => {
    if (m.semester?.name && m.semester?.id) {
      return `${m.name} · ${m.semester.name} — semester ${m.semester.id}`;
    }
    if (m.semesterId) return `${m.name} — semester ${m.semesterId}`;
    return m.name;
  };

  const busy = disabled || loadingSubjects || loadingLectures || (targetMode === "subject_full" && ensuringFullQuiz);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Where to save (module → subject → lecture)
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Module</label>
          <MedqsSelect
            value={moduleId}
            disabled={disabled}
            onChange={(e) => onModuleChange(e.target.value)}
            className="w-full"
          >
            <option value="">Select module</option>
            {modules.map((m) => {
              const label = moduleLabel(m);
              return (
                <option key={m.id} value={m.id} title={label}>
                  {label}
                </option>
              );
            })}
          </MedqsSelect>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject (المادة)</label>
          <MedqsSelect
            value={subjectId}
            disabled={disabled || !moduleId || loadingSubjects}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full"
          >
            <option value="">{loadingSubjects ? "Loading…" : "Select subject"}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </MedqsSelect>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Attach questions to</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioGroupName}
              checked={targetMode === "lecture"}
              disabled={disabled || !subjectId}
              onChange={() => onTargetModeChange("lecture")}
              className="rounded-full border-border"
            />
            <span>Specific lecture</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioGroupName}
              checked={targetMode === "subject_full"}
              disabled={disabled || !subjectId}
              onChange={() => onTargetModeChange("subject_full")}
              className="rounded-full border-border"
            />
            <span>Full subject quiz (كويز كامل للمادة)</span>
          </label>
        </div>
      </div>

      {targetMode === "lecture" && subjectId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Lecture</label>
          <MedqsSelect
            value={pickLectureId}
            disabled={disabled || loadingLectures}
            onChange={(e) => setPickLectureId(e.target.value)}
            className="w-full"
          >
            <option value="">{loadingLectures ? "Loading…" : "Select lecture"}</option>
            {lectures.map((lec) => (
              <option key={lec.id} value={lec.id}>
                {lec.title}
              </option>
            ))}
          </MedqsSelect>
        </div>
      )}

      {targetMode === "subject_full" && subjectId && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Uses a dedicated lecture titled <span className="font-medium text-foreground">Full subject quiz | كويز كامل للمادة</span> under
          this subject (created automatically if it does not exist). Students see it like any other lecture in the subject.
        </p>
      )}

      {busy && targetMode === "subject_full" && subjectId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Preparing subject quiz slot…
        </div>
      )}

    </div>
  );
}
