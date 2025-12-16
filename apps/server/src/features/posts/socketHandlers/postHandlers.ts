import { POST_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../../../socketHandlers";
import {
  CreatePostPayloadSchema,
  UpdatePostPayloadSchema,
  PostData,
} from "@shared/schemas/post";
import prisma from "@database/postgres";

// Extract types from ClientToServerEvents for type safety
type CreatePostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[0];
type CreatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[1];

type UpdatePostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UPDATE]
>[0];
type UpdatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UPDATE]
>[1];

export class PostHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(POST_EVENTS.CREATE, (data, callback) =>
      this.createPost(socket, data, callback)
    );

    socket.on(POST_EVENTS.UPDATE, (data, callback) =>
      this.updatePost(socket, data, callback)
    );
  }

  private async createPost(
    socket: AuthenticatedSocket,
    data: CreatePostData,
    callback: CreatePostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = CreatePostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { content, storageObjectIds } = validation.data;

      // Validate and fetch StorageObject data from PostgreSQL if attachments are provided
      let attachmentData:
        | { create: Array<{ storageObjectId: string }> }
        | undefined;
      if (storageObjectIds && storageObjectIds.length > 0) {
        const storageObjects = await prisma.storageObject.findMany({
          where: {
            id: { in: storageObjectIds },
            status: "done", // Only allow completed uploads
          },
        });

        // Verify all StorageObjects exist and are ready
        if (storageObjects.length !== storageObjectIds.length) {
          return callback({
            error: "One or more storage objects not found or not ready",
          });
        }

        attachmentData = {
          create: storageObjects.map((storageObject) => ({
            storageObjectId: storageObject.id,
          })),
        };
      }

      // Create post with or without attachments
      const post = await prisma.post.create({
        data: {
          userId: socket.userId,
          content,
          ...(attachmentData && { attachments: attachmentData }),
        },
        include: {
          attachments: {
            include: {
              storageObject: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              profile: true,
            },
          },
        },
      });

      // Format attachments for response
      const attachments = post.attachments.map((attachment) => ({
        id: attachment.id,
        storageObjectId: attachment.storageObjectId,
        url: attachment.storageObject.url || "",
        fileName: attachment.storageObject.filename,
        contentType: attachment.storageObject.mimeType,
        size: attachment.storageObject.size,
        hash: attachment.storageObject.hash,
        storageKey: attachment.storageObject.storageKey,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      }));

      // Format post data for response
      const postData: PostData = {
        id: post.id,
        userId: post.userId,
        content: post.content,
        attachments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      // Broadcast to all users (posts are public)
      this.io.emit(POST_EVENTS.CREATED, postData);

      callback({
        success: true,
        data: postData,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      callback({
        error: error instanceof Error ? error.message : "Failed to create post",
      });
    }
  }

  private async updatePost(
    socket: AuthenticatedSocket,
    data: UpdatePostData,
    callback: UpdatePostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = UpdatePostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId, content, storageObjectIds } = validation.data;

      // Find the post
      const existingPost = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        return callback({
          error: "Post not found",
        });
      }

      // Verify the user is the author of the post
      if (existingPost.userId !== socket.userId) {
        return callback({
          error: "You can only update your own posts",
        });
      }

      // Validate and fetch StorageObject data from PostgreSQL if attachments are provided
      let attachmentData:
        | { create: Array<{ storageObjectId: string }> }
        | undefined;
      if (storageObjectIds && storageObjectIds.length > 0) {
        const storageObjects = await prisma.storageObject.findMany({
          where: {
            id: { in: storageObjectIds },
            status: "done",
          },
        });

        if (storageObjects.length !== storageObjectIds.length) {
          return callback({
            error: "One or more storage objects not found or not ready",
          });
        }

        attachmentData = {
          create: storageObjects.map((storageObject) => ({
            storageObjectId: storageObject.id,
          })),
        };
      }

      // Delete existing attachments (will be replaced if new ones are provided)
      await prisma.postAttachment.deleteMany({
        where: { postId },
      });

      // Update post with new content and attachments (if provided)
      const post = await prisma.post.update({
        where: { id: postId },
        data: {
          content,
          ...(attachmentData && { attachments: attachmentData }),
        },
        include: {
          attachments: {
            include: {
              storageObject: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              discriminator: true,
            },
          },
        },
      });

      // Format attachments for response
      const attachments = post.attachments.map((attachment) => ({
        id: attachment.id,
        storageObjectId: attachment.storageObjectId,
        url: attachment.storageObject.url || "",
        fileName: attachment.storageObject.filename,
        contentType: attachment.storageObject.mimeType,
        size: attachment.storageObject.size,
        hash: attachment.storageObject.hash,
        storageKey: attachment.storageObject.storageKey,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      }));

      // Format post data for response
      const postData: PostData = {
        id: post.id,
        userId: post.userId,
        content: post.content,
        attachments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      // Broadcast to all users (posts are public)
      this.io.emit(POST_EVENTS.UPDATED, postData);

      callback({
        success: true,
        data: postData,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      callback({
        error: error instanceof Error ? error.message : "Failed to update post",
      });
    }
  }
}
