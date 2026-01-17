import { USER_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socketService";
import {
  GetUserProfilesPayload,
  UpdateUserProfilePayload,
} from "@shared/types/users";
import { Profile } from "@shared/types/responses";
import { ClientToServerEvents } from "@shared/types/socket";
import { useProfilesStore } from "@/stores/profilesStore";

type GetUserProfilesCallback = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.GET_PROFILES]
>[1];
type UpdateProfileCallback = Parameters<
  ClientToServerEvents[typeof USER_EVENTS.UPDATE_PROFILE]
>[1];

/**
 * Fetch user profiles by user IDs
 * Checks the store for existing profiles and only fetches missing ones
 * On success, updates the profilesStore with newly fetched profiles
 * @param payload - { userIds: string[] } - Array of user IDs (max 100)
 * @returns Promise that resolves with array of user profiles or rejects with error
 */
export const fetchUserProfiles = (
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

        // Update the store with newly fetched profiles
        store.addProfiles(fetchedProfiles);

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

/**
 * Update the current user's profile via socket
 * On success, updates the profilesStore with the updated profile
 * @param payload - UpdateUserProfilePayload - Profile fields to update
 * @returns Promise that resolves with the updated profile or rejects with error
 */
export const updateProfile = (
  payload: UpdateUserProfilePayload
): Promise<Profile> => {
  const store = useProfilesStore.getState();

  return new Promise<Profile>((resolve, reject) => {
    socketService.emit(USER_EVENTS.UPDATE_PROFILE, payload, ((response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success && response.data) resolve(response.data);
      else reject(new Error("Failed to update profile"));
    }) as UpdateProfileCallback);
  });
};

