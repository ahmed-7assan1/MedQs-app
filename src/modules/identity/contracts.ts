export type IdentityUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "SUPER_ADMIN" | "FACULTY_ADMIN" | "TEACHER" | "STUDENT";
  tenantKey: string | null;
};

export type AssignRoleCommand = {
  actorUserId: string;
  targetUserId: string;
  role: IdentityUser["role"];
  tenantKey: string | null;
};

export type IdentityServiceContract = {
  getCurrentUser: (userId: string) => Promise<IdentityUser | null>;
  assignRole: (input: AssignRoleCommand) => Promise<{ ok: true }>;
};
