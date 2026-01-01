"use client";

import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/socket";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import {
  CreateMessagePayload,
  GetMessagesPayload,
  DeleteMessagePayload,
} from "@shared/schemas/messages";
import { useMessagesStore } from "../store/messagesStore";
import { toast } from "sonner";

type CreateMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.CREATE]
>[1];

type GetMessagesCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET]
>[1];

type DeleteMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.DELETE]
>[1];

export const useMessageActions = () => {
  const { emit } = useSocket();
  const {
    setMessages,
    addMessage,
    prependMessages,
    removeMessage,
    replaceOptimisticMessage,
    markMessageAsError,
  } = useMessagesStore();

  const createMessage = useCallback(
    (
      payload: CreateMessagePayload,
      onComplete?: (messageId: string | null) => void,
      optimisticId?: string
    ) => {
      emit(MESSAGE_EVENTS.CREATE, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to send message", {
            description: response.error,
          });
          // Mark optimistic message as error instead of removing
          if (optimisticId) {
            markMessageAsError(
              payload.channelId,
              optimisticId,
              response.error || "Failed to send message. Click to retry."
            );
          }
          onComplete?.(null);
        } else if (response.success && response.data) {
          // Use optimisticId from response if available, otherwise use the one passed in
          const idToReplace =
            (response.data as any).optimisticId || optimisticId;
          if (idToReplace) {
            replaceOptimisticMessage(
              payload.channelId,
              idToReplace,
              response.data
            );
          } else {
            addMessage(payload.channelId, response.data);
          }
          onComplete?.(response.data._id);
        } else {
          // Mark optimistic message as error if no data returned
          if (optimisticId) {
            markMessageAsError(
              payload.channelId,
              optimisticId,
              "Failed to send message. Click to retry."
            );
          }
          onComplete?.(null);
        }
      }) as CreateMessageCallback);
    },
    [
      emit,
      addMessage,
      removeMessage,
      replaceOptimisticMessage,
      markMessageAsError,
    ]
  );

  const getMessages = useCallback(
    (
      payload: GetMessagesPayload,
      options?: { prepend?: boolean; onSuccess?: () => void }
    ) => {
      emit(MESSAGE_EVENTS.GET, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to load messages", {
            description: response.error,
          });
        } else if (response.success && response.data) {
          if (options?.prepend) {
            prependMessages(payload.channelId, response.data);
          } else {
            setMessages(payload.channelId, response.data);
          }
          options?.onSuccess?.();
        }
      }) as GetMessagesCallback);
    },
    [emit, setMessages, prependMessages]
  );

  const deleteMessage = useCallback(
    (
      payload: DeleteMessagePayload,
      onComplete?: (success: boolean) => void
    ) => {
      emit(MESSAGE_EVENTS.DELETE, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to delete message", {
            description: response.error,
          });
          onComplete?.(false);
        } else if (response.success && response.data) {
          removeMessage(payload.channelId, response.data.messageId);
          onComplete?.(true);
        } else {
          onComplete?.(false);
        }
      }) as DeleteMessageCallback);
    },
    [emit, removeMessage]
  );

  return {
    createMessage,
    getMessages,
    deleteMessage,
  };
};
