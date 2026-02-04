import z from "zod";

export const ChannelTypeSchema = z.enum(["dm", "post"]);

// Attachment Schema (for MongoDB Message - includes fields from StorageObject)
export const AttachmentSchema = z
  .object({
    storageObjectId: z.string().trim(), // StorageObject ID from PostgreSQL
    url: z.string().url(), // From StorageObject
    fileName: z.string().trim().min(1), // From StorageObject (filename)
    contentType: z.string().trim().min(1), // From StorageObject (mimeType)
    size: z.number().int().min(0), // From StorageObject
    hash: z.string().trim().min(1), // From StorageObject
    storageKey: z.string().trim().min(1), // From StorageObject
  })
  .strict();

// Message Schema
export const MessageSchema = z
  .object({
    id: z.string().trim(),
    channelId: z.string().trim().min(1),
    channelType: ChannelTypeSchema,
    content: z.string().trim(),
    attachments: z.array(AttachmentSchema).optional().default([]),
    createdAt: z.date(),
    updatedAt: z.date(),
    authorId: z.string().trim().min(1),
    replyToMessageId: z.string().trim().optional(),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.attachments?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Message must have either content or attachments",
    }
  );

// Create Message Schema (for MongoDB - attachments are populated from PostgreSQL)
export const CreateMessageSchema = z
  .object({
    channelId: z.string().trim().min(1),
    channelType: ChannelTypeSchema,
    content: z.string().trim(),
    authorId: z.string().trim().min(1),
    attachments: z.array(AttachmentSchema).optional().default([]),
    replyToMessageId: z.string().trim().optional(),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.attachments?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Message must have either content or attachments",
    }
  );

// Update Message Schema
export const UpdateMessageSchema = z
  .object({
    messageId: z.string().trim().min(1),
    content: z.string().trim(),
    attachments: z.array(AttachmentSchema).optional().default([]),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.attachments?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Message must have either content or attachments",
    }
  );

// Get Messages Payload Schema
export const GetMessagesPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
    channelType: ChannelTypeSchema,
    limit: z.number().int().min(1).max(100).optional().default(50),
    // ISO date strings for pagination
    before: z.string().datetime().optional(), // messages strictly before this timestamp
    after: z.string().datetime().optional(), // messages strictly after this timestamp
    // When provided, fetch messages around this message ID (overrides before/after logic)
    aroundMessageId: z.string().trim().optional(),
  })
  .strict();

// Create Message Payload Schema (for socket events)
export const CreateMessagePayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
    channelType: ChannelTypeSchema,
    content: z.string().trim().max(1000, "Content must be less than 1000 characters"),
    storageObjectIds: z
      .array(z.string().trim().min(1))
      .max(10, "Maximum 10 attachments allowed")
      .optional()
      .default([]),
    optimisticId: z.string().trim().optional(), // Client-generated optimistic message ID
    replyToMessageId: z.string().trim().optional(), // ID of the message being replied to
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.storageObjectIds?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Message must have either content or attachments",
    }
  );

// Edit Message Payload Schema (for socket events)
export const EditMessagePayloadSchema = z
  .object({
    messageId: z.string().trim().min(1, "Message ID is required"),
    channelId: z.string().trim().min(1, "Channel ID is required"),
    channelType: ChannelTypeSchema,
    content: z.string().trim().max(1000, "Content must be less than 1000 characters"),
    storageObjectIds: z
      .array(z.string().trim().min(1))
      .max(10, "Maximum 10 attachments allowed")
      .optional()
      .default([]),
  })
  .strict()
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasAttachments = (data.storageObjectIds?.length || 0) > 0;
      return hasContent || hasAttachments;
    },
    {
      message: "Message must have either content or attachments",
    }
  );

// Delete Message Payload Schema (for socket events)
export const DeleteMessagePayloadSchema = z
  .object({
    messageId: z.string().trim().min(1, "Message ID is required"),
    channelId: z.string().trim().min(1, "Channel ID is required"),
    channelType: ChannelTypeSchema,
  })
  .strict();

// Accept Message Request Payload Schema
export const AcceptMessageRequestPayloadSchema = z
  .object({
    messageRequestId: z.string().trim().min(1, "Message Request ID is required"),
  })
  .strict();

// Reject Message Request Payload Schema
export const RejectMessageRequestPayloadSchema = z
  .object({
    messageRequestId: z.string().trim().min(1, "Message Request ID is required"),
  })
  .strict();

export type ChannelType = z.infer<typeof ChannelTypeSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type MessageData = z.infer<typeof MessageSchema>;
export type CreateMessageData = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageData = z.infer<typeof UpdateMessageSchema>;
export type GetMessagesPayload = z.infer<typeof GetMessagesPayloadSchema>;
export type CreateMessagePayload = z.infer<typeof CreateMessagePayloadSchema>;
export type EditMessagePayload = z.infer<typeof EditMessagePayloadSchema>;
export type DeleteMessagePayload = z.infer<typeof DeleteMessagePayloadSchema>;
export type AcceptMessageRequestPayload = z.infer<typeof AcceptMessageRequestPayloadSchema>;
export type RejectMessageRequestPayload = z.infer<typeof RejectMessageRequestPayloadSchema>;
