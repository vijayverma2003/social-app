"use client";

import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import {
  CreateMessagePayload,
  GetMessagesPayload,
} from "@shared/schemas/messages";
import { useMessagesStore } from "../store/messagesStore";
import { toast } from "sonner";

type CreateMessageCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.CREATE]
>[1];

type GetMessagesCallback = Parameters<
  ClientToServerEvents[typeof MESSAGE_EVENTS.GET]
>[1];

export const useMessageActions = () => {
  const { emit } = useSocket();
  const { setMessages, addMessage, prependMessages } = useMessagesStore();

  const createMessage = useCallback(
    (
      payload: CreateMessagePayload,
      onComplete?: (messageId: string | null) => void
    ) => {
      emit(MESSAGE_EVENTS.CREATE, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to send message", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          addMessage(payload.channelId, response.data);
          onComplete?.(response.data._id);
        } else {
          onComplete?.(null);
        }
      }) as CreateMessageCallback);
    },
    [emit, addMessage]
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

  return {
    createMessage,
    getMessages,
  };
};
