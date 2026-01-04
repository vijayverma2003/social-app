import prisma from "@database/postgres";
import {
  JoinChannelPayloadSchema,
  LeaveChannelPayloadSchema,
  MarkChannelAsReadPayloadSchema,
} from "@shared/schemas/dm";
import { CHANNEL_EVENTS, POST_EVENTS } from "@shared/socketEvents";
import { ClientToServerEvents } from "@shared/types/socket";
import { BaseSocketHandler } from "../../../BaseSocketHandler";
import { AuthenticatedSocket } from "../../../socketHandlers";

// Extract types from ClientToServerEvents for type safety
type GetDMsListData = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_DMS_LIST]
>[0];
type GetDMsListCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_DMS_LIST]
>[1];

type GetPostsListData = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_POSTS_LIST]
>[0];
type GetPostsListCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_POSTS_LIST]
>[1];

type JoinChannelData = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.JOIN]
>[0];
type JoinChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.JOIN]
>[1];

type LeaveChannelData = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.LEAVE]
>[0];
type LeaveChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.LEAVE]
>[1];

type MarkChannelAsReadData = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.MARK_AS_READ]
>[0];
type MarkChannelAsReadCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.MARK_AS_READ]
>[1];

export class ChannelHandlers extends BaseSocketHandler {
  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(CHANNEL_EVENTS.GET_DMS_LIST, (data, callback) =>
      this.getDMChannels(socket, data, callback)
    );

    socket.on(CHANNEL_EVENTS.GET_POSTS_LIST, (data, callback) =>
      this.getPostChannels(socket, data, callback)
    );

    socket.on(CHANNEL_EVENTS.JOIN, (data, callback) =>
      this.joinChannelSocketRoom(socket, data, callback)
    );

    socket.on(CHANNEL_EVENTS.LEAVE, (data, callback) =>
      this.leaveChannelSocketRoom(socket, data, callback)
    );

