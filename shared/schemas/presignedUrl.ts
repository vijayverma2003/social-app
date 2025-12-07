import z from "zod";

// Get Presigned URL Payload Schema
export const GetPresignedUrlPayloadSchema = z
  .object({
    fileName: z.string().trim().min(1, "File name is required"),
    contentType: z.string().trim().min(1, "Content type is required"),
    bucket: z.string().trim().min(1, "Bucket name is required"),
    expiresIn: z
      .number()
      .int()
      .min(1)
      .max(5 * 60)
      .optional()
      .default(5 * 60), // Default 5 minutes, max 5 minutes
  })
  .strict();

export type GetPresignedUrlPayload = z.infer<
  typeof GetPresignedUrlPayloadSchema
>;

// Presigned URL Response Schema
export const PresignedUrlResponseSchema = z
  .object({
    url: z.url(),
    method: z.enum(["PUT", "POST"]),
    fields: z.record(z.string(), z.string()).optional(), // For POST uploads with form fields
  })
  .strict();

export type PresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>;
