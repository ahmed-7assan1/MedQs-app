
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.SiteConfigScalarFieldEnum = {
  id: 'id',
  siteName: 'siteName',
  logoUrl: 'logoUrl',
  faviconUrl: 'faviconUrl',
  primaryColor: 'primaryColor',
  enableAI: 'enableAI',
  enableForum: 'enableForum',
  enableAds: 'enableAds',
  enableNotifs: 'enableNotifs',
  enableLeaderboard: 'enableLeaderboard',
  updatedAt: 'updatedAt',
  fontArabic: 'fontArabic',
  fontSans: 'fontSans',
  aiPreferredProvider: 'aiPreferredProvider',
  pwaIconUrl: 'pwaIconUrl',
  logoUrlDark: 'logoUrlDark',
  facebookUrl: 'facebookUrl',
  hulkLogoUrl: 'hulkLogoUrl',
  instagramUrl: 'instagramUrl',
  telegramUrl: 'telegramUrl',
  twitterUrl: 'twitterUrl',
  whatsappUrl: 'whatsappUrl',
  youtubeUrl: 'youtubeUrl',
  enableCreativeStudio: 'enableCreativeStudio',
  stabilityAIKey: 'stabilityAIKey',
  assemblyAIKey: 'assemblyAIKey',
  uploadcarePublicKey: 'uploadcarePublicKey'
};

exports.Prisma.FeatureFlagScalarFieldEnum = {
  id: 'id',
  key: 'key',
  enabled: 'enabled',
  payload: 'payload',
  universityId: 'universityId',
  updatedAt: 'updatedAt'
};

exports.Prisma.UniversityScalarFieldEnum = {
  id: 'id',
  name: 'name',
  logoUrl: 'logoUrl',
  idMinLength: 'idMinLength',
  idMaxLength: 'idMaxLength',
  createdAt: 'createdAt'
};

exports.Prisma.FacultyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  logoUrl: 'logoUrl',
  universityId: 'universityId',
  createdAt: 'createdAt',
  category: 'category'
};

exports.Prisma.UniversityYearIdFormatScalarFieldEnum = {
  id: 'id',
  universityId: 'universityId',
  yearNumber: 'yearNumber',
  minLength: 'minLength',
  maxLength: 'maxLength',
  prefix: 'prefix'
};

exports.Prisma.AcademicYearScalarFieldEnum = {
  id: 'id',
  yearNumber: 'yearNumber',
  universityId: 'universityId',
  facultyId: 'facultyId'
};

exports.Prisma.SemesterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  academicYearId: 'academicYearId'
};

exports.Prisma.PlaylistSyncTaskScalarFieldEnum = {
  id: 'id',
  playlistUrl: 'playlistUrl',
  semesterId: 'semesterId',
  mediaType: 'mediaType',
  editionYear: 'editionYear',
  lastSynced: 'lastSynced',
  createdAt: 'createdAt'
};

exports.Prisma.ModuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  icon: 'icon',
  semesterId: 'semesterId'
};

exports.Prisma.SubjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  icon: 'icon',
  moduleId: 'moduleId',
  isQuizSystemBank: 'isQuizSystemBank',
  semesterId: 'semesterId'
};

exports.Prisma.LectureScalarFieldEnum = {
  id: 'id',
  title: 'title',
  videoUrl: 'videoUrl',
  order: 'order',
  subjectId: 'subjectId',
  notesMarkdown: 'notesMarkdown',
  extras: 'extras',
  uiConfig: 'uiConfig',
  teamId: 'teamId'
};

exports.Prisma.FlashcardScalarFieldEnum = {
  id: 'id',
  front: 'front',
  back: 'back',
  lectureId: 'lectureId'
};

exports.Prisma.LectureFileScalarFieldEnum = {
  id: 'id',
  name: 'name',
  url: 'url',
  mimeType: 'mimeType',
  lectureId: 'lectureId'
};

exports.Prisma.LectureVideoScalarFieldEnum = {
  id: 'id',
  title: 'title',
  url: 'url',
  sourceType: 'sourceType',
  sharingEnabled: 'sharingEnabled',
  likesCount: 'likesCount',
  commentsCount: 'commentsCount',
  sharesCount: 'sharesCount',
  sortOrder: 'sortOrder',
  lectureId: 'lectureId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LectureRecordScalarFieldEnum = {
  id: 'id',
  title: 'title',
  url: 'url',
  sourceType: 'sourceType',
  lectureId: 'lectureId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LectureVideoCommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  videoId: 'videoId',
  userId: 'userId',
  createdAt: 'createdAt',
  parentId: 'parentId'
};

