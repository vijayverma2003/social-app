"use client";

import { useSocket } from "@/contexts/socket";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useMessagesStore } from "../store/messagesStore";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ChannelType } from "@shared/schemas/messages";

export const useMessagesBootstrap = (
  channelId: string,
  channelType: ChannelType,
  onLoadComplete?: () => void,
  onNewMessage?: () => void
) => {
  const { socket, emit } = useSocket();
  const { addMessage, setMessages, removeMessage, replaceOptimisticMessage } =
    useMessagesStore();

  // Use refs to store callbacks to prevent unnecessary re-renders
  const onLoadCompleteRef = useRef(onLoadComplete);
  const onNewMessageRef = useRef(onNewMessage);

  // Update refs when callbacks change
  useEffect(() => {
    onLoadCompleteRef.current = onLoadComplete;
  }, [onLoadComplete]);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

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
            onLoadCompleteRef.current?.();
          }
        }
      );
    },
    [emit, setMessages]
  );

  useEffect(() => {
    if (!socket || !channelId || !channelType) return;

    const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
      (message) => {
        if (message.channelId === channelId) {
          // Check if message has optimisticId (from server response)
          const optimisticId = (message as any).optimisticId;

          if (optimisticId) {
            // Replace optimistic message with real one using the optimisticId
            replaceOptimisticMessage(channelId, optimisticId, message);
          } else {
            // Fallback: Check if there's an optimistic message from the same author with similar content
            const existingMessages =
              useMessagesStore.getState().messagesByChannel[channelId] || [];
            const optimisticMessage = existingMessages.find(
              (m) =>
                m._id.startsWith("optimistic-") &&
                m.authorId === message.authorId &&
                m.content === message.content
            );

            if (optimisticMessage) {
              // Replace optimistic message with real one
              replaceOptimisticMessage(
                channelId,
                optimisticMessage._id,
                message
              );
            } else {
              // No matching optimistic message, just add it
              addMessage(message.channelId, message);
            }
          }
          onNewMessageRef.current?.();
        }
      };

    const handleMessageDeleted: ServerToClientEvents[typeof MESSAGE_EVENTS.DELETED] =
      (data) => {
        if (data.channelId === channelId) {
          removeMessage(data.channelId, data.messageId);
        }
      };

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    socket.on(MESSAGE_EVENTS.DELETED, handleMessageDeleted);
    loadMessages(channelId, channelType);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
      socket.off(MESSAGE_EVENTS.DELETED, handleMessageDeleted);
    };
  }, [socket, channelId, channelType, loadMessages]);
};
