import { USER_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socket";
import { GetUserProfilesPayload } from "@shared/types/users";
import { Profile } from "@shared/types/responses";
import { ClientToServerEvents } from "@shared/types/socket";
import { useProfilesStore } from "@/stores/profilesStore";

type GetUserProfilesCallback = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.GET_PROFILES]
>[1];

/**
 * Get user profiles by user IDs
 * Checks the store for existing profiles and only fetches missing ones
 * @param payload - { userIds: string[] } - Array of user IDs (max 100)
 * @returns Promise that resolves with array of user profiles or rejects with error
 */
export const getUserProfiles = (
  payload: GetUserProfilesPayload
): Promise<Profile[]> => {
  const store = useProfilesStore.getState();
  const { userIds } = payload;

  const existingProfiles = store.getProfiles(userIds);
  const existingUserIds = new Set(existingProfiles.map((p) => p.userId));

  const missingUserIds = userIds.filter((id) => !existingUserIds.has(id));

  if (missingUserIds.length === 0) return Promise.resolve(existingProfiles);

  // Fetch missing profiles from server
  return new Promise<Profile[]>((resolve, reject) => {
    socketService.emit(USER_EVENTS.GET_PROFILES, { userIds: missingUserIds }, ((
      response
    ) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        const fetchedProfiles = response.data;

        // Combine existing and newly fetched profiles
        const allProfiles: Profile[] = [
          ...existingProfiles,
          ...fetchedProfiles,
        ];

        resolve(allProfiles);
      } else {
        reject(new Error("Failed to get user profiles"));
      }
    }) as GetUserProfilesCallback);
  });
};
