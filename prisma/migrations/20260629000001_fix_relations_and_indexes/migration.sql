-- DropForeignKey
ALTER TABLE "AIUsageLog" DROP CONSTRAINT "AIUsageLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "AcademicYear" DROP CONSTRAINT "AcademicYear_universityId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_universityId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTemplate" DROP CONSTRAINT "DocumentTemplate_userId_fkey";

-- DropForeignKey
ALTER TABLE "EngagementLog" DROP CONSTRAINT "EngagementLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Forum" DROP CONSTRAINT "Forum_universityId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalTeam" DROP CONSTRAINT "MedicalTeam_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalTeam" DROP CONSTRAINT "MedicalTeam_universityId_fkey";

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationMute" DROP CONSTRAINT "NotificationMute_userId_fkey";

-- DropForeignKey
ALTER TABLE "PastPaper" DROP CONSTRAINT "PastPaper_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "PastPaper" DROP CONSTRAINT "PastPaper_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_forumId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_universityId_fkey";

-- DropForeignKey
ALTER TABLE "PrivateForumInvite" DROP CONSTRAINT "PrivateForumInvite_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "PrivateForumInvite" DROP CONSTRAINT "PrivateForumInvite_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "ReportAction" DROP CONSTRAINT "ReportAction_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Semester" DROP CONSTRAINT "Semester_academicYearId_fkey";

-- DropForeignKey
ALTER TABLE "StudyRoom" DROP CONSTRAINT "StudyRoom_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "StudyRoom" DROP CONSTRAINT "StudyRoom_universityId_fkey";

-- DropForeignKey
ALTER TABLE "StudyRoomComment" DROP CONSTRAINT "StudyRoomComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "StudyRoomPost" DROP CONSTRAINT "StudyRoomPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "StudyRoomPostLike" DROP CONSTRAINT "StudyRoomPostLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_startedById_fkey";

-- DropForeignKey
ALTER TABLE "StudySessionParticipant" DROP CONSTRAINT "StudySessionParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPointsTransaction" DROP CONSTRAINT "UserPointsTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Warning" DROP CONSTRAINT "Warning_issuedById_fkey";

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "SourceBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "fileUrl" TEXT,
    "fullText" TEXT,
    "analysisJson" JSONB,
    "facultyId" TEXT NOT NULL,
    "semesterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "payload" JSONB,
    "category" TEXT NOT NULL,
    "sourceBookId" TEXT,
    "originUniId" TEXT,
    "sharedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramMigrationTask" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "lectureVideoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "telegramMessageId" INTEGER,
    "telegramChatId" TEXT,
    "error" TEXT,
    "progress" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramMigrationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedChannel" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "thumbnail" TEXT,
    "description" TEXT,
    "subscribers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceBook_facultyId_idx" ON "SourceBook"("facultyId");

-- CreateIndex
CREATE INDEX "SourceBook_semesterId_idx" ON "SourceBook"("semesterId");

-- CreateIndex
CREATE INDEX "LibraryResource_category_idx" ON "LibraryResource"("category");

-- CreateIndex
CREATE INDEX "LibraryResource_sourceBookId_idx" ON "LibraryResource"("sourceBookId");

-- CreateIndex
CREATE INDEX "TelegramMigrationTask_status_idx" ON "TelegramMigrationTask"("status");

