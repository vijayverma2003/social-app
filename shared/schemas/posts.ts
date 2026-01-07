import z from "zod";

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

// Get Feed Payload Schema (for socket events)
// Mirrors GetRecentPostsPayloadSchema but is used for the main feed
export const GetFeedPayloadSchema = z
  .object({
    take: z
      .number()
      .int()
      .min(1, "Take must be at least 1")
      .max(20, "Take cannot exceed 20")
      .optional()
      .default(4),
    offset: z
      .number()
      .int()
      .min(0, "Offset must be at least 0")
      .optional()
      .default(0),
  })
  .strict();
