"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getFriendRequests } from "@/services/friends";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import { useSocket } from "@/contexts/SocketContext";
import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";
import { FriendRequestsListResponse } from "@shared/types";

export const useFriendRequestsBootstrap = () => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const {
    setInitialRequests,
    setLoading,
    setError,
    addReceivedRequest,
    removeRequestById,
  } = useFriendRequestsStore();
  const { socket } = useSocket();

  useEffect(() => {
    let cancelled = false;

    const loadFriendRequests = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (cancelled) return;

        const response = await getFriendRequests(token || undefined);
        if (cancelled) return;

        setInitialRequests(response.data);
      } catch (error) {
        console.error("Failed to load friend requests:", error);
        if (!cancelled) {
          setError("Failed to load friend requests");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFriendRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceived = (request: FriendRequestsListResponse) => {
      addReceivedRequest(request);
    };

    const handleAccepted = (request: { requestId: string }) => {
      removeRequestById(request.requestId);
    };

    const handleRejected = (request: { requestId: string }) => {
      removeRequestById(request.requestId);
    };

    socket.on(FRIEND_REQUEST_EVENTS.RECEIVED, handleReceived);
    socket.on(FRIEND_REQUEST_EVENTS.ACCEPTED, handleAccepted);
    socket.on(FRIEND_REQUEST_EVENTS.REJECTED, handleRejected);

    return () => {
      socket.off(FRIEND_REQUEST_EVENTS.RECEIVED, handleReceived);
      socket.off(FRIEND_REQUEST_EVENTS.ACCEPTED, handleAccepted);
      socket.off(FRIEND_REQUEST_EVENTS.REJECTED, handleRejected);
    };
  }, [socket, addReceivedRequest, removeRequestById]);
};
