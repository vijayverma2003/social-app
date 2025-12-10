import { UPLOAD_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../../../socketHandlers";
import {
  UploadInitPayloadSchema,
  UploadCompletePayloadSchema,
} from "@shared/schemas/fileAttachment";
import { FileAttachment } from "@database/mongodb";
import { presignedUrlService } from "../../../services/presignedUrl";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_URL,
} from "../../../config/vars";
import crypto from "crypto";
import { ObjectId } from "mongodb";

// Extract types from ClientToServerEvents for type safety
type UploadInitData = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.INIT]
>[0];
type UploadInitCallback = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.INIT]
>[1];

type UploadCompleteData = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.COMPLETE]
>[0];
type UploadCompleteCallback = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.COMPLETE]
>[1];

export class UploadHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private r2Client: S3Client;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;

    // Initialize R2 client for hash verification and deletion
    if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
      this.r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: false,
      });
    } else {
      // Dummy client - will throw error if used without credentials
      this.r2Client = new S3Client({
        region: "auto",
        endpoint: "https://dummy.r2.cloudflarestorage.com",
        credentials: {
          accessKeyId: "dummy",
          secretAccessKey: "dummy",
        },
      });
    }
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(UPLOAD_EVENTS.INIT, (data, callback) =>
      this.handleUploadInit(socket, data, callback)
    );

    socket.on(UPLOAD_EVENTS.COMPLETE, (data, callback) =>
      this.handleUploadComplete(socket, data, callback)
    );
  }

  private async handleUploadInit(
    socket: AuthenticatedSocket,
    data: UploadInitData,
    callback: UploadInitCallback
  ) {
    try {
      if (!socket.userId) return callback({ error: "Unauthorized" });

      // Validate payload
      const validation = UploadInitPayloadSchema.safeParse(data);
      if (!validation.success)
        return callback({
          error: validation.error.message || "Invalid payload",
        });

      const { fileName, contentType, size, hash } = validation.data;

      // Generate ObjectId that will be used for both _id and R2 key
      const attachmentId = new ObjectId();
      const fileExtension = fileName.includes(".")
        ? "." + fileName.split(".").pop()
        : "";
      const key = `attachments/${attachmentId.toString()}${fileExtension}`;

      // Create file attachment record with uploading status and key
      // Use the same ObjectId for _id and key
      const attachment = await FileAttachment.create(
        {
          fileName,
          contentType,
          size,
          expectedHash: hash,
          status: "uploading",
          userId: socket.userId,
          key,
        },
        attachmentId // Pass the ObjectId to use as _id
      );

      // Generate presigned URL using the key
      const presignedUrlResult = await presignedUrlService.generatePresignedUrl(
        {
          fileName: key,
          contentType,
          bucket: R2_BUCKET,
          expiresIn: 5 * 60, // 5 minutes
        }
      );

      const response = {
        attachmentId: attachment._id.toString(),
        presignedUrl: presignedUrlResult.url,
      };

      // Emit INITIALISED event to the user
      this.io
        .to(`user:${socket.userId}`)
        .emit(UPLOAD_EVENTS.INITIALISED, response);

      callback({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Error initializing upload:", error);
      callback({
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize upload",
      });
    }
  }

  private async handleUploadComplete(
    socket: AuthenticatedSocket,
    data: UploadCompleteData,
    callback: UploadCompleteCallback
  ) {
    try {
      if (!socket.userId) return callback({ error: "Unauthorized" });

      // Validate payload
      const validation = UploadCompletePayloadSchema.safeParse(data);
      if (!validation.success)
        return callback({
          error: validation.error.message || "Invalid payload",
        });

      const { attachmentId, hash } = validation.data;

      // Find attachment
      const attachment = await FileAttachment.findById(attachmentId);
      if (!attachment) return callback({ error: "Attachment not found" });

      // Verify user owns this attachment
      if (attachment.userId !== socket.userId)
        return callback({ error: "Unauthorized" });

      // Use the stored key from the attachment
      const key = attachment.key;

      try {
        // Download file from R2 to verify hash
        const getObjectResponse = await this.r2Client.send(
          new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
          })
        );

        // Calculate SHA256 hash of the uploaded file
        const stream = getObjectResponse.Body as NodeJS.ReadableStream;
        const hashStream = crypto.createHash("sha256");

        await new Promise<void>((resolve, reject) => {
          stream.on("data", (chunk) => hashStream.update(chunk));
          stream.on("end", () => resolve());
          stream.on("error", reject);
        });

        const actualHash = hashStream.digest("hex");

        // Verify actual hash matches expected hash
        if (actualHash !== attachment.expectedHash) {
          // Hash mismatch - file is malicious or corrupted, delete it
          try {
            await this.r2Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
              })
            );
          } catch (deleteError) {
            console.error("Error deleting malicious file:", deleteError);
          }

          // Delete attachment record
          await FileAttachment.delete(attachmentId);

          return callback({
            error: "File hash verification failed. File has been deleted.",
          });
        }

        // Hash matches - file is valid, update status to done
        // Key already includes "attachments/" prefix
        const fileUrl = `${R2_PUBLIC_URL}/${key}`;

        await FileAttachment.updateStatus(attachmentId, "done", {
          actualHash,
          url: fileUrl,
        });

        const response = {
          attachmentId,
          url: fileUrl,
          status: "done" as const,
        };

        // Emit COMPLETED event to the user
        this.io
          .to(`user:${socket.userId}`)
          .emit(UPLOAD_EVENTS.COMPLETED, response);

        callback({
          success: true,
          data: response,
        });
      } catch (verifyError) {
        console.error("Error verifying file hash:", verifyError);

        // Mark as failed
        await FileAttachment.updateStatus(attachmentId, "failed", {});

        callback({
          error:
            verifyError instanceof Error
              ? verifyError.message
              : "Failed to verify file hash",
        });
      }
    } catch (error) {
      console.error("Error completing upload:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to complete upload",
      });
    }
  }
}
