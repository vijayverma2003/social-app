import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socketService";
import {
  CreateMessagePayload,
  GetMessagesPayload,
  DeleteMessagePayload,
  EditMessagePayload,
  AcceptMessageRequestPayload,
  RejectMessageRequestPayload,
  MessageData,
} from "@shared/schemas/messages";
import { ClientToServerEvents } from "@shared/types/socket";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { MessageRequest } from "@/features/messages/store/messageRequestsStore";
import { fetchUserProfiles } from "./profilesService";
import { ChannelWithUsers } from "@shared/types/responses";
import { useDMChannelsStore } from "@/stores/dmChannelStore";

type CreateMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.CREATE]
>[1];

type GetMessagesCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET]
>[1];

type DeleteMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
>[1];

type EditMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.EDIT]
>[1];

type GetMessageRequestsCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET_MESSAGE_REQUESTS]
>[1];

type AcceptMessageRequestCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.ACCEPT_MESSAGE_REQUEST]
>[1];

type RejectMessageRequestCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.REJECT_MESSAGE_REQUEST]
>[1];

/**
 * Create a new message
 * @param payload - { channelId: string, channelType: "dm" | "post", content: string, storageObjectIds?: string[], optimisticId?: string }
 * @param options - { onComplete?: (messageId: string | null) => void, optimisticId?: string }
 * @returns Promise that resolves with the created message or rejects with error
 */
export const createMessage = (
  payload: CreateMessagePayload,
  options?: {
    onComplete?: (messageId: string | null) => void;
    optimisticId?: string;
  }
): Promise<MessageData> => {
  return new Promise<MessageData>((resolve, reject) => {
    const { markMessageAsError } = useMessagesStore.getState();

    socketService.emit(MESSAGE_EVENTS.CREATE, payload, ((response) => {
      if (response.success && response.data) {
        options?.onComplete?.(response.data.id);
        resolve(response.data);
      } else {
        if (options?.optimisticId) {
          markMessageAsError(
            payload.channelId,
            options.optimisticId,
            "Failed to send message, retry again."
          );
        }
        options?.onComplete?.(null);
        reject(new Error("Failed to create message"));
      }
    }) as CreateMessageCallback);
  });
};

/**
 * Fetch messages from a channel with pagination
 * Stores messages in the messages store automatically
 * @param payload - { channelId: string, channelType: "dm" | "post", limit?: number, before?: string }
 * @param options - { prepend?: boolean, onSuccess?: () => void, onError?: (error: string) => void }
 * @returns Promise that resolves with array of messages or rejects with error
 */
export const fetchMessages = (
  payload: GetMessagesPayload,
  options?: {
    prepend?: boolean;
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }
): Promise<MessageData[]> => {
  return new Promise<MessageData[]>((resolve, reject) => {
    const { setMessages, prependMessages, messagesByChannel } =
      useMessagesStore.getState();

    const messages = messagesByChannel[payload.channelId] || [];

    // If we already have messages and this is a basic initial load (no before/after/around),
    // reuse the cached messages instead of fetching again.
    const hasDirectionalParams =
      !!(payload.before || (payload as any).after || (payload as any).aroundMessageId);

    if (messages.length > 0 && !options?.prepend && !hasDirectionalParams) {
      options?.onSuccess?.();
      resolve(messages);
      return;
    }

    socketService.emit(MESSAGE_EVENTS.GET, payload, ((response) => {
      if (response.success && response.data) {
        if (options?.prepend) {
          prependMessages(payload.channelId, response.data);
        } else {
          setMessages(payload.channelId, response.data);
        }

        options?.onSuccess?.();
        resolve(response.data);
      } else {
        const error = response.error || "Failed to fetch messages";
        options?.onError?.(error);
        reject(new Error(error));
      }
    }) as GetMessagesCallback);
  });
};

/**
 * Delete a message from a channel
 * @param payload - { messageId: string, channelId: string, channelType: "dm" | "post" }
 * @param options - { onComplete?: (success: boolean) => void }
 * @returns Promise that resolves with success status or rejects with error
 */