exports.Prisma.LectureVideoLikeScalarFieldEnum = {
  id: 'id',
  videoId: 'videoId',
  userId: 'userId'
};

exports.Prisma.QuestionScalarFieldEnum = {
  id: 'id',
  body: 'body',
  choices: 'choices',
  answer: 'answer',
  explanation: 'explanation',
  aiExplanation: 'aiExplanation',
  difficulty: 'difficulty',
  lectureId: 'lectureId',
  createdAt: 'createdAt',
  imageUrl: 'imageUrl',
  stemLayout: 'stemLayout',
  essayReference: 'essayReference',
  questionType: 'questionType'
};

exports.Prisma.PastPaperScalarFieldEnum = {
  id: 'id',
  title: 'title',
  pdfUrl: 'pdfUrl',
  isInteractive: 'isInteractive',
  timeLimitMin: 'timeLimitMin',
  semesterId: 'semesterId',
  moduleId: 'moduleId',
  createdAt: 'createdAt',
  aiExplanationEnabled: 'aiExplanationEnabled',
  allowAiDuringQuiz: 'allowAiDuringQuiz',
  restrictCopyPaste: 'restrictCopyPaste',
  secureExamMode: 'secureExamMode',
  trackFocusLoss: 'trackFocusLoss',
  kind: 'kind',
  quizLectureId: 'quizLectureId',
  googleSheetsSyncEnabled: 'googleSheetsSyncEnabled',
  isPrivate: 'isPrivate',
  randomizeQuestions: 'randomizeQuestions'
};

exports.Prisma.QuestionReportScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  userId: 'userId',
  note: 'note',
  pastPaperId: 'pastPaperId',
  createdAt: 'createdAt'
};

exports.Prisma.SavedQuestionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  questionId: 'questionId',
  createdAt: 'createdAt'
};

exports.Prisma.GuestQuizUserScalarFieldEnum = {
  id: 'id',
  displayName: 'displayName',
  externalStudentId: 'externalStudentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  facultyId: 'facultyId',
  semesterId: 'semesterId',
  universityId: 'universityId'
};

exports.Prisma.QuizAttemptScalarFieldEnum = {
  id: 'id',
  score: 'score',
  timeTaken: 'timeTaken',
  userId: 'userId',
  pastPaperId: 'pastPaperId',
  createdAt: 'createdAt',
  focusLossCount: 'focusLossCount',
  guestQuizUserId: 'guestQuizUserId'
};

exports.Prisma.StudyAssistantProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  scheduleText: 'scheduleText',
  hobbies: 'hobbies',
  dailyStudyMinutes: 'dailyStudyMinutes',
  worshipMinutes: 'worshipMinutes',
  otherRoutines: 'otherRoutines',
  currentPlanJson: 'currentPlanJson',
  progressJson: 'progressJson',
  weekStartIso: 'weekStartIso',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuizAttemptItemScalarFieldEnum = {
  id: 'id',
  chosen: 'chosen',
  isCorrect: 'isCorrect',
  attemptId: 'attemptId',
  questionId: 'questionId',
  essayGrade: 'essayGrade'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  nickname: 'nickname',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  bio: 'bio',
  phone: 'phone',
  phoneVisible: 'phoneVisible',
  hideRank: 'hideRank',
  theme: 'theme',
  role: 'role',
  points: 'points',
  password: 'password',
  studentId: 'studentId',
  universityId: 'universityId',
  semesterId: 'semesterId',
  rankId: 'rankId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  facebookUrl: 'facebookUrl',
  instagramUrl: 'instagramUrl',
  isPrivate: 'isPrivate',
  canManageReports: 'canManageReports',
  facultyId: 'facultyId',
  personalGeminiKey: 'personalGeminiKey',
  handle: 'handle',
  telegramId: 'telegramId',
  telegramVerified: 'telegramVerified'
};

exports.Prisma.TelegramConfigScalarFieldEnum = {
  id: 'id',
  welcomeMessage: 'welcomeMessage',
  broadcastMessage: 'broadcastMessage',
  botStatus: 'botStatus',
  updatedAt: 'updatedAt'
};

exports.Prisma.BotAuthScalarFieldEnum = {
  id: 'id',
  code: 'code',
  telegramId: 'telegramId',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.NoteScalarFieldEnum = {
  id: 'id',
  content: 'content',
  lectureId: 'lectureId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserLectureActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  lectureId: 'lectureId',
  source: 'source',
  lastViewedAt: 'lastViewedAt',
  isCompleted: 'isCompleted'
};

exports.Prisma.DirectMessageScalarFieldEnum = {
  id: 'id',
  body: 'body',
  read: 'read',
  senderId: 'senderId',
  receiverId: 'receiverId',
  createdAt: 'createdAt'
};

exports.Prisma.ForumScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  status: 'status',
  semesterId: 'semesterId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  universityId: 'universityId'
};

