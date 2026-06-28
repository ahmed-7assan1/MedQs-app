# ADR-003: Shared Auth Wrapper (withAuth)

**Status:** Accepted  
**Date:** 2026-06-29  
**Context:** Phase 3 — Backend Architecture Audit  

## Decision

Create a unified `withAuth` higher-order function in `src/lib/auth-middleware.ts` that handles both Web (Supabase) and Mobile (JWT Bearer token) authentication in a single code path.

## Rationale

- Previously, every route handler duplicated auth logic: import `auth()` or `getServerToken()`, check session/token, extract userId
- ~90+ routes had this boilerplate, making auth changes risky and error-prone
- Two different auth schemes (Web cookie-based Supabase session vs Mobile Bearer JWT) needed a single entry point

## Implementation

- `withAuth(handler, options?)` automatically detects auth method from the `Authorization` header
- Options: `requireRole`, `allowMobile`, `allowWeb`
- Convenience wrappers: `withAdmin()`, `withSuperAdmin()`, `withTeacher()`, `withContentManager()`
- Returns `{ userId, session, token, scope }` to the handler

## Scope

- Applied to `mobile/profile` and `v1/admin/platform/health` as proof-of-concept
- Full route coverage planned incrementally

## Trade-offs

- Hides the auth mechanism from handlers (good for consistency, slightly harder to debug auth failures)
- Higher-order function pattern may feel unfamiliar compared to inline auth checks

## Consequences

- New route handlers should use `withAuth` instead of calling `auth()` or `getServerToken()` directly
- Mobile and Web users are authenticated through the same interface
- Role-based access control is enforced at the wrapper level, not scattered across handlers
