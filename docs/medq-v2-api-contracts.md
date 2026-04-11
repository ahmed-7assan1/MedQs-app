# MedQ V2 API Contracts

## Envelope

All v2 endpoints return:

- `requestId`
- `tenantKey`
- `actor`
- `result`
- `errors`

Implemented in `src/platform/api/envelope.ts`.

## Tenant Session Guard

All v2 endpoints must pass `requireTenantSession()` from `src/platform/api/guards.ts`.

## Namespaces

- `/api/v2/org`
- `/api/v2/content`
- `/api/v2/quiz`
- `/api/v2/ai`
- `/api/v2/social`
- `/api/v2/marketplace`
- `/api/v2/study-space`

## Idempotency

`withIdempotency()` in `src/platform/api/idempotency.ts` provides write de-dup using scoped keys.

## Example Command Pattern

1. Resolve actor + tenant.
2. Validate policy with `can(action, resource, context)`.
3. Execute command transaction.
4. Emit outbox/domain event.
5. Return envelope.
