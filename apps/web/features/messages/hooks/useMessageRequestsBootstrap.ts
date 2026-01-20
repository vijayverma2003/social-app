"use client";

import { useEffect } from "react";
import { useSocket } from "@/contexts/socket";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useMessageRequestsStore } from "../store/messageRequestsStore";

export const useMessageRequestsBootstrap = () => {
  const { socket } = useSocket();
  const { addRequest } = useMessageRequestsStore();

  useEffect(() => {
    if (!socket) return;

    const handleMessageRequestCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.MESSAGE_REQUEST_CREATED] =
      (request) => {
        addRequest(request);
      };

    socket.on(
      MESSAGE_EVENTS.MESSAGE_REQUEST_CREATED,
      handleMessageRequestCreated
    );

    return () => {
      socket.off(
        MESSAGE_EVENTS.MESSAGE_REQUEST_CREATED,
        handleMessageRequestCreated
      );
    };
  }, [socket, addRequest]);
};

