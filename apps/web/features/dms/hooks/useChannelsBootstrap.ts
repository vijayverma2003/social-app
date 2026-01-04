"use client";

import { useSocket } from "@/contexts/socket";
import { useUser } from "@/providers/UserContextProvider";
import { CHANNEL_EVENTS, MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useChannelsStore } from "../store/channelsStore";

export const useChannelsBootstrap = () => {
  const { socket } = useSocket();
  const { incrementUnreadCount, resetUnreadCount } = useChannelsStore();
  const pathname = usePathname();
  const { user: currentUser } = useUser();

  const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
    (message) => {
      // Update unread count for DM and post channels
      if (message.channelType === "dm" || message.channelType === "post") {
        const isViewingChannel =
          pathname === `/channels/@me/${message.channelId}` ||
          (pathname.includes(`/channels/`) &&
            pathname.endsWith(`/${message.channelId}`));

        if (message.authorId !== currentUser?.id && !isViewingChannel)
          incrementUnreadCount(message.channelId, message.authorId);
      }
    };

  const handleMarkedAsRead: ServerToClientEvents[typeof CHANNEL_EVENTS.MARKED_AS_READ] =
    (data) => {
      resetUnreadCount(data.channelId, currentUser?.id || "");
    };

  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    socket.on(CHANNEL_EVENTS.MARKED_AS_READ, handleMarkedAsRead);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
      socket.off(CHANNEL_EVENTS.MARKED_AS_READ, handleMarkedAsRead);
    };
  }, [socket, incrementUnreadCount, resetUnreadCount, pathname, currentUser]);
};
