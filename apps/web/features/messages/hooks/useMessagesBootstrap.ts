"use client";

import { useSocket } from "@/contexts/socket";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useEffect, useRef } from "react";
import { useMessagesStore } from "../store/messagesStore";
import { fetchMessages } from "@/services/messagesService";
import { toast } from "sonner";

export const useMessagesBootstrap = (
  channelId: string,
  channelType: ChannelType,
  onLoadComplete?: () => void,
  onNewMessage?: () => void,
  aroundMessageId?: string
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
              m.id.startsWith("optimistic-") &&
              m.authorId === message.authorId &&
              m.content === message.content
          );

          if (optimisticMessage) {
            // Replace optimistic message with real one
            replaceOptimisticMessage(channelId, optimisticMessage.id, message);
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

  useEffect(() => {
    if (!channelId) return;

    const { clearChannel } = useMessagesStore.getState();

    // Build payload for initial messages load
    const basePayload: any = {
      channelId,
      channelType,
      limit: 50,
    };

    if (aroundMessageId) {
      // Reset messages for this channel when loading around a specific message
      clearChannel(channelId);
      basePayload.aroundMessageId = aroundMessageId;
    }

    fetchMessages(basePayload, {
      onSuccess: () => onLoadCompleteRef.current?.(),
      onError: (error) => toast.error(error),
    });
  }, [channelId, channelType, aroundMessageId]);

  useEffect(() => {
    if (!socket || !channelId || !channelType) return;

    // Skip socket listeners for DM channels - they're handled globally by useDMMessagesBootstrap
    if (channelType === "dm") return;

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    socket.on(MESSAGE_EVENTS.DELETED, handleMessageDeleted);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
      socket.off(MESSAGE_EVENTS.DELETED, handleMessageDeleted);
    };
  }, [socket, channelId, channelType]);
};
