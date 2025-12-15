import prisma from "@database/postgres";
import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../../../socketHandlers";
import {
  JoinChannelPayloadSchema,
  LeaveChannelPayloadSchema,
  MarkChannelAsReadPayloadSchema,
} from "@shared/schemas/dm";
import {
  ChannelWithUsers,
  ChannelUserWithProfile,
} from "@shared/types/responses";

// Extract types from ClientToServerEvents for type safety
type GetDMsListData = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_DMS_LIST]
>[0];
type GetDMsListCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_DMS_LIST]
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

export class ChannelHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(CHANNEL_EVENTS.GET_DMS_LIST, (data, callback) =>
      this.getDMChannels(socket, data, callback)
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
          users: {
            some: {
              userId: socket.userId,
            },
          },
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  profile: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Max 50 items
      });

      // Transform to match ChannelWithUsers type (flatten user.profile to profile)
      const channelsWithUsers: ChannelWithUsers[] = channels.map((channel) => {
        const { users, ...channelData } = channel;
        return {
          ...channelData,
          users: users.map((channelUser) => {
            const { user, ...channelUserData } = channelUser;
            return {
              ...channelUserData,
              profile: user.profile,
            } as ChannelUserWithProfile;
          }),
        };
      });

      cb({
        success: true,
        data: channelsWithUsers,
      });
    } catch (error) {
      console.error("Error getting DM channels list:", error);
      cb({ error: "Failed to get DM channels list" });
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

      // Check if channel exists and is a DM channel
      const channel = await prisma.channel.findUnique({
        where: { id: channelId, type: "dm" },
      });

      if (!channel) {
        cb({ error: "DM channel not found" });
        return;
      }

      // Check if user is a member of the channel (must be a member to join socket room)
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

      // Join socket room for broadcasting
      socket.join(`dm_channel:${channelId}`);

      // Broadcast to all users in the channel that this user joined the socket room
      this.io
        .to(`dm_channel:${channelId}`)
        .emit(CHANNEL_EVENTS.JOINED, { channelId });

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

      // Check if channel exists and is a DM channel
      const channel = await prisma.channel.findUnique({
        where: { id: channelId, type: "dm" },
      });

      if (!channel) {
        cb({ error: "Channel not found" });
        return;
      }

      // Leave socket room for this channel
      socket.leave(`dm_channel:${channelId}`);

      // Broadcast to all users in the channel that this user left the socket room
      this.io
        .to(`dm_channel:${channelId}`)
        .emit(CHANNEL_EVENTS.LEFT, { channelId });

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

      // Check if channel exists and is a DM channel
      const channel = await prisma.channel.findUnique({
        where: { id: channelId, type: "dm" },
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
