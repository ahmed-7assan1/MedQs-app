import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteUserAccount(userId: string) {
  // 1. Delete related records from tables WITHOUT cascade on User.
  //    Tables that DO have cascade (Note, TeamMember, BlockedUser, etc.)
  //    are handled automatically by prisma.user.delete().
  
  // User-owned content that would otherwise block the FK constraint
  await prisma.studyRoom.deleteMany({ where: { ownerId: userId } });
  await prisma.group.deleteMany({ where: { ownerId: userId } });
  await prisma.studySession.deleteMany({ where: { startedById: userId } });
  await prisma.post.deleteMany({ where: { authorId: userId } });
  await prisma.comment.deleteMany({ where: { authorId: userId } });
  await prisma.studyRoomPost.deleteMany({ where: { authorId: userId } });
  await prisma.studyRoomComment.deleteMany({ where: { authorId: userId } });

  // User interactions
  await prisma.like.deleteMany({ where: { userId } });
  await prisma.commentLike.deleteMany({ where: { userId } });
  await prisma.studyRoomPostLike.deleteMany({ where: { userId } });
  await prisma.studySessionParticipant.deleteMany({ where: { userId } });
  await prisma.userPointsTransaction.deleteMany({ where: { userId } });

  // Notifications & settings
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.notificationMute.deleteMany({ where: { userId } });

  // Logs & history (these could be SetNull, but for full deletion we remove them)
  await prisma.engagementLog.deleteMany({ where: { userId } });
  await prisma.aIUsageLog.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: { userId } });

  // Reports (user as reporter or admin)
  await prisma.report.deleteMany({ where: { reporterId: userId } });
  await prisma.reportAction.deleteMany({ where: { adminId: userId } });

  // Miscellaneous
  await prisma.documentTemplate.deleteMany({ where: { userId } });

  // 2. Delete the Prisma user (cascades to: Account, Session, Note, TeamMember,
  //    BlockedUser, SavedPost, SavedQuestion, PushSubscription, PollVote, etc.)
  await prisma.user.delete({ where: { id: userId } });

  // 3. Delete from Supabase Auth (service role required)
  try {
    const supabase = createAdminClient();
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error("[account-deletion] Supabase Auth delete error:", error);
  }

  // 4. Try to clean up Firebase AI chat threads
  try {
    const { deleteUserFirebaseData } = await import("./firebase-cleanup");
    await deleteUserFirebaseData(userId);
  } catch {
    // Firebase cleanup is optional
  }
}