exports.Prisma.PrivateForumMemberScalarFieldEnum = {
  id: 'id',
  forumId: 'forumId',
  userId: 'userId'
};

exports.Prisma.PrivateForumInviteScalarFieldEnum = {
  id: 'id',
  forumId: 'forumId',
  senderId: 'senderId',
  receiverId: 'receiverId',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  content: 'content',
  imageUrl: 'imageUrl',
  interactionsDisabled: 'interactionsDisabled',
  authorId: 'authorId',
  forumId: 'forumId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  audience: 'audience',
  universityId: 'universityId',
  expiresAt: 'expiresAt',
  isPinned: 'isPinned',
  isChatMessage: 'isChatMessage',
  isForumPost: 'isForumPost',
  teamId: 'teamId'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  authorId: 'authorId',
  postId: 'postId',
  parentId: 'parentId',
  createdAt: 'createdAt',
  universityId: 'universityId'
};

exports.Prisma.UserFollowScalarFieldEnum = {
  id: 'id',
  followerId: 'followerId',
  followingId: 'followingId',
  createdAt: 'createdAt'
};

exports.Prisma.LikeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  postId: 'postId'
};

exports.Prisma.CommentLikeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  commentId: 'commentId'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  title: 'title',
  body: 'body',
  channel: 'channel',
  read: 'read',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationMuteScalarFieldEnum = {
  id: 'id',
  muteAll: 'muteAll',
  muteForum: 'muteForum',
  mutePostId: 'mutePostId',
  userId: 'userId'
};

exports.Prisma.RankScalarFieldEnum = {
  id: 'id',
  label: 'label',
  minPoints: 'minPoints',
  badge: 'badge'
};

exports.Prisma.EngagementLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  points: 'points',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.AIUsageLogScalarFieldEnum = {
  id: 'id',
  type: 'type',
  userId: 'userId',
  date: 'date',
  count: 'count'
};

exports.Prisma.AdBannerScalarFieldEnum = {
  id: 'id',
  imageUrl: 'imageUrl',
  linkUrl: 'linkUrl',
  active: 'active',
  universityId: 'universityId',
  semesterId: 'semesterId',
  createdAt: 'createdAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.DocumentTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  fileUrl: 'fileUrl',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.UserTaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  time: 'time',
  completed: 'completed',
  date: 'date',
  lectureId: 'lectureId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SourceBookScalarFieldEnum = {
  id: 'id',
  title: 'title',
  author: 'author',
  fileUrl: 'fileUrl',
  fullText: 'fullText',
  analysisJson: 'analysisJson',
  facultyId: 'facultyId',
  semesterId: 'semesterId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LibraryResourceScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  url: 'url',
  payload: 'payload',
  category: 'category',
  sourceBookId: 'sourceBookId',
  originUniId: 'originUniId',
  sharedBy: 'sharedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AllowedChannelScalarFieldEnum = {
  id: 'id',
  youtubeId: 'youtubeId',
  name: 'name',
  handle: 'handle',
  thumbnail: 'thumbnail',
  description: 'description',
  subscribers: 'subscribers',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChannelFollowScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  channelId: 'channelId',
  createdAt: 'createdAt'
};

exports.Prisma.YoutubeUploadTaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  sourceUrl: 'sourceUrl',
  targetPlaylistId: 'targetPlaylistId',
  lectureVideoId: 'lectureVideoId',
  status: 'status',
  progress: 'progress',
  totalVideos: 'totalVideos',
  syncedVideos: 'syncedVideos',
  error: 'error',
  entityId: 'entityId',
  newVideoUrl: 'newVideoUrl',
  logs: 'logs',
  colabLastPoll: 'colabLastPoll',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MedicalTeamScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  imageUrl: 'imageUrl',
  coverUrl: 'coverUrl',
  facultyId: 'facultyId',
  universityId: 'universityId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  followersCount: 'followersCount'
};

exports.Prisma.TeamMemberScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  userId: 'userId',
  role: 'role',
  createdAt: 'createdAt'
};

