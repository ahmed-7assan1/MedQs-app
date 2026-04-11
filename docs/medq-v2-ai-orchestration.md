# MedQ V2 AI Orchestration

## Admin AI Workflow

Implementation primitives:

- `src/modules/ai/admin-workflow.ts`
- `src/modules/ai/contracts.ts`

Pipeline stages:

1. `INGEST`
2. `CHUNK`
3. `GENERATE`
4. `REVIEW`
5. `PUBLISH`

Outputs are draft-first and emit `ai.admin.job.completed` event when finalized.

## Student D.Q Workflow

Implementation primitives:

- `src/modules/ai/student-dq.ts`
- `src/modules/ai/contracts.ts`

Context graph includes:

- progress percent
- weak topics
- recent mistakes
- lecture scope

Each interaction emits `ai.student.interaction.logged` for analytics/audit.

## Safety and Observability

- Tenant-scoped context resolution for all prompts.
- Domain event logging for AI actions.
- Provider-level tracing and cost governance to be integrated in phase 2.
