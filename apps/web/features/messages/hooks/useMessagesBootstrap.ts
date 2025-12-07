"use client";

import { useSocket } from "@/providers/SocketContextProvider";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useMessagesStore } from "../store/messagesStore";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ChannelType } from "@shared/schemas/messages";

export const useMessagesBootstrap = (
  channelId: string,
  channelType: ChannelType,
  onLoadComplete?: () => void,
  onNewMessage?: () => void
) => {
  const { socket, emit } = useSocket();
  const { addMessage, setMessages } = useMessagesStore();

  const loadMessages = useCallback(
    (channelId: string, channelType: ChannelType) => {
      emit(
        MESSAGE_EVENTS.GET,
        {
          channelId,
          channelType,
          limit: 100,
          before: undefined,
        },
        (response) => {
          console.log(response);
          if (response.error) toast.error("Failed to load messages");
          else if (response.success && response.data) {
            setMessages(channelId, response.data);
            onLoadComplete?.();
          }
        }
      );
    },
    [emit, setMessages, onLoadComplete]
  );

  useEffect(() => {
    if (!socket || !channelId || !channelType) return;

    const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
      (message) => {
        if (message.channelId === channelId) {
          addMessage(message.channelId, message);
          onNewMessage?.();
        }
      };

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    loadMessages(channelId, channelType);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    };
  }, [socket, channelId, channelType, addMessage, loadMessages, onNewMessage]);
};
