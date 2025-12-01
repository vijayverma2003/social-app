"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { friendsService, type FriendRequest } from "@/services/friends";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import { useSocket } from "@/contexts/SocketContext";
import { FRIEND_REQUEST_EVENTS } from "@/../shared/socketEvents";

export const useFriendRequestsBootstrap = () => {
  const { getToken, isSignedIn } = useAuth();
  const {
    setInitialRequests,
    setLoading,
    setError,
    addReceivedRequest,
    removeRequestById,
  } = useFriendRequestsStore();
  const { socket } = useSocket();

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    const loadFriendRequests = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const data = await friendsService.getFriendRequests(token || undefined);
        if (cancelled) return;
        setInitialRequests(data.incoming, data.outgoing);
      } catch (error) {
        console.error("Failed to load friend requests:", error);
        if (cancelled) return;
        setError("Failed to load friend requests");
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
  }, [getToken, isSignedIn, setInitialRequests, setLoading, setError]);

  useEffect(() => {
    if (!socket) return;

    const handleReceived = (request: FriendRequest) => {
      addReceivedRequest(request);
    };

    const handleAccepted = (request: FriendRequest) => {
      removeRequestById(request._id);
    };

    const handleRejected = (request: FriendRequest) => {
      removeRequestById(request._id);
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
