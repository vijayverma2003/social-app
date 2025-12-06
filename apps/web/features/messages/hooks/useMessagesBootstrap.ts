"use client";

import { useSocket } from "@/providers/SocketContextProvider";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useMessagesStore } from "../store/messagesStore";
import { useEffect } from "react";

export const useMessagesBootstrap = () => {
  const { socket } = useSocket();
  const { addMessage } = useMessagesStore();

  useEffect(() => {
    if (!socket) return;

    const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
      (message) => {
        addMessage(message.channelId, message);
      };

    socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);

    return () => {
      socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
    };
  }, [socket, addMessage]);
};