export const deleteMessage = (
  payload: DeleteMessagePayload,
  options?: { onComplete?: (success: boolean) => void }
): Promise<{ messageId: string }> => {
  return new Promise<{ messageId: string }>((resolve, reject) => {
    const { removeMessage } = useMessagesStore.getState();

    socketService.emit(MESSAGE_EVENTS.DELETE, payload, ((response) => {
      if (response.success && response.data) {
        removeMessage(payload.channelId, response.data.messageId);
        options?.onComplete?.(true);
        resolve(response.data);
      } else {
        options?.onComplete?.(false);
        reject(new Error(response.error || "Failed to delete message"));
      }
    }) as DeleteMessageCallback);
  });
};

/**
 * Edit a message in a channel
 * @param payload - { messageId: string, channelId: string, channelType: "dm" | "post", content: string, storageObjectIds?: string[] }
 * @param options - { onComplete?: (success: boolean) => void }
 * @returns Promise that resolves with the updated message or rejects with error
 */
export const editMessage = (
  payload: EditMessagePayload,
  options?: { onComplete?: (success: boolean) => void }
): Promise<MessageData> => {
  return new Promise<MessageData>((resolve, reject) => {
    const { updateMessage, decrementPendingEditRequests } =
      useMessagesStore.getState();

    socketService.emit(MESSAGE_EVENTS.EDIT, payload, ((response) => {
      if (response.success && response.data) {
        updateMessage(payload.channelId, payload.messageId, response.data);
        decrementPendingEditRequests();
        options?.onComplete?.(true);
        resolve(response.data);
      } else {
        decrementPendingEditRequests();
        options?.onComplete?.(false);
        reject(new Error(response.error || "Failed to edit message"));
      }
    }) as EditMessageCallback);
  });
};

/**
 * Fetch message requests for the authenticated user
 * Also fetches profiles of users who sent the requests and stores them
 * @returns Promise that resolves with array of message requests or rejects with error
 */
export const fetchMessageRequests = (): Promise<MessageRequest[]> => {
  return new Promise<MessageRequest[]>((resolve, reject) => {
    socketService.emit(
      MESSAGE_EVENTS.GET_MESSAGE_REQUESTS,
      {},
      (async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        if (response.success && response.data) {
          const requests = response.data;
          const senderIds = requests.map((r) => r.senderId);

          // Fetch profiles for users who sent the requests (async, but don't block resolution)
          if (senderIds.length > 0) {
            try {
              await fetchUserProfiles({ userIds: senderIds });
            } catch (error) {
              console.error(
                "Failed to fetch user profiles for message requests:",
                error
              );
            }
          }

          resolve(requests);
        } else {
          reject(new Error("Failed to get message requests"));
        }
      }) as GetMessageRequestsCallback
    );
  });
};

/**
 * Accept a message request
 * Updates the message request status to accepted and sets channel.isRequest to false
 * Adds the DM channel to the dmChannelsStore on success
 * @param payload - { messageRequestId: string }
 * @returns Promise that resolves with the updated channel or rejects with error
 */
export const acceptMessageRequest = (
  payload: AcceptMessageRequestPayload
): Promise<ChannelWithUsers> => {
  return new Promise<ChannelWithUsers>((resolve, reject) => {
    socketService.emit(
      MESSAGE_EVENTS.ACCEPT_MESSAGE_REQUEST,
      payload,
      ((response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        if (response.success && response.data) {
          const channel = response.data;
          // Add the channel to the DM channels store
          const { addDMChannel } = useDMChannelsStore.getState();
          addDMChannel(channel);
          resolve(channel);
        } else {
          reject(new Error("Failed to accept message request"));
        }
      }) as AcceptMessageRequestCallback
    );
  });
};

/**
 * Reject a message request
 * Updates the message request status to rejected
 * @param payload - { messageRequestId: string }
 * @returns Promise that resolves with the message request ID or rejects with error
 */
export const rejectMessageRequest = (
  payload: RejectMessageRequestPayload
): Promise<{ messageRequestId: string }> => {
  return new Promise<{ messageRequestId: string }>((resolve, reject) => {
    socketService.emit(
      MESSAGE_EVENTS.REJECT_MESSAGE_REQUEST,
      payload,
      ((response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error("Failed to reject message request"));
        }
      }) as RejectMessageRequestCallback
    );
  });
};
