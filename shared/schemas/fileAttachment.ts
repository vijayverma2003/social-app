import z from "zod";

export const FileAttachmentStatusSchema = z.enum([
  "uploading",
  "done",
  "failed",
]);

// File Attachment Schema
export const FileAttachmentSchema = z
  .object({
    id: z.string().trim(),
    fileName: z.string().trim().min(1),
    contentType: z.string().trim().min(1),
    size: z.number().int().min(0), // Size in bytes
    expectedHash: z.string().trim().min(1), // SHA hash from client
    actualHash: z.string().trim().optional(), // SHA hash after upload verification
    status: FileAttachmentStatusSchema,
    url: z.url().optional(), // Final URL after upload
    userId: z.string().trim().min(1),
    key: z.string().trim().min(1), // R2 storage key
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

// Upload Init Payload Schema
export const UploadInitPayloadSchema = z
  .object({
    fileName: z.string().trim().min(1, "File name is required"),
    contentType: z.string().trim().min(1, "Content type is required"),
    size: z.number().int().min(1, "File size must be greater than 0"),
    hash: z.string().trim().min(1, "File hash is required"), // SHA hash
  })
  .strict();

// Upload Complete Payload Schema
export const UploadCompletePayloadSchema = z
  .object({
    storageObjectId: z.string().trim().min(1, "Storage Object ID is required"),
    hash: z.string().trim().min(1, "File hash is required"), // SHA hash for verification
  })
  .strict();

// Upload Initialised Response Schema
export const UploadInitialisedResponseSchema = z
  .object({
    storageObjectId: z.string().trim(), // StorageObject ID (always present)
    presignedUrl: z.url().optional(), // Only present if file needs to be uploaded
    url: z.string().url().optional(), // URL (present if file already exists)
  })
  .strict();

// Upload Completed Response Schema
export const UploadCompletedResponseSchema = z
  .object({
    storageObjectId: z.string().trim(),
    url: z.url(),
    status: z.enum(["done"]),
  })
  .strict();

export type FileAttachmentStatus = z.infer<typeof FileAttachmentStatusSchema>;
export type FileAttachment = z.infer<typeof FileAttachmentSchema>;
export type UploadInitPayload = z.infer<typeof UploadInitPayloadSchema>;
export type UploadCompletePayload = z.infer<typeof UploadCompletePayloadSchema>;
export type UploadInitialisedResponse = z.infer<
  typeof UploadInitialisedResponseSchema
>;
export type UploadCompletedResponse = z.infer<
  typeof UploadCompletedResponseSchema
>;
