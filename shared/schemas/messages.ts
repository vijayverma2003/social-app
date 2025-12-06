import z from "zod";

export const ChannelTypeSchema = z.enum(["dm", "post"]);

// Message Schema
export const MessageSchema = z
  .object({
    _id: z.string().trim(),
    channelId: z.string().trim().min(1),
    channelType: ChannelTypeSchema,
    content: z.string().trim().min(1),
    createdAt: z.date(),
    updatedAt: z.date(),
    authorId: z.string().trim().min(1),
  })
  .strict();

// Create Message Schema
export const CreateMessageSchema = z
  .object({
    channelId: z.string().trim().min(1),
    channelType: ChannelTypeSchema,
    content: z.string().trim().min(1),
    authorId: z.string().trim().min(1),
  })
  .strict();

// Update Message Schema
export const UpdateMessageSchema = z
  .object({
    messageId: z.string().trim().min(1),
    content: z.string().trim().min(1),
  })
  .strict();

// Get Messages Payload Schema
export const GetMessagesPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
    channelType: ChannelTypeSchema,
    limit: z.number().int().min(1).max(100).optional().default(50),
    before: z.string().datetime().optional(), // ISO date string for pagination
  })
  .strict();

// Create Message Payload Schema (for socket events)
export const CreateMessagePayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
    channelType: ChannelTypeSchema,
    content: z.string().trim().min(1, "Message content is required"),
  })
  .strict();

export type ChannelType = z.infer<typeof ChannelTypeSchema>;
export type MessageData = z.infer<typeof MessageSchema>;
export type CreateMessageData = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageData = z.infer<typeof UpdateMessageSchema>;
export type GetMessagesPayload = z.infer<typeof GetMessagesPayloadSchema>;
export type CreateMessagePayload = z.infer<typeof CreateMessagePayloadSchema>;
