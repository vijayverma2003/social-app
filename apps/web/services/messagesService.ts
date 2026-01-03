import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socket";
import {
  CreateMessagePayload,
  GetMessagesPayload,
  DeleteMessagePayload,
  MessageData,
} from "@shared/schemas/messages";
import { ClientToServerEvents } from "@shared/types/socket";
import { useMessagesStore } from "@/features/messages/store/messagesStore";

type CreateMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.CREATE]
>[1];

type GetMessagesCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET]
>[1];

type DeleteMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
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
 * Get messages from a channel with pagination
 * @param payload - { channelId: string, channelType: "dm" | "post", limit?: number, before?: string }
 * @param options - { prepend?: boolean, onSuccess?: () => void }
 * @returns Promise that resolves with array of messages or rejects with error
 */
export const getMessages = (
  payload: GetMessagesPayload,
  options?: { prepend?: boolean; onSuccess?: () => void }
): Promise<MessageData[]> => {
  return new Promise<MessageData[]>((resolve, reject) => {
    const { setMessages, prependMessages } = useMessagesStore.getState();

    socketService.emit(MESSAGE_EVENTS.GET, payload, ((response) => {
      if (response.success && response.data) {
        if (options?.prepend) prependMessages(payload.channelId, response.data);
        else setMessages(payload.channelId, response.data);

        options?.onSuccess?.();
        resolve(response.data);
      } else {
        reject(new Error(response.error || "Failed to get messages"));
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
