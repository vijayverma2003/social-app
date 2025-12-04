import z from "zod";

export const SendFriendRequestPayloadSchema = z
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

export const AcceptFriendRequestPayloadSchema = z
  .object({
    requestId: z.string().trim().min(1, "Request ID is required"),
  })
  .strict();

export const RejectFriendRequestPayloadSchema = z
  .object({
    requestId: z.string().trim().min(1, "Request ID is required"),
  })
  .strict();

export const CancelFriendRequestPayloadSchema = z
  .object({
    requestId: z.string().trim().min(1, "Request ID is required"),
  })
  .strict();

export const RemoveFriendPayloadSchema = z
  .object({
    friendId: z.string().trim().min(1, "Friend ID is required"),
  })
  .strict();

export type SendFriendRequestPayload = z.infer<
  typeof SendFriendRequestPayloadSchema
>;
export type AcceptFriendRequestPayload = z.infer<
  typeof AcceptFriendRequestPayloadSchema
>;
export type RejectFriendRequestPayload = z.infer<
  typeof RejectFriendRequestPayloadSchema
>;
export type CancelFriendRequestPayload = z.infer<
  typeof CancelFriendRequestPayloadSchema
>;
export type RemoveFriendPayload = z.infer<typeof RemoveFriendPayloadSchema>;
