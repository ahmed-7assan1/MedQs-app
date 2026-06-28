# Missing Schema Entities Report

These six models are referenced in application code but **not defined** in any `schema.prisma` file. They likely correspond to abandoned features, tables added outside Prisma migrations, or intentional database views.

## Model: `youtubeUploadTask`
**Status:** Feature appears to be abandoned (YouTube sync). The schema model was likely dropped but the API routes remain.

**Files:** (6 files, 15 references)
- `src/app/api/v1/admin/ai/architect/route.ts`
- `src/app/api/v1/admin/colab/jobs/route.ts`
- `src/app/api/v1/admin/colab/jobs/[id]/route.ts`
- `src/app/api/admin/youtube-sync/route.ts`
- `src/app/api/admin/youtube-sync/auto-queue/route.ts`
- `src/app/api/admin/youtube-sync/[id]/route.ts`

**Recommendation:** Either restore the model in schema, or remove the dead route files.

---

## Model: `libraryResource`
**Status:** Active feature (mobile library). Some files use `(prisma as any).libraryResource` to bypass TS errors, others use direct `prisma.libraryResource`.

**Files:** (2 files, 3 references)
- `src/app/api/mobile/library-resources/route.ts`
- `src/app/api/v1/admin/library/route.ts`

**Recommendation:** Add model to schema or convert all uses to `(prisma as any)` with a type guard.

---

## Model: `sourceBook`
**Status:** Active feature (book analysis tools). Files consistently use `(prisma as any).sourceBook` to bypass.

**Files:** (5 files, 10 references across `.ts` + `.tsx`)

**Recommendation:** Add model to schema if feature is to be retained.

---

## Model: `telegramMigrationTask`
**Status:** Feature appears partially active (lecture video migration). References exist in lecture video pipeline + admin.

**Files:** (2 files, 3 references)

**Recommendation:** Add model to schema or remove dead code.

---

## Model: `allowedChannel`
**Status:** Active feature (YouTube channel subscription system). Some files use `(prisma as any)`, others reference directly.

**Files:** (4 files, 5 references)

**Recommendation:** Add model to schema.

---

## Model: `channelFollow`
**Status:** Active feature (YouTube channel subscription). Used by instructor + subscribe routes.

**Files:** (4 files, 6 references)

**Recommendation:** Add model to schema.

---

## Summary

| Entity | Files | References | Status |
|---|---|---|---|
| `youtubeUploadTask` | 6 | 15 | Abandoned |
| `libraryResource` | 2 | 3 | Active |
| `sourceBook` | 5 | 10 | Active |
| `telegramMigrationTask` | 2 | 3 | Partial |
| `allowedChannel` | 4 | 5 | Active |
| `channelFollow` | 4 | 6 | Active |
| **Total** | **14** | **42** | |
