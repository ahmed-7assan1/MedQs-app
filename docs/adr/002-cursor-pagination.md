# ADR-002: Cursor-Based Pagination

**Status:** Accepted  
**Date:** 2026-06-29  
**Context:** Phase 5 — Backend Architecture Audit  

## Decision

Use cursor-based pagination via `src/lib/pagination.ts` for list endpoints that return many results, instead of offset-based (`page`/`skip`).

## Rationale

- Cursor pagination is O(1) per page regardless of offset, avoiding the "skip N rows" performance cliff
- Consistent with the existing mobile client's `PaginatedResponse<T>` type (`items`, `nextCursor`, `hasMore`)
- cursor-based pagination is stable under concurrent writes — no duplicate or missing items between pages

## Implementation

- `cursorPage()` helper in `src/lib/pagination.ts` accepts a `findMany` callback, cursor params, and orderBy
- Returns `{ items, nextCursor, hasMore }` matching the existing mobile client type
- Offset-based (`page`/`limit`) retained via `buildPrismaPagination()` for small datasets and admin UIs

## Scope

- Feed endpoint (`/api/v1/feed`) — highest volume
- Forum posts (`/api/v1/forums/[forumId]/posts`)
- Post comments (`/api/v1/posts/[postId]/comments`)

## Trade-offs

- Cannot jump to arbitrary page number (no "page 42" without scanning)
- Requires an ordered unique field (typically `id`)

## Consequences

- Existing offset-based routes are not immediately migrated; cursor pagination is opt-in via the helper
- Mobile client already expects cursor-based response shape
