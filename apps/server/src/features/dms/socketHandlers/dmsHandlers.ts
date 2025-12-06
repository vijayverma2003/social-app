import prisma from "@database/postgres";
import { DM_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../../../socketHandlers";
import {
  JoinDMChannelPayloadSchema,
  LeaveDMChannelPayloadSchema,
} from "@shared/schemas/dm";

// Extract types from ClientToServerEvents for type safety
type GetDMChannelsListData = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.GET_LIST]
>[0];
type GetDMChannelsListCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.GET_LIST]
>[1];

type JoinDMChannelData = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.JOIN]
>[0];
type JoinDMChannelCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.JOIN]
>[1];

type LeaveDMChannelData = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.LEAVE]
>[0];
type LeaveDMChannelCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.LEAVE]
>[1];

export class DMHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(DM_EVENTS.GET_LIST, (data, callback) =>
      this.getDMChannelsList(socket, data, callback)
    );

    socket.on(DM_EVENTS.JOIN, (data, callback) =>
      this.joinDMChannel(socket, data, callback)
    );

    socket.on(DM_EVENTS.LEAVE, (data, callback) =>
      this.leaveDMChannel(socket, data, callback)
    );
  }

  private async getDMChannelsList(
    socket: AuthenticatedSocket,
    data: GetDMChannelsListData,
    cb: GetDMChannelsListCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      // Get all DM channels where the user is a member
      const dmChannels = await prisma.dMChannel.findMany({
        where: {
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
                  id: true,
                  username: true,
                  discriminator: true,
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

      cb({
        success: true,
        data: dmChannels,
      });
    } catch (error) {
      console.error("Error getting DM channels list:", error);
      cb({ error: "Failed to get DM channels list" });
    }
  }

  private async joinDMChannel(
    socket: AuthenticatedSocket,
    data: JoinDMChannelData,
    cb: JoinDMChannelCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      const validationResult = JoinDMChannelPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
        return;
      }

      const { channelId } = validationResult.data;

      // Check if channel exists
      const channel = await prisma.dMChannel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        cb({ error: "DM channel not found" });
        return;
      }

      // Check if user is a member of the channel (must be a member to join socket room)
      const member = await prisma.dMChannelUser.findUnique({
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
        .emit(DM_EVENTS.JOINED, { channelId });

      cb({
        success: true,
        data: { channelId },
      });
    } catch (error) {
      console.error("Error joining DM channel socket room:", error);
      cb({ error: "Failed to join DM channel socket room" });
    }
  }

  private async leaveDMChannel(
    socket: AuthenticatedSocket,
    data: LeaveDMChannelData,
    cb: LeaveDMChannelCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      const validationResult = LeaveDMChannelPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
        return;
      }

      const { channelId } = validationResult.data;

      // Check if channel exists
      const channel = await prisma.dMChannel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        cb({ error: "DM channel not found" });
        return;
      }

      // Leave socket room for this channel
      socket.leave(`dm_channel:${channelId}`);

      // Broadcast to all users in the channel that this user left the socket room
      this.io.to(`dm_channel:${channelId}`).emit(DM_EVENTS.LEFT, { channelId });

      cb({
        success: true,
        data: { channelId },
      });
    } catch (error) {
      console.error("Error leaving DM channel socket room:", error);
      cb({ error: "Failed to leave DM channel socket room" });
    }
  }
}
