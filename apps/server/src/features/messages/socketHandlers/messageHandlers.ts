import { Message } from "@database/mongodb";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../../../socketHandlers";
import {
  Attachment,
  CreateMessagePayloadSchema,
  GetMessagesPayloadSchema,
  DeleteMessagePayloadSchema,
} from "@shared/schemas/messages";
import prisma from "@database/postgres";

// Extract types from ClientToServerEvents for type safety
type CreateMessageData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.CREATE]
>[0];
type CreateMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.CREATE]
>[1];

type GetMessagesData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET]
>[0];
type GetMessagesCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET]
>[1];

type DeleteMessageData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
>[0];
type DeleteMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
>[1];

export class MessageHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(MESSAGE_EVENTS.CREATE, (data, callback) =>
      this.createMessage(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.GET, (data, callback) =>
      this.getMessages(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.DELETE, (data, callback) =>
      this.deleteMessage(socket, data, callback)
    );
  }

  private async createMessage(
    socket: AuthenticatedSocket,
    data: CreateMessageData,
    callback: CreateMessageCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = CreateMessagePayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { channelId, channelType, content, storageObjectIds } =
        validation.data;

      // Verify user is a member of the channel
      if (channelType === "dm") {
        const channelUser = await prisma.channelUser.findUnique({
          where: {
            channelId_userId: {
              channelId,
              userId: socket.userId,
            },
          },
        });

        if (!channelUser) {
          return callback({
            error: "You are not a member of this channel",
          });
        }
      }

      // Fetch StorageObject data from PostgreSQL
      let attachments: Attachment[] = [];
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

        attachments = storageObjects.map((storageObject) => ({
          storageObjectId: storageObject.id,
          url: storageObject.url || "",
          fileName: storageObject.filename,
          contentType: storageObject.mimeType,
          size: storageObject.size,
          hash: storageObject.hash,
          storageKey: storageObject.storageKey,
        }));
      }

      // Create message
      const message = await Message.create({
        channelId,
        channelType,
        content,
        authorId: socket.userId,
        attachments,
      });

      // Convert MongoDB ObjectId to string
      const messageData = {
        ...message,
        _id: message._id.toString(),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };

      // Update totalUnreadMessages for DM channels
      if (channelType === "dm") {
        // Get all users currently viewing the channel (in the socket room)
        const roomName = `dm_channel:${channelId}`;
        const room = this.io.sockets.adapter.rooms.get(roomName);
        const activeUserIds = new Set<string>();

        if (room)
          // Extract userIds from all sockets in the room
          for (const socketId of room) {
            const socketInRoom = this.io.sockets.sockets.get(socketId) as
              | AuthenticatedSocket
              | undefined;
            if (socketInRoom?.userId) activeUserIds.add(socketInRoom.userId);
          }

        // Build list of userIds to exclude (sender + active viewers)
        const excludeUserIds = [socket.userId, ...Array.from(activeUserIds)];

        // Increment totalUnreadMessages for all users in the channel except:
        // 1. The sender
        // 2. Users currently viewing the channel (in the socket room)
        await prisma.channelUser.updateMany({
          where: {
            channelId,
            userId: {
              notIn: excludeUserIds,
            },
          },
          data: {
            totalUnreadMessages: {
              increment: 1,
            },
          },
        });
      }

      // Broadcast to channel room based on channel type
      const roomName =
        channelType === "dm"
          ? `dm_channel:${channelId}`
          : `channel:${channelId}`;
      this.io.to(roomName).emit(MESSAGE_EVENTS.CREATED, messageData);

      callback({
        success: true,
        data: messageData,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to create message",
      });
    }
  }

  private async getMessages(
    socket: AuthenticatedSocket,
    data: GetMessagesData,
    callback: GetMessagesCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = GetMessagesPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { channelId, channelType, limit, before } = validation.data;

      // Verify user is a member of the channel
      if (channelType === "dm") {
        const channelUser = await prisma.channelUser.findUnique({
          where: {
            channelId_userId: {
              channelId,
              userId: socket.userId,
            },
          },
        });

        if (!channelUser) {
          return callback({
            error: "You are not a member of this channel",
          });
        }
      }

      // Parse before date if provided
      const beforeDate = before ? new Date(before) : undefined;

      // Get messages
      const messages = await Message.findByChannelIdAndType(
        channelId,
        channelType,
        limit,
        beforeDate
      );

      callback({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to get messages",
      });
    }
  }

  private async deleteMessage(
    socket: AuthenticatedSocket,
    data: DeleteMessageData,
    callback: DeleteMessageCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = DeleteMessagePayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { messageId, channelId, channelType } = validation.data;

      // Find the message
      const message = await Message.findById(messageId);
      if (!message) {
        return callback({
          error: "Message not found",
        });
      }

      // Verify the message belongs to the channel
      if (
        message.channelId !== channelId ||
        message.channelType !== channelType
      ) {
        return callback({
          error: "Message does not belong to this channel",
        });
      }

      // Verify the user is the author of the message
      if (message.authorId !== socket.userId) {
        return callback({
          error: "You can only delete your own messages",
        });
      }

      // Delete the message
      const deleted = await Message.delete(messageId);
      if (!deleted) {
        return callback({
          error: "Failed to delete message",
        });
      }

      // Broadcast to channel room based on channel type
      const roomName =
        channelType === "dm"
          ? `dm_channel:${channelId}`
          : `channel:${channelId}`;
      this.io.to(roomName).emit(MESSAGE_EVENTS.DELETED, {
        messageId,
        channelId,
        channelType,
      });

      callback({
        success: true,
        data: { messageId },
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to delete message",
      });
    }
  }
}
