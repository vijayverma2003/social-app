import { Message } from "@database/mongodb";
import prisma from "@database/postgres";
import {
  Attachment,
  CreateMessagePayloadSchema,
  EditMessagePayloadSchema,
  DeleteMessagePayloadSchema,
  GetMessagesPayloadSchema,
  AcceptMessageRequestPayloadSchema,
  RejectMessageRequestPayloadSchema,
} from "@shared/schemas/messages";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ClientToServerEvents } from "@shared/types/socket";
import { BaseSocketHandler } from "../../../BaseSocketHandler";
import { AuthenticatedSocket } from "../../../socketHandlers";

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

type EditMessageData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.EDIT]
>[0];
type EditMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.EDIT]
>[1];

type DeleteMessageData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
>[0];
type DeleteMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
>[1];

type GetMessageRequestsData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET_MESSAGE_REQUESTS]
>[0];
type GetMessageRequestsCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET_MESSAGE_REQUESTS]
>[1];

type AcceptMessageRequestData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.ACCEPT_MESSAGE_REQUEST]
>[0];
type AcceptMessageRequestCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.ACCEPT_MESSAGE_REQUEST]
>[1];

type RejectMessageRequestData = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.REJECT_MESSAGE_REQUEST]
>[0];
type RejectMessageRequestCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.REJECT_MESSAGE_REQUEST]
>[1];

/**
 * Maps MongoDB _id field to id for client-side consumption
 */
const mapMessageId = (message: any): any => {
  const { _id, ...rest } = message;
  return {
    ...rest,
    id: _id,
  };
};

export class MessageHandlers extends BaseSocketHandler {
  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(MESSAGE_EVENTS.CREATE, (data, callback) =>
      this.createMessage(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.GET, (data, callback) =>
      this.getMessages(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.EDIT, (data, callback) =>
      this.editMessage(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.DELETE, (data, callback) =>
      this.deleteMessage(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.GET_MESSAGE_REQUESTS, (data, callback) =>
      this.getMessageRequests(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.ACCEPT_MESSAGE_REQUEST, (data, callback) =>
      this.acceptMessageRequest(socket, data, callback)
    );

    socket.on(MESSAGE_EVENTS.REJECT_MESSAGE_REQUEST, (data, callback) =>
      this.rejectMessageRequest(socket, data, callback)
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

      const {
        channelId,
        channelType,
        content,
        storageObjectIds,
        optimisticId,
      } = validation.data;

      // Prevent attachments for post channels
      if (
        channelType === "post" &&
        storageObjectIds &&
        storageObjectIds.length > 0
      ) {
        return callback({
          error: "File attachments are not allowed in post channels",
        });
      }

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

        // Increment refCount for all storageObjects used in message attachments
        await prisma.storageObject.updateMany({
          where: {
            id: { in: storageObjectIds },
          },
          data: {
            refCount: {
              increment: 1,
            },
          },
        });
      }

      // Create message
      const message = await Message.create({
        channelId,
        channelType,
        content,
        authorId: socket.userId,
        attachments,
      });

      // Convert MongoDB ObjectId to string and map _id to id
      const messageData = mapMessageId({
        ...message,
        _id: message._id.toString(),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        optimisticId, // Return the optimisticId so client can match and replace
      });

      // If this is a DM request channel, create a MessageRequest and notify the receiver
      if (channelType === "dm") {
        const dmChannel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { users: true, messageRequests: true },
        });

        if (dmChannel?.isRequest) {
          // Find the other user in the DM channel
          const receiverUser = dmChannel.users.find(
            (u) => u.userId !== socket.userId
          );

          if (receiverUser) {
            const receiverId = receiverUser.userId;

            // Only create a MessageRequest if one doesn't already exist from this sender to this receiver
            const existingRequest = await prisma.messageRequest.findFirst({
              where: {
                senderId: socket.userId,
                receiverId,
                channelId,
              },
            });

            if (!existingRequest) {
              const messageRequest = await prisma.messageRequest.create({
                data: {
                  senderId: socket.userId,
                  receiverId,
                  channelId,
                },
              });

              // Notify the receiver about the new message request
              this.io
                .to(`user:${receiverId}`)
                .emit(MESSAGE_EVENTS.MESSAGE_REQUEST_CREATED, {
                  id: messageRequest.id,
                  senderId: messageRequest.senderId,
                  receiverId: messageRequest.receiverId,
                  channelId: messageRequest.channelId,
                  createdAt: messageRequest.createdAt.toISOString(),
                });
            }
          }
        }
      }

      // Update totalUnreadMessages for DM and post channels
      if (channelType === "dm" || channelType === "post") {
        // Get all users currently viewing the channel (in the socket room)
        const roomName =
          channelType === "dm"
            ? `dm_channel:${channelId}`
            : `channel:${channelId}`;
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

      // Broadcast message based on channel type
      if (channelType === "dm") {
        // For DM channels, emit to user rooms instead of channel room
        // This allows sorting DMs by most recent message and updating unread counters
        // even when not viewing the channel

        // Get the DM channel to find both users
        const dmChannel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { users: true },
        });

        if (dmChannel) {
          // Emit to both users in the DM channel
          dmChannel.users.forEach((channelUser) => {
            this.io
              .to(`user:${channelUser.userId}`)
              .emit(MESSAGE_EVENTS.CREATED, messageData);
          });
        }
      } else {
        // For post channels, still emit to channel room
        this.io.to(`channel:${channelId}`).emit(MESSAGE_EVENTS.CREATED, messageData);
      }

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

      // Map _id to id for all messages
      const mappedMessages = messages.map(mapMessageId);

      callback({
        success: true,
        data: mappedMessages,
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to get messages",
      });
    }
  }

