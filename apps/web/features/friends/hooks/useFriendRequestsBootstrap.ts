"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getFriendRequests } from "@/features/friends/services/friends";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { useSocket } from "@/providers/SocketContextProvider";
import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { toast } from "sonner";

export const useFriendRequestsBootstrap = () => {
  const { getToken } = useAuth();
  const {
    setInitialRequests,
    setLoading,
    addReceivedRequest,
    removeRequestById,
  } = useFriendRequestsStore();
  const { socket } = useSocket();

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await getFriendRequests(token || undefined);
      setInitialRequests(response.data);
    } catch (error) {
      toast.error("Failed to load friend requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceived: ServerToClientEvents[typeof FRIEND_REQUEST_EVENTS.RECEIVED] =
      (request) => {
        addReceivedRequest(request);
      };

    const handleAccepted: ServerToClientEvents[typeof FRIEND_REQUEST_EVENTS.ACCEPTED] =
      (request) => {
        removeRequestById(request.requestId);
      };

    const handleRejected: ServerToClientEvents[typeof FRIEND_REQUEST_EVENTS.REJECTED] =
      (request) => {
        removeRequestById(request.requestId);
      };

    const handleCanceled: ServerToClientEvents[typeof FRIEND_REQUEST_EVENTS.CANCELED] =
      (request) => {
        removeRequestById(request.requestId);
      };

    socket.on(FRIEND_REQUEST_EVENTS.RECEIVED, handleReceived);
    socket.on(FRIEND_REQUEST_EVENTS.ACCEPTED, handleAccepted);
    socket.on(FRIEND_REQUEST_EVENTS.REJECTED, handleRejected);
    socket.on(FRIEND_REQUEST_EVENTS.CANCELED, handleCanceled);

    return () => {
      socket.off(FRIEND_REQUEST_EVENTS.RECEIVED, handleReceived);
      socket.off(FRIEND_REQUEST_EVENTS.ACCEPTED, handleAccepted);
      socket.off(FRIEND_REQUEST_EVENTS.REJECTED, handleRejected);
      socket.off(FRIEND_REQUEST_EVENTS.CANCELED, handleCanceled);
    };
  }, [socket, addReceivedRequest, removeRequestById]);
};
