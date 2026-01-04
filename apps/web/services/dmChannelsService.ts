import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socket";
import { ChannelWithUsers } from "@shared/types/responses";
import { ClientToServerEvents } from "@shared/types/socket";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { fetchUserProfiles } from "./profilesService";

type GetDMsListCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_DMS_LIST]
>[1];

/**
 * Extract unique user IDs from DM channels
 * @param channels - Array of channels with users
 * @returns Array of unique user IDs
 */
const extractUserIdsFromChannels = (channels: ChannelWithUsers[]): string[] => {
  const userIds = new Set<string>();
  channels.forEach((channel) => {
    channel.users?.forEach((channelUser) => {
      if (channelUser.userId) {
        userIds.add(channelUser.userId);
      }
    });
  });
  return Array.from(userIds);
};

/**
 * Fetch DM channels for the authenticated user
 * Also fetches profiles of users in those channels and stores them
 * @returns Promise that resolves with array of DM channels or rejects with error
 */
export const fetchDMChannels = (): Promise<ChannelWithUsers[]> => {
  return new Promise<ChannelWithUsers[]>((resolve, reject) => {
    const { setDMChannels } = useDMChannelsStore.getState();
    socketService.emit(CHANNEL_EVENTS.GET_DMS_LIST, {}, (async (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      if (response.success && response.data) {
        const channels = response.data;
        const userIds = extractUserIdsFromChannels(channels);

        // Fetch profiles for users in DM channels (async, but don't block resolution)
        if (userIds.length > 0) {
          try {
            await fetchUserProfiles({ userIds });
          } catch (error) {
            console.error(
              "Failed to fetch user profiles for DM channels:",
              error
            );
          }
        }

        setDMChannels(channels);
        resolve(channels);
      } else {
        reject(new Error("Failed to get DM channels"));
      }
    }) as GetDMsListCallback);
  });
};
