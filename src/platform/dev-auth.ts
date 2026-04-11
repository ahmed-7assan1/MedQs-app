import type { NextRequest } from "next/server";

export type DevBypassContext = {
  ok: true;
  actorUserId: string;
  role: "SUPER_ADMIN";
  universityId: string;
};

export function devBypassFromRequest(req: NextRequest): DevBypassContext | null {
  const expected = process.env.MEDQ_DEV_ADMIN_KEY;
  if (!expected) return null;
  if (process.env.NODE_ENV === "production") return null;

  const provided = req.headers.get("x-dev-admin-key");
  if (!provided || provided !== expected) return null;

  const universityId = req.headers.get("x-university-id");
  if (!universityId) return null;

  return { ok: true, actorUserId: "dev_admin", role: "SUPER_ADMIN", universityId };
}

