import z from "zod";

export const FriendRequestSchema = z
  .object({
    _id: z.string().trim(),
    senderId: z.string().trim(),
    receiverId: z.string().trim(),
    createdAt: z.date(),
  })
  .strict();

export const CreateFriendRequestSchema = z
  .object({
    senderId: z.string().trim(),
    receiverId: z.string().trim(),
  })
  .strict();

export type CreateFriendRequestData = z.infer<typeof CreateFriendRequestSchema>;
export type FriendRequestData = z.infer<typeof FriendRequestSchema>;
