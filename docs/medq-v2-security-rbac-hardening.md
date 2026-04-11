# MedQ V2 Security and RBAC Hardening

## Central Policy Runtime

- `src/platform/policy/policy-engine.ts` introduces `can(action, resource, context)` runtime.
- Role mapping supports `SUPER_ADMIN`, `FACULTY_ADMIN`, `TEACHER`, `STUDENT`.

## Tenant Context

- `src/platform/tenant/tenant-resolver.ts` resolves actor + tenant boundary.
- `src/platform/api/guards.ts` enforces authenticated tenant-scoped sessions.

## Patched High-Risk Endpoints

- `src/app/api/v1/modules-all/route.ts`
- `src/app/api/v1/subjects-all/route.ts`
- `src/app/api/v1/academic-years/route.ts`
- `src/app/api/v1/semesters/route.ts`
- `src/app/api/v1/lectures/[id]/route.ts`
- `src/app/api/v1/users/search/route.ts`

Each now enforces auth and tenant filtering for non-super-admin users.

## Next Security Iteration

- Apply tenant checks to all remaining read endpoints in nested content routes.
- Add integration tests for cross-tenant request denial.
- Lock user profile tenant reassignment to admin-validated transitions.
