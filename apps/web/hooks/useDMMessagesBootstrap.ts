"use client";

import { useSocket } from "@/contexts/socket";
import { useUser } from "@/providers/UserContextProvider";
import { usePathname } from "next/navigation";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { useMessagesStore } from "@/stores/messagesStore";
import { useEffect } from "react";

export const useDMMessagesBootstrap = () => {
  const { socket } = useSocket();
  const { user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
      (message) => {
        // Only handle DM messages
        if (message.channelType !== "dm") return;

        const channelId = message.channelId;
        const store = useDMChannelsStore.getState();
        const channel = store.dmChannels[channelId];

        // Update last message timestamp for sorting (always, even if channel not in store yet)
        const timestamp = new Date(message.createdAt).getTime();
        store.updateLastMessageTimestamp(channelId, timestamp);

        // Always add/update message in store to keep data fresh, even if not viewing
        const { addMessage, replaceOptimisticMessage } = useMessagesStore.getState();
        // Check if message has optimisticId (from server response)
        const optimisticId = (message as any).optimisticId;

        if (optimisticId) {
          // Replace optimistic message with real one
          replaceOptimisticMessage(channelId, optimisticId, message);
        } else {
          // Check if there's an optimistic message from the same author with similar content
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
            addMessage(channelId, message);
          }
        }

        // If channel exists in store, update unread count
        if (channel) {
          // Check if user is currently viewing this channel
          const isViewingChannel =
            pathname === `/channels/@me/${channelId}` ||
            (pathname.includes(`/channels/`) && pathname.endsWith(`/${channelId}`));

          // Update unread count if message is from another user and not viewing channel
          if (message.authorId !== user.id && !isViewingChannel) {
            store.incrementUnreadCount(channelId, message.authorId);
          }
        }
      };

    const handleMessageEdited: ServerToClientEvents[typeof MESSAGE_EVENTS.EDITED] =
      (message) => {
        // Only handle DM messages
        if (message.channelType !== "dm") return;

        const channelId = message.channelId;
        // Always update message in store to keep data fresh
        const { updateMessage } = useMessagesStore.getState();
        updateMessage(channelId, message.id, message);
      };

    const handleMessageDeleted: ServerToClientEvents[typeof MESSAGE_EVENTS.DELETED] =
      (data) => {
        // Only handle DM messages
        if (data.channelType !== "dm") return;

        const channelId = data.channelId;
        // Always remove message from store to keep data fresh
        const { removeMessage } = useMessagesStore.getState();
        removeMessage(channelId, data.messageId);
      };

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    socket.on(MESSAGE_EVENTS.EDITED, handleMessageEdited);
    socket.on(MESSAGE_EVENTS.DELETED, handleMessageDeleted);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
      socket.off(MESSAGE_EVENTS.EDITED, handleMessageEdited);
      socket.off(MESSAGE_EVENTS.DELETED, handleMessageDeleted);
    };
  }, [socket, user, pathname]);
};
