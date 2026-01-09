import prisma from "@database/postgres";
import {
  GetUserProfilesPayloadSchema,
  UpdateUserProfilePayloadSchema,
} from "@shared/schemas";
import { USER_EVENTS } from "@shared/socketEvents";
import { ClientToServerEvents } from "@shared/types/socket";
import { Profile } from "@shared/types/responses";
import { BaseSocketHandler } from "../../../BaseSocketHandler";
import { AuthenticatedSocket } from "../../../socketHandlers";

// Extract types from ClientToServerEvents for type safety
type GetUserProfilesData = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.GET_PROFILES]
>[0];
type GetUserProfilesCallback = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.GET_PROFILES]
>[1];
type UpdateProfileData = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.UPDATE_PROFILE]
>[0];
type UpdateProfileCallback = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.UPDATE_PROFILE]
>[1];

export class UserHandlers extends BaseSocketHandler {
  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(USER_EVENTS.GET_PROFILES, (data, callback) =>
      this.getProfiles(socket, data, callback)
    );

    socket.on(USER_EVENTS.UPDATE_PROFILE, (data, callback) =>
      this.updateProfile(socket, data, callback)
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

  private async updateProfile(
    socket: AuthenticatedSocket,
    data: UpdateProfileData,
    callback: UpdateProfileCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = UpdateUserProfilePayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const {
        displayName,
        avatarURL,
        bannerURL,
        bannerColor,
        bio,
        pronouns,
        profileGradientStart,
        profileGradientEnd,
      } = validation.data;

      // Update the profile
      const updatedProfile = await prisma.profile.update({
        where: { userId: socket.userId },
        data: {
          displayName: displayName ?? undefined,
          avatarURL: avatarURL ?? undefined,
          bannerURL: bannerURL ?? undefined,
          bannerColor: bannerColor ?? undefined,
          bio: bio ?? undefined,
          pronouns: pronouns ?? undefined,
          profileGradientStart: profileGradientStart ?? undefined,
          profileGradientEnd: profileGradientEnd ?? undefined,
        },
      });

      // Emit profile update event to notify all clients
      this.emitProfileUpdated(updatedProfile);

      callback({
        success: true,
        data: updatedProfile,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    }
  }

  /**
   * Emit a profile update event to notify clients that a profile has been updated
   * @param profile - The updated profile
   */
  public emitProfileUpdated(profile: Profile): void {
    // Emit to the user's room so all their connected clients get the update
    this.io
      .to(`user:${profile.userId}`)
      .emit(USER_EVENTS.PROFILE_UPDATED, profile);

    // Also emit to all users since profiles are public and may be cached by other users
    // This ensures that any user who has this profile in their store gets the update
    this.io.emit(USER_EVENTS.PROFILE_UPDATED, profile);
  }
}
