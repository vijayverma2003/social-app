import z from "zod";

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

export type SendFriendRequestInput = z.infer<
  typeof SendFriendRequestInputSchema
>;
export type FriendRequestActionInput = z.infer<
  typeof FriendRequestActionInputSchema
>;
