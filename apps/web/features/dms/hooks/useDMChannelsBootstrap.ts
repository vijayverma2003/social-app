"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketContextProvider";
import { useDMChannelActions } from "@/features/dms/hooks/useDMChannelActions";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useDMChannelsStore } from "../store/dmChannelsStore";

export const useDMChannelsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { getDMChannelsList } = useDMChannelActions();
  const { incrementUnreadCount } = useDMChannelsStore();

  useEffect(() => {
    if (!socket || !isConnected) return;
    getDMChannelsList();
  }, [socket, isConnected, getDMChannelsList]);

  // Listen for new messages in DM channels and update unread count
  useEffect(() => {
    if (!socket) return;

    const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
      (message) => {
        // Only update unread count for DM channels
        if (message.channelType === "dm") {
          // Increment unread count for all users except the message author
          incrementUnreadCount(message.channelId, message.authorId);
        }
      };

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    };
  }, [socket, incrementUnreadCount]);
};
