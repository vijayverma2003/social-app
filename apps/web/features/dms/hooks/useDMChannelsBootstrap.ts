"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketContextProvider";
import { useDMChannelActions } from "@/features/dms/hooks/useDMChannelActions";
import { CHANNEL_EVENTS, MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useDMChannelsStore } from "../store/dmChannelsStore";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/UserContextProvider";

export const useDMChannelsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { getDMChannelsList } = useDMChannelActions();
  const { incrementUnreadCount, resetUnreadCount } = useDMChannelsStore();
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
        // Only update unread count for DM channels
        if (message.channelType === "dm") {
          // Check if the current user is viewing this channel
          const isViewingChannel = pathname === `/dms/${message.channelId}`;

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
