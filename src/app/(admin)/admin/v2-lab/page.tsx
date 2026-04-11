"use client";

import { useMemo, useState } from "react";

type StepState = {
  flagEnabled?: boolean;
  subjectId?: string;
  lectureId?: string;
  quizId?: string;
  questionId?: string;
  attemptId?: string;
  lastResponse?: any;
  error?: string;
};

async function callJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? json?.errors?.[0] ?? `HTTP ${res.status}`);
  return json;
}

export default function V2LabPage() {
  const [moduleId, setModuleId] = useState("");
  const [quizTitle, setQuizTitle] = useState("V2 Quiz");
  const [state, setState] = useState<StepState>({});

  const pretty = useMemo(() => JSON.stringify(state.lastResponse ?? null, null, 2), [state.lastResponse]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">V2 Lab (Org + Content + Assessment)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Minimal test harness to validate: create subject → create lecture → attach quiz → add question → submit attempt.
      </p>

      <div className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Module ID</span>
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            placeholder="UUID of module"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Quiz title</span>
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          onClick={async () => {
            try {
              const res = await callJson("/api/v2/admin/feature-flags", {
                method: "PUT",
                body: JSON.stringify({ key: "v2_org_content_assessment", enabled: true, scope: "university" }),
              });
              setState((s) => ({ ...s, flagEnabled: true, lastResponse: res, error: undefined }));
            } catch (e: any) {
              setState((s) => ({ ...s, error: e?.message ?? String(e) }));
            }
          }}
        >
          Enable V2 Flag
        </button>

        <button
          className="btn btn-secondary"
          onClick={async () => {
            try {
              const res = await callJson("/api/v2/org/subjects", {
                method: "POST",
                body: JSON.stringify({ moduleId, name: "V2 Lab Subject" }),
              });
              setState((s) => ({ ...s, subjectId: res.result?.id ?? res.id, lastResponse: res, error: undefined }));
            } catch (e: any) {
              setState((s) => ({ ...s, error: e?.message ?? String(e) }));
            }
          }}
        >
          Create Subject
        </button>

        <button
          className="btn btn-secondary"
          disabled={!state.subjectId}
          onClick={async () => {
            try {
              const res = await callJson("/api/v2/content/lectures", {
                method: "POST",
                body: JSON.stringify({ subjectId: state.subjectId, title: "V2 Lab Lecture", order: 0 }),
              });
              setState((s) => ({ ...s, lectureId: res.result?.id ?? res.id, lastResponse: res, error: undefined }));
            } catch (e: any) {
              setState((s) => ({ ...s, error: e?.message ?? String(e) }));
            }
          }}
        >
          Create Lecture
        </button>

        <button
          className="btn btn-secondary"
          disabled={!state.lectureId}
          onClick={async () => {
            try {
              const res = await callJson("/api/v2/assessment/quizzes", {
                method: "POST",
                body: JSON.stringify({ lectureId: state.lectureId, title: quizTitle, timeLimitMin: 5 }),
              });
              setState((s) => ({ ...s, quizId: res.result?.id ?? res.id, lastResponse: res, error: undefined }));
            } catch (e: any) {
              setState((s) => ({ ...s, error: e?.message ?? String(e) }));
            }
          }}
        >
          Attach Quiz
        </button>

        <button
          className="btn btn-secondary"
          disabled={!state.quizId}
          onClick={async () => {
            try {
              const res = await callJson(`/api/v2/assessment/quizzes/${state.quizId}/questions`, {
                method: "POST",
                body: JSON.stringify({
                  body: "V2 lab question?",
                  choices: [
                    { key: "A", text: "Option A" },
                    { key: "B", text: "Option B" },
                    { key: "C", text: "Option C" },
                  ],
                  answer: "B",
                  difficulty: "MEDIUM",
                  explanation: "Because it is a lab question.",
                }),
              });
              setState((s) => ({ ...s, questionId: res.result?.questionId, lastResponse: res, error: undefined }));
            } catch (e: any) {
              setState((s) => ({ ...s, error: e?.message ?? String(e) }));
            }
          }}
        >
          Add Question
        </button>

        <button
          className="btn btn-secondary"
          disabled={!state.quizId || !state.questionId}
          onClick={async () => {
            try {
              const res = await callJson(`/api/v2/assessment/quizzes/${state.quizId}/attempt`, {
                method: "POST",
                body: JSON.stringify({
                  answers: { [state.questionId!]: "B" },
                  timeTaken: 42,
                  focusLossCount: 0,
                }),
              });
              setState((s) => ({ ...s, attemptId: res.result?.attemptId, lastResponse: res, error: undefined }));
            } catch (e: any) {
              setState((s) => ({ ...s, error: e?.message ?? String(e) }));
            }
          }}
        >
          Submit Attempt
        </button>
      </div>

      {state.error ? (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Last response</p>
        <pre className="mt-2 overflow-auto rounded-lg bg-background p-3 text-xs">{pretty}</pre>
      </div>
    </div>
  );
}
