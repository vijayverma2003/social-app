import z from "zod";

// User info within a DM channel
export const DMChannelUserSchema = z
  .object({
    userId: z.string().trim().min(1),
    username: z.string().trim().optional(),
    discriminator: z.string().trim().optional(),
    avatarUrl: z.string().trim().optional(),
    lastReadAt: z.date().optional(),
    totalUnreadMessages: z.number().int().min(0).default(0),
  })
  .strict();

// Last message data (optional)
export const LastMessageSchema = z
  .object({
    content: z.string().trim(),
    createdAt: z.date(),
    authorId: z.string().trim(),
  })
  .strict()
  .optional();

// DM Channel Schema
export const DMChannelSchema = z
  .object({
    _id: z.string().trim(),
    createdAt: z.date(),
    users: z
      .array(DMChannelUserSchema)
      .min(1, "Channel must have at least 1 user")
      .max(2, "DM channel can have maximum 2 users"),
    lastMessage: LastMessageSchema,
  })
  .strict();

// Create DM Channel Schema
export const CreateDMChannelSchema = z
  .object({
    userIds: z
      .array(z.string().trim().min(1))
      .min(1, "At least 1 user ID is required")
      .max(2, "DM channel can have maximum 2 users"),
  })
  .strict();

// Channel Type enum
export const ChannelTypeSchema = z.enum(["dm"]);

// Direct Message Schema
export const DirectMessageSchema = z
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

// Create Direct Message Schema
export const CreateDirectMessageSchema = z
  .object({
    channelId: z.string().trim().min(1),
    channelType: ChannelTypeSchema,
    content: z.string().trim().min(1),
    authorId: z.string().trim().min(1),
  })
  .strict();

// Update Direct Message Schema
export const UpdateDirectMessageSchema = z
  .object({
    content: z.string().trim().min(1),
  })
  .strict();

// Type exports
export type DMChannelUser = z.infer<typeof DMChannelUserSchema>;
export type LastMessage = z.infer<typeof LastMessageSchema>;
export type DMChannelData = z.infer<typeof DMChannelSchema>;
export type CreateDMChannelData = z.infer<typeof CreateDMChannelSchema>;
export type ChannelType = z.infer<typeof ChannelTypeSchema>;
export type DirectMessageData = z.infer<typeof DirectMessageSchema>;
export type CreateDirectMessageData = z.infer<typeof CreateDirectMessageSchema>;
export type UpdateDirectMessageData = z.infer<typeof UpdateDirectMessageSchema>;