-- CreateIndex
CREATE INDEX "TelegramMigrationTask_lectureVideoId_idx" ON "TelegramMigrationTask"("lectureVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "AllowedChannel_youtubeId_key" ON "AllowedChannel"("youtubeId");

-- CreateIndex
CREATE INDEX "AllowedChannel_youtubeId_idx" ON "AllowedChannel"("youtubeId");

-- CreateIndex
CREATE INDEX "ChannelFollow_userId_idx" ON "ChannelFollow"("userId");

-- CreateIndex
CREATE INDEX "ChannelFollow_channelId_idx" ON "ChannelFollow"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelFollow_userId_channelId_key" ON "ChannelFollow"("userId", "channelId");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "AdBanner_semesterId_idx" ON "AdBanner"("semesterId");

-- CreateIndex
CREATE INDEX "AdBanner_universityId_idx" ON "AdBanner"("universityId");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_idx" ON "ChecklistItem"("checklistId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_userId_idx" ON "DocumentTemplate"("userId");

-- CreateIndex
CREATE INDEX "EngagementLog_userId_idx" ON "EngagementLog"("userId");

-- CreateIndex
CREATE INDEX "Flashcard_lectureId_idx" ON "Flashcard"("lectureId");

-- CreateIndex
CREATE INDEX "Lecture_teamId_idx" ON "Lecture"("teamId");

-- CreateIndex
CREATE INDEX "LectureFile_lectureId_idx" ON "LectureFile"("lectureId");

-- CreateIndex
CREATE INDEX "LectureVideoComment_parentId_idx" ON "LectureVideoComment"("parentId");

-- CreateIndex
CREATE INDEX "Note_lectureId_idx" ON "Note"("lectureId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "PastPaper_moduleId_idx" ON "PastPaper"("moduleId");

-- CreateIndex
CREATE INDEX "PastPaper_semesterId_idx" ON "PastPaper"("semesterId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");

-- CreateIndex
CREATE INDEX "PollVote_pollOptionId_idx" ON "PollVote"("pollOptionId");

-- CreateIndex
CREATE INDEX "PollVote_userId_idx" ON "PollVote"("userId");

-- CreateIndex
CREATE INDEX "PomodoroSession_workspaceId_idx" ON "PomodoroSession"("workspaceId");

-- CreateIndex
CREATE INDEX "Post_sharedQuestionId_idx" ON "Post"("sharedQuestionId");

-- CreateIndex
CREATE INDEX "Post_teamId_idx" ON "Post"("teamId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE INDEX "PrivateForumInvite_senderId_idx" ON "PrivateForumInvite"("senderId");

-- CreateIndex
CREATE INDEX "PrivateForumInvite_receiverId_idx" ON "PrivateForumInvite"("receiverId");

-- CreateIndex
CREATE INDEX "Question_lectureId_idx" ON "Question"("lectureId");

-- CreateIndex
CREATE INDEX "QuestionReport_pastPaperId_idx" ON "QuestionReport"("pastPaperId");

-- CreateIndex
CREATE INDEX "QuizAttemptAnswer_attemptId_idx" ON "QuizAttemptAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "QuizAttemptItem_attemptId_idx" ON "QuizAttemptItem"("attemptId");

-- CreateIndex
CREATE INDEX "QuizAttemptItem_questionId_idx" ON "QuizAttemptItem"("questionId");

-- CreateIndex
CREATE INDEX "SavedPost_postId_idx" ON "SavedPost"("postId");

-- CreateIndex
CREATE INDEX "SavedQuestion_questionId_idx" ON "SavedQuestion"("questionId");

-- CreateIndex
CREATE INDEX "StudyRoomComment_parentId_idx" ON "StudyRoomComment"("parentId");

-- CreateIndex
CREATE INDEX "StudyRoomPost_sharedQuestionId_idx" ON "StudyRoomPost"("sharedQuestionId");

-- CreateIndex
CREATE INDEX "StudyRoomTaskCompletion_taskId_idx" ON "StudyRoomTaskCompletion"("taskId");

-- CreateIndex
CREATE INDEX "StudyRoomTaskCompletion_userId_idx" ON "StudyRoomTaskCompletion"("userId");

-- CreateIndex
CREATE INDEX "StudySessionParticipant_sessionId_idx" ON "StudySessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "StudySessionParticipant_userId_idx" ON "StudySessionParticipant"("userId");

-- CreateIndex
CREATE INDEX "User_leaderId_idx" ON "User"("leaderId");

-- CreateIndex
CREATE INDEX "V2Comment_postId_idx" ON "V2Comment"("postId");

-- CreateIndex
CREATE INDEX "V2Comment_parentId_idx" ON "V2Comment"("parentId");

-- CreateIndex
CREATE INDEX "V2GroupMembership_groupId_idx" ON "V2GroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "V2GroupMembership_userId_idx" ON "V2GroupMembership"("userId");

-- CreateIndex
CREATE INDEX "V2Message_groupId_idx" ON "V2Message"("groupId");

-- CreateIndex
CREATE INDEX "V2Post_communityId_idx" ON "V2Post"("communityId");

-- CreateIndex
CREATE INDEX "V2Post_authorUserId_idx" ON "V2Post"("authorUserId");

-- CreateIndex
CREATE INDEX "V2Reaction_userId_idx" ON "V2Reaction"("userId");

-- CreateIndex
CREATE INDEX "WhiteboardDocument_workspaceId_idx" ON "WhiteboardDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "WidgetInstance_workspaceId_idx" ON "WidgetInstance"("workspaceId");

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastPaper" ADD CONSTRAINT "PastPaper_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastPaper" ADD CONSTRAINT "PastPaper_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateForumInvite" ADD CONSTRAINT "PrivateForumInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateForumInvite" ADD CONSTRAINT "PrivateForumInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationMute" ADD CONSTRAINT "NotificationMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementLog" ADD CONSTRAINT "EngagementLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalTeam" ADD CONSTRAINT "MedicalTeam_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalTeam" ADD CONSTRAINT "MedicalTeam_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyRoom" ADD CONSTRAINT "StudyRoom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyRoom" ADD CONSTRAINT "StudyRoom_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyRoomPost" ADD CONSTRAINT "StudyRoomPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyRoomComment" ADD CONSTRAINT "StudyRoomComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyRoomPostLike" ADD CONSTRAINT "StudyRoomPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySessionParticipant" ADD CONSTRAINT "StudySessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointsTransaction" ADD CONSTRAINT "UserPointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAction" ADD CONSTRAINT "ReportAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceBook" ADD CONSTRAINT "SourceBook_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_originUniId_fkey" FOREIGN KEY ("originUniId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_sourceBookId_fkey" FOREIGN KEY ("sourceBookId") REFERENCES "SourceBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramMigrationTask" ADD CONSTRAINT "TelegramMigrationTask_lectureVideoId_fkey" FOREIGN KEY ("lectureVideoId") REFERENCES "LectureVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelFollow" ADD CONSTRAINT "ChannelFollow_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "AllowedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelFollow" ADD CONSTRAINT "ChannelFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

