import prisma from "@database/postgres";
import { DM_EVENTS } from "@shared/socketEvents";
import {
  DMChannelsListResponse,
  SocketResponse,
} from "@shared/types/responses";
import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socketHandlers";

export class DMHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(DM_EVENTS.GET_LIST, (data, callback) =>
      this.getDMChannelsList(socket, data, callback)
    );
  }

  private async getDMChannelsList(
    socket: AuthenticatedSocket,
    data: any,
    cb: (response: SocketResponse<DMChannelsListResponse>) => void
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
