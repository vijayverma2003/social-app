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
import { randomUUID } from "crypto";
import prisma from "@database/postgres";

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

      const { fileName, contentType, size, hash, attachedWith } =
        validation.data;

      // Check if StorageObject already exists with this hash
      const existingStorageObject = await prisma.storageObject.findUnique({
        where: { hash },
      });

      if (existingStorageObject && existingStorageObject.status !== "done")
        return callback({
          error: "File already exists but is not ready, please try again later",
        });

      if (existingStorageObject) {
        // File already exists - create Attachment and return it
        const attachment = await prisma.attachment.create({
          data: {
            storageObjectId: existingStorageObject.id,
            userId: socket.userId,
            attachedWith,
          },
        });

        const response = {
          attachmentId: attachment.id,
          storageObjectId: existingStorageObject.id,
          url: existingStorageObject.url || undefined,
        };

        // Emit INITIALISED event to the user
        this.io
          .to(`user:${socket.userId}`)
          .emit(UPLOAD_EVENTS.INITIALISED, response);

        callback({
          success: true,
          data: response,
        });
        return;
      }

      // File doesn't exist - create new StorageObject and generate presigned URL
      const storageObjectId = randomUUID();
      const fileExtension = fileName.includes(".")
        ? "." + fileName.split(".").pop()
        : "";
      const key = `attachments/${storageObjectId}${fileExtension}`;

      // Create StorageObject with pending status
      const storageObject = await prisma.storageObject.create({
        data: {
          mimeType: contentType,
          size,
          filename: fileName,
          storageKey: key,
          hash,
          status: "pending",
          createdByUserId: socket.userId, // Track who initiated the upload
        },
      });

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
        storageObjectId: storageObject.id,
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

      const { storageObjectId, hash, attachedWith } = validation.data;

      // Find StorageObject
      const storageObject = await prisma.storageObject.findUnique({
        where: { id: storageObjectId },
      });
      if (!storageObject)
        return callback({ error: "Storage object not found" });

      // Verify the user owns this StorageObject (authorization check)
      if (storageObject.createdByUserId !== socket.userId) {
        return callback({
          error:
            "Unauthorized. You do not have permission to complete this upload.",
        });
      }

      // Verify hash matches the stored hash
      if (storageObject.hash !== hash) {
        return callback({
          error: "Hash mismatch. File hash does not match expected hash.",
        });
      }

      // Use the stored key from the StorageObject
      const key = storageObject.storageKey;

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
        if (actualHash !== storageObject.hash) {
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

          // Delete StorageObject record
          await prisma.storageObject.delete({
            where: { id: storageObjectId },
          });

          return callback({
            error: "File hash verification failed. File has been deleted.",
          });
        }

        // Hash matches - file is valid, update status to done
        const fileUrl = `${R2_PUBLIC_URL}/${key}`;

        const { attachment } = await prisma.$transaction(async (tx) => {
          const storageObject = await tx.storageObject.update({
            where: { id: storageObjectId },
            data: {
              status: "done",
              url: fileUrl,
            },
          });

          const attachment = await tx.attachment.create({
            data: {
              storageObjectId,
              userId: socket.userId!,
              attachedWith,
            },
          });

          return { storageObject, attachment };
        });

        const response = {
          attachmentId: attachment.id,
          storageObjectId,
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

        // Clean up: delete the file from R2 and the StorageObject record
        // This prevents the StorageObject from remaining in "pending" status
        try {
          // Try to delete the file from R2
          await this.r2Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
            })
          );
        } catch (deleteError) {
          console.error(
            "Error deleting file from R2 during cleanup:",
            deleteError
          );
        }

        try {
          // Delete the StorageObject record
          await prisma.storageObject.delete({
            where: { id: storageObjectId },
          });
        } catch (deleteError) {
          console.error(
            "Error deleting StorageObject during cleanup:",
            deleteError
          );
        }

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
