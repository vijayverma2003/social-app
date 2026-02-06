import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socketService";
import {
  GetPostChannelPayload,
  JoinChannelPayload,
  LeaveChannelPayload,
  MarkChannelAsReadPayload,
} from "@shared/schemas/dm";
import { Channel } from "@shared/types/responses";
import { ClientToServerEvents } from "@shared/types/socket";
import { usePostChannelsStore } from "@/stores/postChannelStore";

type JoinChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.JOIN]
>[1];

type GetPostChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.GET_POST_CHANNEL]
>[1];

type LeaveChannelCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.LEAVE]
>[1];

type MarkChannelAsReadCallback = Parameters<
  ClientToServerEvents[typeof CHANNEL_EVENTS.MARK_AS_READ]
>[1];

/**
 * Get a post channel by channel ID.
 * Checks postChannelStore first; if not found, emits GET_POST_CHANNEL and stores the result.
 * @param channelId - The channel ID
 * @returns Promise that resolves with the Channel or rejects with error
 */
export const getPostChannel = (channelId: string): Promise<Channel> => {
  return new Promise<Channel>((resolve, reject) => {
    const { postChannels, addPostChannel } = usePostChannelsStore.getState();
    const existing = postChannels[channelId];

    if (existing) {
      resolve(existing);
      return;
    }
    socketService.emit(
      CHANNEL_EVENTS.GET_POST_CHANNEL,
      { channelId } as GetPostChannelPayload,
      ((response) => {
        if (response.success && response.data) {
          addPostChannel(response.data);
          resolve(response.data);
        } else {
          reject(new Error(response.error || "Failed to get post channel"));
        }
      }) as GetPostChannelCallback
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
