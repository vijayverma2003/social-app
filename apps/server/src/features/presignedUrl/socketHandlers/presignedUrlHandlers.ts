import { PRESIGNED_URL_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../../../socketHandlers";
import { GetPresignedUrlPayloadSchema } from "@shared/schemas/presignedUrl";
import { presignedUrlService } from "../../../services/presignedUrl";

// Extract types from ClientToServerEvents for type safety
type GetPresignedUrlData = Parameters<
  ClientToServerEvents[typeof PRESIGNED_URL_EVENTS.GET]
>[0];
type GetPresignedUrlCallback = Parameters<
  ClientToServerEvents[typeof PRESIGNED_URL_EVENTS.GET]
>[1];

export class PresignedUrlHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(PRESIGNED_URL_EVENTS.GET, (data, callback) =>
      this.getPresignedUrl(socket, data, callback)
    );
  }

  private async getPresignedUrl(
    socket: AuthenticatedSocket,
    data: GetPresignedUrlData,
    callback: GetPresignedUrlCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = GetPresignedUrlPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { fileName, contentType, bucket, expiresIn } = validation.data;

      // Generate presigned URL for R2
      const result = await presignedUrlService.generatePresignedUrl({
        fileName,
        contentType,
        bucket,
        expiresIn,
      });

      callback({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      callback({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate presigned URL",
      });
    }
  }
}
