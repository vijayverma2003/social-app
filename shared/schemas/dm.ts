import z from "zod";

export const JoinDMChannelPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
  })
  .strict();

export const LeaveDMChannelPayloadSchema = z
  .object({
    channelId: z.string().trim().min(1, "Channel ID is required"),
  })
  .strict();

export type JoinDMChannelPayload = z.infer<typeof JoinDMChannelPayloadSchema>;
export type LeaveDMChannelPayload = z.infer<typeof LeaveDMChannelPayloadSchema>;
