import z from "zod";

export const JoinChannelPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
  })
  .strict();

export const LeaveChannelPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
  })
  .strict();

export const MarkChannelAsReadPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
  })
  .strict();

export const GetDMChannelPayloadSchema = z
  .object({
    otherUserId: z.string().trim().min(1, "Other user ID is required"),
  })
  .strict();

export type JoinChannelPayload = z.infer<typeof JoinChannelPayloadSchema>;
export type LeaveChannelPayload = z.infer<typeof LeaveChannelPayloadSchema>;
export type MarkChannelAsReadPayload = z.infer<
  typeof MarkChannelAsReadPayloadSchema
>;
export type GetDMChannelPayload = z.infer<typeof GetDMChannelPayloadSchema>;
