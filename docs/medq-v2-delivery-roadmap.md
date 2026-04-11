# MedQ V2 Delivery Roadmap

## Phase 1 (Weeks 1-12): Foundation and Safe Migration

### Scope
- Tenant resolver and policy engine baseline.
- V2 schema artifacts and dual-write compatibility strategy.
- API v2 namespace scaffolding.
- Design system v2 primitives and role-specific dashboard shells.
- Critical security hardening on high-risk read endpoints.

### Staffing
- 1 Principal full-stack architect
- 2 backend engineers
- 2 frontend engineers
- 1 AI engineer
- 1 QA automation engineer
- 1 product designer

### Risks
- Legacy route regressions due to stricter tenant scoping.
- Data shape mismatch between old and new quiz/content models.

### Rollback
- Feature flags for each v2 capability.
- Keep v1 read path intact until parity reports pass.
- Emergency toggle to disable v2 endpoints per tenant.

## Phase 2 (Weeks 13-20): AI, Marketplace, Community

### Scope
- Admin AI editorial pipeline and student D.Q personalization.
- Teacher marketplace course lifecycle and enrollment APIs.
- Faculty/private group social model and moderated discussions.
- Expanded analytics events and dashboards.

### Staffing
- Add 1 data engineer for analytics and warehouse pipelines.
- Add 1 DevOps/SRE for scaling and observability.

### Risks
- AI cost volatility and latency spikes.
- Moderation and abuse vectors in social features.

### Rollback
- Provider fallback routing and hard usage quotas.
- Disable per-feature communities/groups by faculty flags.

## Phase 3 (Weeks 21+): Enterprise Scale

### Scope
- University schema provisioning automation.
- Cross-tenant operational dashboard and migration orchestrator.
- SLO-based alerting and anomaly detection.
- Compliance-grade audit and retention policies.

### Risks
- Multi-schema migration complexity.
- Long-running backfills affecting production performance.

### Rollback
- Blue/green migration strategy per tenant schema.
- Progressive tenant cutovers with canary universities first.

## Success Gates
- Zero cross-tenant leaks in policy test suite.
- p95 latency targets:
  - dashboard < 300ms
  - lecture read < 250ms
  - quiz submit < 500ms
- AI cost per active student kept within configured budget thresholds.
- Backfill parity reports > 99.9% before legacy path deprecation.
