# ADR-001: Repository Pattern for Data Access

**Status:** Accepted  
**Date:** 2026-06-29  
**Context:** Phase 6 — Backend Architecture Audit  

## Decision

Introduce a Repository/DAO layer under `src/lib/repositories/` to encapsulate all Prisma queries for core domain entities.

## Rationale

- Isolates Prisma ORM calls behind a stable interface, making callers unaware of the data access strategy
- Enables `withRetry` wrapping in one place instead of scattered across route handlers
- Provides a clear seam for future testing and migration (e.g., Prisma → Drizzle or raw SQL)
- Reduces duplication of common query patterns (find user by email, by student ID, etc.)

## Scope

- `user.repository.ts` — User entity (findById, findByEmail, findByStudentId, updateProfile)
- Future repositories for Quiz, Forum, Flashcards as needed

## Trade-offs

- Adds an indirection layer for simple queries (but `withRetry` already adds similar overhead)
- Not applied to all entities yet — only UserAuth to start, others as extract-as-needed

## Consequences

- Route handlers no longer import `prisma` directly for user queries
- Transactional operations that span multiple repositories still use `prisma.$transaction`
