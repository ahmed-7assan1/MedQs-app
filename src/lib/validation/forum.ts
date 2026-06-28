import { z } from "zod";
import { imageUrl, emptyStringToUndefined } from "./schemas";

export const forumType = z.enum(["GLOBAL", "SEMESTER", "PRIVATE"]);

export const forumStatus = z.enum(["OPEN", "CLOSED", "READ_ONLY"]);

export const postAudience = z.enum(["UNIVERSITY", "FOLLOWERS"]);

export const pollSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2, "Poll must have at least 2 options").max(10),
});

export const createPostSchema = z
  .object({
    content: z
      .string()
      .max(5000, "Post too long — max 5000 characters")
      .optional()
      .default("")
      .transform((s) => s.trim()),
    imageUrl: z
      .preprocess(
        (v) => {
          if (v == null) return undefined;
          if (typeof v === "string") {
            const t = v.trim();
            return t || undefined;
          }
          return undefined;
        },
        imageUrl.optional()
      ),
    attachments: z.array(z.any()).optional(),
    audience: postAudience.optional(),
    isForumPost: z.boolean().optional().default(true),
    isChatMessage: z.boolean().optional().default(false),
    chatForumId: z.string().optional(),
    sharedQuestion: z.any().optional(),
    poll: pollSchema.optional(),
    postType: z.string().optional(),
    qaAnswer: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    isAnonymous: z.boolean().optional(),
    backgroundStyle: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .refine(
    (d) => d.content.length >= 1 || Boolean(d.imageUrl) || Boolean(d.poll) || Boolean(d.sharedQuestion),
    { message: "Post must have content, image, poll, or shared question", path: ["content"] }
  );

export const commentSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  parentId: z.string().uuid().nullable().optional(),
  attachments: z.array(z.any()).optional(),
});

export const createPrivateForumSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  inviteIds: z.array(z.string().uuid()).min(1, "At least one member is required"),
  inviteTokens: z.array(z.string()).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type CreatePrivateForumInput = z.infer<typeof createPrivateForumSchema>;
