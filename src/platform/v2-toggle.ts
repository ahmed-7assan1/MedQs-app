import type { NextRequest } from "next/server";
import { FLAG_V2_ORG_CONTENT_ASSESSMENT, isFeatureEnabled } from "@/platform/flags";

export async function wantsV2OrgContentAssessment(req: NextRequest, universityId: string | null) {
  const header = (req.headers.get("x-medq-version") ?? "").toLowerCase().trim();
  if (header !== "v2") return false;
  return isFeatureEnabled({ key: FLAG_V2_ORG_CONTENT_ASSESSMENT, universityId });
}

