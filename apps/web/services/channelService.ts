import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socketService";
import {
  JoinChannelPayload,
  LeaveChannelPayload,
  MarkChannelAsReadPayload,
} from "@shared/schemas/dm";
import { ChannelWithUsers } from "@shared/types/responses";
import { ClientToServerEvents } from "@shared/types/socket";
import { useDMChannelsStore } from "@/stores/dmChannelStore";

type JoinChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.JOIN]
>[1];

type LeaveChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.LEAVE]
>[1];

type MarkChannelAsReadCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.MARK_AS_READ]
>[1];

type GetDMChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_DM_CHANNEL]
>[1];

/**
 * Get a DM channel with another user.
 * - First checks the local DM channel store for an existing channel with that user
 * - If not found, emits GET_DM_CHANNEL, stores the returned channel in the store, and returns it
 */
export const getDMChannel = (
  otherUserId: string
): Promise<ChannelWithUsers> => {
  return new Promise<ChannelWithUsers>((resolve, reject) => {
    const { dmChannels, addDMChannel } = useDMChannelsStore.getState();

    // Check if a DM channel with this user already exists in the store
    const existingChannel = Object.values(dmChannels).find(
      (channel) =>
        channel.type === "dm" &&
        channel.users?.some((user) => user.userId === otherUserId)
    );

    if (existingChannel) {
      resolve(existingChannel);
      return;
    }

    // Otherwise, ask the server to get or create the DM channel
    socketService.emit(
      CHANNEL_EVENTS.GET_DM_CHANNEL,
      { otherUserId },
      ((response) => {
        if (response.success && response.data) {
          const channel = response.data;
          addDMChannel(channel);
          resolve(channel);
        } else {
          const error = response.error || "Failed to get DM channel";
          reject(new Error(error));
        }
      }) as GetDMChannelCallback
    );
  });
};

/**
 * Join a channel socket room for receiving broadcasts
 * Works for both DM and post channels
 * @param payload - { channelId: string }
 * @param options - { onSuccess?: () => void, onError?: (error: string) => void }
 * @returns Promise that resolves with channelId or rejects with error
 */
export const startListeningChannelEvents = (
  payload: JoinChannelPayload,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }
): Promise<{ channelId: string }> => {
  return new Promise<{ channelId: string }>((resolve, reject) => {
    socketService.emit(CHANNEL_EVENTS.JOIN, payload, ((response) => {
      if (response.success && response.data) {
        options?.onSuccess?.();
        resolve(response.data);
      } else {
        const error = response.error || "Failed to join channel";
        options?.onError?.(error);
        reject(new Error(error));
      }
    }) as JoinChannelCallback);
  });
};

/**
 * Leave a channel socket room (stops receiving broadcasts)
 * Works for both DM and post channels
 * Note: This does not remove the user from the channel (ChannelUser record remains)
 * @param payload - { channelId: string }
 * @param options - { onSuccess?: () => void, onError?: (error: string) => void }
 * @returns Promise that resolves with channelId or rejects with error
 */
export const stopListeningChannelEvents = (
  payload: LeaveChannelPayload,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }
): Promise<LeaveChannelPayload> => {
  return new Promise<LeaveChannelPayload>((resolve, reject) => {
    socketService.emit(CHANNEL_EVENTS.LEAVE, payload, ((response) => {
      if (response.success && response.data) {
        options?.onSuccess?.();
        resolve(response.data);
      } else {
        const error = response.error || "Failed to leave channel";
        options?.onError?.(error);
        reject(new Error(error));
      }
    }) as LeaveChannelCallback);
  });
};

/**
 * Mark a channel as read (reset unread count to 0 and update lastReadAt)
 * Works for both DM and post channels
 * @param payload - { channelId: string }
 * @param options - { onSuccess?: () => void, onError?: (error: string) => void }
 * @returns Promise that resolves with channelId or rejects with error
 */
export const markChannelAsRead = (
  payload: MarkChannelAsReadPayload,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }
): Promise<{ channelId: string }> => {
  return new Promise<{ channelId: string }>((resolve, reject) => {
    socketService.emit(CHANNEL_EVENTS.MARK_AS_READ, payload, ((response) => {
      if (response.success && response.data) {
        options?.onSuccess?.();
        resolve(response.data);
      } else {
        const error = response.error || "Failed to mark channel as read";
        options?.onError?.(error);
        reject(new Error(error));
      }
    }) as MarkChannelAsReadCallback);
  });
};
