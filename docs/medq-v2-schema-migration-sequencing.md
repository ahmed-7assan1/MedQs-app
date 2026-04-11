# MedQ V2 Schema Migration Sequencing

## Strategy

Use additive migrations and dual-write compatibility before any cutover.

## Sequence

1. Add new core tables (`Tenant`, `TenantConfig`, `UserRoleAssignment`, `OutboxEvent`).
2. Add university-template tables (`Faculty`, `Program`, `Curriculum`, `CurriculumLevel`, `Term`) with no destructive links.
3. Add assessment v2 (`QuestionBank`, `Quiz`, `QuizQuestion`, `QuizAttemptAnswer`, snapshots).
4. Add study-space and social v2 entities.
5. Enable dual-write from v1 commands to v2 projections.
6. Enable dual-read in v2 endpoints with fallback to v1.
7. Run backfill jobs per tenant and verify parity.
8. Flip read preference to v2 after parity threshold.
9. Deprecate v1 writes and archive legacy columns/tables.

## Dual-Write Matrix

- Lecture publish: write `Lecture` (v1) + `LectureComponentToggle` (v2).
- Quiz save: write `PastPaper`/`Question` (v1) + `Quiz`/`QuizQuestion` (v2).
- Attempt submit: write `QuizAttempt` (v1) + `QuizAttempt`/`QuizAttemptAnswer` (v2).
- Forum post: write `Post` (v1) + `Community`-scoped `Post` (v2 projection).

## Quality Gates

- Referential integrity checks per tenant schema.
- Cardinality parity report between v1 and v2 entities.
- Sampling verification for correctness of question options and scoring.
- Blocking alerts on dual-write failures.
