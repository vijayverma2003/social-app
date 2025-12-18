"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketContextProvider";
import { useChannelActions } from "@/features/dms/hooks/useChannelActions";
import { CHANNEL_EVENTS, MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useChannelsStore } from "../store/channelsStore";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/UserContextProvider";

export const useChannelsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { getDMChannelsList } = useChannelActions();
  const { incrementUnreadCount, resetUnreadCount } = useChannelsStore();
  const pathname = usePathname();
  const { user: currentUser } = useUser();

  useEffect(() => {
    if (!socket || !isConnected) return;
    getDMChannelsList();
  }, [socket, isConnected, getDMChannelsList]);

  // Listen for new messages in DM channels and update unread count
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
      (message) => {
        // Update unread count for DM and post channels
        if (message.channelType === "dm" || message.channelType === "post") {
          // Check if the current user is viewing this channel
          // For DM channels: /channels/@me/[channelId]
          // For post channels: /channels/[postId]/[channelId]
          const isViewingChannel =
            pathname === `/channels/@me/${message.channelId}` ||
            (pathname.includes(`/channels/`) &&
              pathname.endsWith(`/${message.channelId}`));

          // Only increment if:
          // 1. The message is not from the current user (authorId !== currentUser.id)
          // 2. The current user is not currently viewing this channel
          if (message.authorId !== currentUser.id && !isViewingChannel)
            incrementUnreadCount(message.channelId, message.authorId);
        }
      };

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    };
  }, [socket, incrementUnreadCount, pathname, currentUser]);

  // Listen for marked as read events and update store
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleMarkedAsRead: ServerToClientEvents[typeof CHANNEL_EVENTS.MARKED_AS_READ] =
      (data) => {
        resetUnreadCount(data.channelId, currentUser.id);
      };

    socket.on(CHANNEL_EVENTS.MARKED_AS_READ, handleMarkedAsRead);

    return () => {
      socket.off(CHANNEL_EVENTS.MARKED_AS_READ, handleMarkedAsRead);
    };
  }, [socket, resetUnreadCount, currentUser]);
};
