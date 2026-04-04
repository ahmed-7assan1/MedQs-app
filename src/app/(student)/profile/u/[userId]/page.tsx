import { ProfileServerView } from "@/components/profile/ProfileServerView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { userId: string };

/** Public profile by id — lives under `/profile/u/...` so it never clashes with `/profile/me` or `/profile/edit`. */
export default async function ProfileByIdPage({
  params,
}: {
  params: RouteParams | Promise<RouteParams>;
}) {
  const { userId } = await Promise.resolve(params);
  return <ProfileServerView userIdSegment={userId} />;
}
