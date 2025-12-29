import z from "zod";

// Post Attachment Schema (references StorageObject)
export const PostAttachmentSchema = z
  .object({
    id: z.string().trim(),
    storageObjectId: z.string().trim(),
    url: z.string().url(),
    fileName: z.string().trim().min(1),
    contentType: z.string().trim().min(1),
    size: z.number().int().min(0),
    hash: z.string().trim().min(1),
    storageKey: z.string().trim().min(1),
    width: z.number().int().min(0).optional().nullable(),
    height: z.number().int().min(0).optional().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

// Post Schema
export const PostSchema = z
  .object({
    id: z.string().trim(),
    userId: z.string().trim().min(1),
    channelId: z.string().trim().optional(),
    content: z.string().trim().max(2000),
    attachments: z.array(PostAttachmentSchema).optional().default([]),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.attachments?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Post must have either content or attachments",
    }
  );

// Create Post Payload Schema (for socket events)
export const CreatePostPayloadSchema = z
  .object({
    content: z.string().trim(),
    storageObjectIds: z
      .array(z.string().trim().min(1))
      .max(10, "Maximum 10 attachments allowed"),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.storageObjectIds?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Post must have either content or attachments",
    }
  );

// Update Post Payload Schema (for socket events)
export const UpdatePostPayloadSchema = z
  .object({
    postId: z.string().trim().min(1, "Post ID is required"),
    content: z.string().trim().max(2000),
    storageObjectIds: z
      .array(z.string().trim().min(1))
      .max(10, "Maximum 10 attachments allowed"),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.storageObjectIds?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Post must have either content or attachments",
    }
  );

// Join Post Payload Schema (for socket events)
export const JoinPostPayloadSchema = z
  .object({
    postId: z.string().trim().min(1, "Post ID is required"),
  })
  .strict();

// Get Recent Posts Payload Schema (for socket events)
export const GetRecentPostsPayloadSchema = z
  .object({
    take: z
      .number()
      .int()
      .min(1, "Take must be at least 1")
      .max(20, "Take cannot exceed 20")
      .optional()
      .default(5),
    offset: z
      .number()
      .int()
      .min(0, "Offset must be at least 0")
      .optional()
      .default(0),
  })
  .strict();

export type PostAttachment = z.infer<typeof PostAttachmentSchema>;
export type PostData = z.infer<typeof PostSchema>;
export type CreatePostPayload = z.infer<typeof CreatePostPayloadSchema>;
export type UpdatePostPayload = z.infer<typeof UpdatePostPayloadSchema>;
export type JoinPostPayload = z.infer<typeof JoinPostPayloadSchema>;
export type GetRecentPostsPayload = z.infer<typeof GetRecentPostsPayloadSchema>;

// Post with user info (for feed display)
export type PostWithUser = PostData & {
  user: {
    id: string;
    username: string;
    discriminator: string;
    profile: {
      avatarURL: string | null;
      displayName: string | null;
    } | null;
  };
};
