import { cookies } from "next/headers";

/** HttpOnly cookie storing `GuestQuizUser.id` after name + student ID registration. */
export const GUEST_QUIZ_COOKIE = "medq_guest_quiz_uid";

export async function getGuestQuizUserIdFromCookies(): Promise<string | null> {
  const c = (await cookies()).get(GUEST_QUIZ_COOKIE)?.value?.trim();
  return c && c.length > 0 ? c : null;
}
