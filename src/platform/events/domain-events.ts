export type DomainEventName =
  | "tenant.created"
  | "faculty.created"
  | "curriculum.published"
  | "lecture.published"
  | "quiz.published"
  | "quiz.attempt.submitted"
  | "quiz.analytics.recomputed"
  | "ai.admin.job.completed"
  | "ai.student.interaction.logged"
  | "marketplace.enrollment.created"
  | "studyspace.session.completed";

export type DomainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  name: DomainEventName;
  tenantKey: string | null;
  actorUserId: string | null;
  payload: TPayload;
  occurredAt: string;
};

export function createDomainEvent<TPayload>(args: {
  name: DomainEventName;
  tenantKey?: string | null;
  actorUserId?: string | null;
  payload: TPayload;
}): DomainEvent<TPayload> {
  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    name: args.name,
    tenantKey: args.tenantKey ?? null,
    actorUserId: args.actorUserId ?? null,
    payload: args.payload,
    occurredAt: new Date().toISOString(),
  };
}
