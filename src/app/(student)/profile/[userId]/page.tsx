import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { userId: string };

/**
 * Legacy `/profile/:id` URLs → canonical `/profile/u/:id`.
 * Static routes `me` and `edit` win over this segment; this only runs for other slugs.
 */
export default async function ProfileLegacyRedirectPage({
  params,
}: {
  params: RouteParams | Promise<RouteParams>;
}) {
  const { userId } = await Promise.resolve(params);
  const raw = String(userId ?? "").trim();
  if (!raw || raw === "undefined" || raw === "null") redirect("/profile/me");
  if (raw === "me") redirect("/profile/me");
  if (raw === "edit") redirect("/profile/edit");
  redirect(`/profile/u/${encodeURIComponent(raw)}`);
}
