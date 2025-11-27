import z from "zod";

export const FriendSchema = z
  .object({
    _id: z.string().trim(),
    userId: z.string().trim(),
    friendId: z.string().trim(),
    createdAt: z.date(),
  })
  .strict();

export const CreateFriendSchema = z.object({
  userId: z.string().trim().min(1),
  friendId: z.string().trim().min(1),
});

export const FriendRequestSchema = z
  .object({
    _id: z.string().trim(),
    senderId: z.string().trim(),
    receiverId: z.string().trim(),
    createdAt: z.date(),
    senderUsername: z.string().trim().optional(),
    senderAvatarURL: z.string().trim().optional(),
    receiverUsername: z.string().trim().optional(),
    receiverAvatarURL: z.string().trim().optional(),
  })
  .strict();

export const CreateFriendRequestSchema = z
  .object({
    senderId: z.string().trim(),
    receiverId: z.string().trim(),
    senderUsername: z.string().trim().optional(),
    senderAvatarURL: z.string().trim().optional(),
    receiverUsername: z.string().trim().optional(),
    receiverAvatarURL: z.string().trim().optional(),
  })
  .strict();

export const SendFriendRequestInputSchema = z
  .object({
    receiverTag: z
      .string()
      .trim()
      .min(1, "Friend tag is required")
      .regex(
        /^[a-zA-Z0-9_]{3,50}#[0-9]{4}$/,
        "Friend tag must look like username#0000"
      ),
  })
  .strict();

export const FriendRequestActionInputSchema = z
  .object({
    requestId: z.string().trim().min(1, "Request ID is required"),
  })
  .strict();

export type CreateFriendRequestData = z.infer<typeof CreateFriendRequestSchema>;
export type FriendRequestData = z.infer<typeof FriendRequestSchema>;
export type SendFriendRequestInput = z.infer<
  typeof SendFriendRequestInputSchema
>;
export type FriendRequestActionInput = z.infer<
  typeof FriendRequestActionInputSchema
>;
export type FriendData = z.infer<typeof FriendSchema>;
