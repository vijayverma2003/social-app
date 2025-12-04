import prisma from "@database/postgres";
import { DM_EVENTS } from "@shared/socketEvents";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "../socketHandlers";

// Extract types from ClientToServerEvents for type safety
type GetDMChannelsListData = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.GET_LIST]
>[0];
type GetDMChannelsListCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.GET_LIST]
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
  }

  private async getDMChannelsList(
    socket: AuthenticatedSocket,
    data: GetDMChannelsListData,
    cb: GetDMChannelsListCallback
  ) {
    try {
      if (!socket.userId) return cb({ error: "Unauthorized" });

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
}