exports.Prisma.TeamFollowerScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.PlatformMemberScalarFieldEnum = {
  id: 'id',
  name: 'name',
  role: 'role',
  description: 'description',
  imageUrl: 'imageUrl',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BotUserScalarFieldEnum = {
  id: 'id',
  telegramId: 'telegramId',
  personalKey: 'personalKey',
  preferredProvider: 'preferredProvider',
  customModel: 'customModel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.FacultyCategory = exports.$Enums.FacultyCategory = {
  HUMAN_MEDICINE: 'HUMAN_MEDICINE',
  DENTAL_MEDICINE: 'DENTAL_MEDICINE',
  PHARMACY: 'PHARMACY',
  PHYSICAL_THERAPY: 'PHYSICAL_THERAPY',
  OTHER: 'OTHER'
};

exports.Difficulty = exports.$Enums.Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
};

exports.QuestionStemLayout = exports.$Enums.QuestionStemLayout = {
  STANDARD: 'STANDARD',
  IMAGE_OVERLAY: 'IMAGE_OVERLAY'
};

exports.PastPaperKind = exports.$Enums.PastPaperKind = {
  MODULE_QUESTION_BANK: 'MODULE_QUESTION_BANK',
  ADMIN_AUTHORED_QUIZ: 'ADMIN_AUTHORED_QUIZ'
};

exports.Theme = exports.$Enums.Theme = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM'
};

exports.Role = exports.$Enums.Role = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

exports.ForumType = exports.$Enums.ForumType = {
  GLOBAL: 'GLOBAL',
  SEMESTER: 'SEMESTER',
  PRIVATE: 'PRIVATE'
};

exports.ForumStatus = exports.$Enums.ForumStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  READ_ONLY: 'READ_ONLY'
};

exports.PostAudience = exports.$Enums.PostAudience = {
  UNIVERSITY: 'UNIVERSITY',
  FOLLOWERS: 'FOLLOWERS'
};

exports.NotifChannel = exports.$Enums.NotifChannel = {
  SYSTEM: 'SYSTEM',
  FORUM: 'FORUM',
  BROADCAST: 'BROADCAST'
};

exports.TeamRole = exports.$Enums.TeamRole = {
  LEADER: 'LEADER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER'
};

exports.Prisma.ModelName = {
  SiteConfig: 'SiteConfig',
  FeatureFlag: 'FeatureFlag',
  University: 'University',
  Faculty: 'Faculty',
  UniversityYearIdFormat: 'UniversityYearIdFormat',
  AcademicYear: 'AcademicYear',
  Semester: 'Semester',
  PlaylistSyncTask: 'PlaylistSyncTask',
  Module: 'Module',
  Subject: 'Subject',
  Lecture: 'Lecture',
  Flashcard: 'Flashcard',
  LectureFile: 'LectureFile',
  LectureVideo: 'LectureVideo',
  LectureRecord: 'LectureRecord',
  LectureVideoComment: 'LectureVideoComment',
  LectureVideoLike: 'LectureVideoLike',
  Question: 'Question',
  PastPaper: 'PastPaper',
  QuestionReport: 'QuestionReport',
  SavedQuestion: 'SavedQuestion',
  GuestQuizUser: 'GuestQuizUser',
  QuizAttempt: 'QuizAttempt',
  StudyAssistantProfile: 'StudyAssistantProfile',
  QuizAttemptItem: 'QuizAttemptItem',
  User: 'User',
  TelegramConfig: 'TelegramConfig',
  BotAuth: 'BotAuth',
  Note: 'Note',
  UserLectureActivity: 'UserLectureActivity',
  DirectMessage: 'DirectMessage',
  Forum: 'Forum',
  PrivateForumMember: 'PrivateForumMember',
  PrivateForumInvite: 'PrivateForumInvite',
  Post: 'Post',
  Comment: 'Comment',
  UserFollow: 'UserFollow',
  Like: 'Like',
  CommentLike: 'CommentLike',
  Notification: 'Notification',
  NotificationMute: 'NotificationMute',
  Rank: 'Rank',
  EngagementLog: 'EngagementLog',
  AIUsageLog: 'AIUsageLog',
  AdBanner: 'AdBanner',
  Account: 'Account',
  DocumentTemplate: 'DocumentTemplate',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  UserTask: 'UserTask',
  SourceBook: 'SourceBook',
  LibraryResource: 'LibraryResource',
  AllowedChannel: 'AllowedChannel',
  ChannelFollow: 'ChannelFollow',
  YoutubeUploadTask: 'YoutubeUploadTask',
  MedicalTeam: 'MedicalTeam',
  TeamMember: 'TeamMember',
  TeamFollower: 'TeamFollower',
  PlatformMember: 'PlatformMember',
  BotUser: 'BotUser'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