  private async editMessage(
    socket: AuthenticatedSocket,
    data: EditMessageData,
    callback: EditMessageCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = EditMessagePayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const {
        messageId,
        channelId,
        channelType,
        content,
        storageObjectIds,
      } = validation.data;

      // Prevent attachments for post channels
      if (
        channelType === "post" &&
        storageObjectIds &&
        storageObjectIds.length > 0
      ) {
        return callback({
          error: "File attachments are not allowed in post channels",
        });
      }

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
          error: "You can only edit your own messages",
        });
      }

      // Get old attachment storage object IDs
      const oldStorageObjectIds =
        message.attachments?.map((att) => att.storageObjectId) || [];
      const newStorageObjectIds = storageObjectIds || [];

      // Find attachments being removed (in old but not in new)
      const removedStorageObjectIds = oldStorageObjectIds.filter(
        (id) => !newStorageObjectIds.includes(id)
      );

      // Find attachments being added (in new but not in old)
      const addedStorageObjectIds = newStorageObjectIds.filter(
        (id) => !oldStorageObjectIds.includes(id)
      );

      // Decrement refCount for removed attachments
      if (removedStorageObjectIds.length > 0) {
        await prisma.storageObject.updateMany({
          where: {
            id: { in: removedStorageObjectIds },
          },
          data: {
            refCount: {
              decrement: 1,
            },
          },
        });
      }

      // Fetch StorageObject data from PostgreSQL for new attachments
      let attachments: Attachment[] = [];
      if (newStorageObjectIds.length > 0) {
        const storageObjects = await prisma.storageObject.findMany({
          where: {
            id: { in: newStorageObjectIds },
            status: "done", // Only allow completed uploads
          },
        });

        // Verify all StorageObjects exist and are ready
        if (storageObjects.length !== newStorageObjectIds.length) {
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

        // Increment refCount for newly added attachments
        if (addedStorageObjectIds.length > 0) {
          await prisma.storageObject.updateMany({
            where: {
              id: { in: addedStorageObjectIds },
            },
            data: {
              refCount: {
                increment: 1,
              },
            },
          });
        }
      }

      // Update the message
      const updated = await Message.update(messageId, {
        messageId,
        content,
        attachments,
      });

      if (!updated) {
        return callback({
          error: "Failed to update message",
        });
      }

      // Fetch the updated message
      const updatedMessage = await Message.findById(messageId);
      if (!updatedMessage) {
        return callback({
          error: "Failed to retrieve updated message",
        });
      }

      // Convert MongoDB ObjectId to string and map _id to id
      const messageData = mapMessageId({
        ...updatedMessage,
        _id: updatedMessage._id.toString(),
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
      });

      // Broadcast message edit based on channel type
      if (channelType === "dm") {
        // For DM channels, emit to user rooms
        const dmChannel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { users: true },
        });

        if (dmChannel) {
          // Emit to both users in the DM channel
          dmChannel.users.forEach((channelUser) => {
            this.io
              .to(`user:${channelUser.userId}`)
              .emit(MESSAGE_EVENTS.EDITED, messageData);
          });
        }
      } else {
        // For post channels, emit to channel room
        this.io.to(`channel:${channelId}`).emit(MESSAGE_EVENTS.EDITED, messageData);
      }

      callback({
        success: true,
        data: messageData,
      });
    } catch (error) {
      console.error("Error editing message:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to edit message",
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

      // Broadcast message deletion based on channel type
      const deletedData = {
        messageId,
        channelId,
        channelType,
      };

      if (channelType === "dm") {
        // For DM channels, emit to user rooms
        const dmChannel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { users: true },
        });

        if (dmChannel) {
          // Emit to both users in the DM channel
          dmChannel.users.forEach((channelUser) => {
            this.io
              .to(`user:${channelUser.userId}`)
              .emit(MESSAGE_EVENTS.DELETED, deletedData);
          });
        }
      } else {
        // For post channels, emit to channel room
        this.io.to(`channel:${channelId}`).emit(MESSAGE_EVENTS.DELETED, deletedData);
      }

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

  private async getMessageRequests(
    socket: AuthenticatedSocket,
    data: GetMessageRequestsData,
    callback: GetMessageRequestsCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Get all message requests where the current user is the receiver
      const messageRequests = await prisma.messageRequest.findMany({
        where: {
          receiverId: socket.userId,
          status: "pending",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Map to the response format
      const requests = messageRequests.map((request) => ({
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        channelId: request.channelId,
        createdAt: request.createdAt.toISOString(),
      }));

      callback({
        success: true,
        data: requests,
      });
    } catch (error) {
      console.error("Error getting message requests:", error);
      callback({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get message requests",
      });
    }
  }

  private async acceptMessageRequest(
    socket: AuthenticatedSocket,
    data: AcceptMessageRequestData,
    callback: AcceptMessageRequestCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validationResult = AcceptMessageRequestPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        return callback({
          error: validationResult.error.errors[0]?.message || "Invalid payload",
        });
      }

      const { messageRequestId } = validationResult.data;

      // Find the message request
      const messageRequest = await prisma.messageRequest.findUnique({
        where: { id: messageRequestId },
        include: {
          channel: {
            include: {
              users: true,
            },
          },
        },
      });

      if (!messageRequest) {
        return callback({
          error: "Message request not found",
        });
      }

      // Verify the current user is the receiver
      if (messageRequest.receiverId !== socket.userId) {
        return callback({
          error: "Unauthorized: You are not the receiver of this message request",
        });
      }

      // Verify the request is still pending
      if (messageRequest.status !== "pending") {
        return callback({
          error: `Message request has already been ${messageRequest.status}`,
        });
      }

      const updatedChannel = await prisma.$transaction(async (tx) => {

        // Update the message request status to accepted
        await prisma.messageRequest.update({
          where: { id: messageRequestId },
          data: { status: "accepted" },
        });

        // Update the channel's isRequest to false
        const updatedChannel = await prisma.channel.update({
          where: { id: messageRequest.channelId },
          data: { isRequest: false },
          include: {
            users: true,
          },
        });

        return updatedChannel;
      })

      callback({
        success: true,
        data: updatedChannel,
      });
    } catch (error) {
      console.error("Error accepting message request:", error);
      callback({
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept message request",
      });
    }
  }

  private async rejectMessageRequest(
    socket: AuthenticatedSocket,
    data: RejectMessageRequestData,
    callback: RejectMessageRequestCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validationResult = RejectMessageRequestPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        return callback({
          error: validationResult.error.errors[0]?.message || "Invalid payload",
        });
      }

      const { messageRequestId } = validationResult.data;

      // Find the message request
      const messageRequest = await prisma.messageRequest.findUnique({
        where: { id: messageRequestId },
      });

      if (!messageRequest) {
        return callback({
          error: "Message request not found",
        });
      }

      // Verify the current user is the receiver
      if (messageRequest.receiverId !== socket.userId) {
        return callback({
          error: "Unauthorized: You are not the receiver of this message request",
        });
      }

      // Verify the request is still pending
      if (messageRequest.status !== "pending") {
        return callback({
          error: `Message request has already been ${messageRequest.status}`,
        });
      }

      // Update the message request status to rejected
      await prisma.messageRequest.update({
        where: { id: messageRequestId },
        data: { status: "rejected" },
      });

      callback({
        success: true,
        data: { messageRequestId },
      });
    } catch (error) {
      console.error("Error rejecting message request:", error);
      callback({
        error:
          error instanceof Error
            ? error.message
            : "Failed to reject message request",
      });
    }
  }
}