    socket.on(CHANNEL_EVENTS.MARK_AS_READ, (data, callback) =>
      this.markChannelAsRead(socket, data, callback)
    );
  }

  private async getDMChannels(
    socket: AuthenticatedSocket,
    data: GetDMsListData,
    cb: GetDMsListCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      // Get all DM channels where the user is a member
      const channels = await prisma.channel.findMany({
        where: {
          type: "dm",
          users: { some: { userId: socket.userId } },
        },
        include: { users: true },
        orderBy: { createdAt: "desc" },
        take: 50, // Max 50 items
      });

      cb({
        success: true,
        data: channels,
      });
    } catch (error) {
      console.error("Error getting DM channels list:", error);
      cb({ error: "Failed to get DM channels list" });
    }
  }

  private async getPostChannels(
    socket: AuthenticatedSocket,
    data: GetPostsListData,
    cb: GetPostsListCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      // Get all post channels where the user is a member
      const channels = await prisma.channel.findMany({
        where: {
          type: "post",
          users: {
            some: {
              userId: socket.userId,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Max 50 items
      });

      cb({
        success: true,
        data: channels,
      });
    } catch (error) {
      console.error("Error getting post channels list:", error);
      cb({ error: "Failed to get post channels list" });
    }
  }

  private async joinChannelSocketRoom(
    socket: AuthenticatedSocket,
    data: JoinChannelData,
    cb: JoinChannelCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      const validationResult = JoinChannelPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
        return;
      }

      const { channelId } = validationResult.data;

      // Check if channel exists (can be DM or post channel)
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        cb({ error: "Channel not found" });
        return;
      }

      // For post channels, allow anyone to join (they can be added as members later)
      // For DM channels, check if user is a member
      if (channel.type === "dm") {
        const member = await prisma.channelUser.findUnique({
          where: {
            channelId_userId: {
              channelId,
              userId: socket.userId,
            },
          },
        });

        if (!member) {
          cb({ error: "User is not a member of this channel" });
          return;
        }
      } else if (channel.type === "post") {
        // For post channels, add user as member if not already a member
        await prisma.channelUser.upsert({
          where: {
            channelId_userId: {
              channelId,
              userId: socket.userId,
            },
          },
          create: {
            channelId,
            userId: socket.userId,
          },
          update: {},
        });

        // Find the post associated with this channel
        const post = await prisma.post.findFirst({
          where: { channelId },
          select: { id: true },
        });

        // Create RecentPosts record if post exists and user hasn't joined before
        if (post) {
          try {
            // Try to create the record - will fail if it already exists (unique constraint)
            await prisma.recentPosts.create({
              data: {
                postId: post.id,
                userId: socket.userId,
              },
            });

            // Only broadcast if we successfully created a new record
            this.io.emit(POST_EVENTS.RECENT_POST_ADDED, {
              postId: post.id,
              userId: socket.userId,
            });
          } catch (error: any) {
            // Handle unique constraint violation (P2002) - record already exists
            // This can happen due to race conditions when multiple requests try to create the same record
            if (error?.code === "P2002") {
              // Record already exists, which is fine - no need to broadcast or error
              // Continue with channel join flow
            } else console.error("Error adding recent post:", error);
          }
        }
      }

      // Join socket room for broadcasting based on channel type
      const roomName =
        channel.type === "dm"
          ? `dm_channel:${channelId}`
          : `channel:${channelId}`;
      socket.join(roomName);

      // Broadcast to all users in the channel that this user joined the socket room
      this.io.to(roomName).emit(CHANNEL_EVENTS.JOINED, { channelId });

      cb({
        success: true,
        data: { channelId },
      });
    } catch (error) {
      console.error("Error joining channel socket room:", error);
      cb({ error: "Failed to join channel socket room" });
    }
  }

  private async leaveChannelSocketRoom(
    socket: AuthenticatedSocket,
    data: LeaveChannelData,
    cb: LeaveChannelCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      const validationResult = LeaveChannelPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
        return;
      }

      const { channelId } = validationResult.data;

      // Check if channel exists
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        cb({ error: "Channel not found" });
        return;
      }

      // Leave socket room for this channel based on channel type
      const roomName =
        channel.type === "dm"
          ? `dm_channel:${channelId}`
          : `channel:${channelId}`;
      socket.leave(roomName);

      // Broadcast to all users in the channel that this user left the socket room
      this.io.to(roomName).emit(CHANNEL_EVENTS.LEFT, { channelId });

      cb({
        success: true,
        data: { channelId },
      });
    } catch (error) {
      console.error("Error leaving channel socket room:", error);
      cb({ error: "Failed to leave channel socket room" });
    }
  }

  private async markChannelAsRead(
    socket: AuthenticatedSocket,
    data: MarkChannelAsReadData,
    cb: MarkChannelAsReadCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      const validationResult = MarkChannelAsReadPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
        return;
      }

      const { channelId } = validationResult.data;

      // Check if channel exists
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        cb({ error: "Channel not found" });
        return;
      }

      // Check if user is a member of the channel
      const member = await prisma.channelUser.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId: socket.userId,
          },
        },
      });

      if (!member) {
        cb({ error: "User is not a member of this channel" });
        return;
      }

      // Update lastReadAt and reset totalUnreadMessages to 0
      await prisma.channelUser.update({
        where: {
          channelId_userId: {
            channelId,
            userId: socket.userId,
          },
        },
        data: {
          lastReadAt: new Date(),
          totalUnreadMessages: 0,
        },
      });

      // Broadcast to the user that the channel was marked as read
      this.io.to(`user:${socket.userId}`).emit(CHANNEL_EVENTS.MARKED_AS_READ, {
        channelId,
      });

      cb({
        success: true,
        data: { channelId },
      });
    } catch (error) {
      console.error("Error marking channel as read:", error);
      cb({ error: "Failed to mark channel as read" });
    }
  }
}
