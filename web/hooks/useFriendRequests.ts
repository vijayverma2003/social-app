"use client";

import { FRIEND_REQUEST_EVENTS } from "@/../shared/socketEvents";
import { useSocket } from "@/contexts/SocketContext";
import { FriendRequest } from "@/services/friends";
import { useCallback, useEffect } from "react";

export interface FriendRequestSocketResponse {
  success?: boolean;
  data?: FriendRequest;
  message?: string;
  error?: string;
}

interface UseFriendRequestsCallbacks {
  onFriendRequestReceived: (request: FriendRequest) => void;
  onFriendRequestAccepted: (request: FriendRequest) => void;
  onFriendRequestRejected: (request: FriendRequest) => void;
}

export const useFriendRequests = ({
  onFriendRequestAccepted,
  onFriendRequestReceived,
  onFriendRequestRejected,
}: UseFriendRequestsCallbacks) => {
  const { socket, emit } = useSocket();

  const sendFriendRequest = useCallback(
    (receiverTag: string) => emit(FRIEND_REQUEST_EVENTS.SEND, { receiverTag }),
    [emit]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) => emit(FRIEND_REQUEST_EVENTS.ACCEPT, { requestId }),
    [emit]
  );

  const rejectFriendRequest = useCallback(
    (requestId: string) => emit(FRIEND_REQUEST_EVENTS.REJECT, { requestId }),
    [emit]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on(FRIEND_REQUEST_EVENTS.RECEIVED, onFriendRequestReceived);
    socket.on(FRIEND_REQUEST_EVENTS.ACCEPTED, onFriendRequestAccepted);
    socket.on(FRIEND_REQUEST_EVENTS.REJECTED, onFriendRequestRejected);

    return () => {
      socket.off(FRIEND_REQUEST_EVENTS.RECEIVED, onFriendRequestReceived);
      socket.off(FRIEND_REQUEST_EVENTS.ACCEPTED, onFriendRequestAccepted);
      socket.off(FRIEND_REQUEST_EVENTS.REJECTED, onFriendRequestRejected);
    };
  }, [socket]);

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
};
