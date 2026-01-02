import prisma from "@database/postgres";
import { GetUserProfilesPayloadSchema } from "@shared/schemas";
import { USER_EVENTS } from "@shared/socketEvents";
import { ClientToServerEvents } from "@shared/types/socket";
import { BaseSocketHandler } from "../../../BaseSocketHandler";
import { AuthenticatedSocket } from "../../../socketHandlers";

// Extract types from ClientToServerEvents for type safety
type GetUserProfilesData = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.GET_PROFILES]
>[0];
type GetUserProfilesCallback = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.GET_PROFILES]
>[1];

export class UserHandlers extends BaseSocketHandler {
  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(USER_EVENTS.GET_PROFILES, (data, callback) =>
      this.getProfiles(socket, data, callback)
    );
  }

  private async getProfiles(
    socket: AuthenticatedSocket,
    data: GetUserProfilesData,
    callback: GetUserProfilesCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = GetUserProfilesPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { userIds } = validation.data;

      // Fetch users with their profiles
      const profiles = await prisma.profile.findMany({
        where: {
          userId: { in: userIds },
        },
      });

      callback({
        success: true,
        data: profiles,
      });
    } catch (error) {
      console.error("Error getting user profiles:", error);
      callback({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get user profiles",
      });
    }
  }
}
