"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSocket } from "@/contexts/socket";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useMessageRequestsStore } from "../../../stores/messageRequestsStore";
import { fetchMessageRequests } from "@/services/messagesService";
import { toast } from "sonner";

export const useMessageRequestsBootstrap = () => {
  const { socket } = useSocket();
  const { isSignedIn } = useAuth();
  const { addRequest, setInitialRequests } = useMessageRequestsStore();

  // Load initial message requests
  useEffect(() => {
    if (!isSignedIn) return;

    const loadMessageRequests = async () => {
      try {
        const requests = await fetchMessageRequests();
        setInitialRequests(requests);
      } catch (error) {
        console.error("Failed to load message requests:", error);
        toast.error("Failed to load message requests");
      }
    };

    loadMessageRequests();
  }, [isSignedIn, setInitialRequests]);

  // Listen for new message requests
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

