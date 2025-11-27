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
  const { socket, isConnected } = useSocket();

  const emitSocketEvent = useCallback(
    (event: string, data: any): Promise<FriendRequestSocketResponse> => {
      return new Promise((resolve) => {
        if (!isConnected || !socket) {
          resolve({ error: "Socket not connected" });
          return;
        }

        socket.emit(event, data, (response: FriendRequestSocketResponse) => {
          resolve(response);
        });
      });
    },
    [socket, isConnected]
  );

  const sendFriendRequest = useCallback(
    (receiverTag: string) =>
      emitSocketEvent(FRIEND_REQUEST_EVENTS.SEND, { receiverTag }),
    [emitSocketEvent]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) =>
      emitSocketEvent(FRIEND_REQUEST_EVENTS.ACCEPT, { requestId }),
    [emitSocketEvent]
  );

  const rejectFriendRequest = useCallback(
    (requestId: string) =>
      emitSocketEvent(FRIEND_REQUEST_EVENTS.REJECT, { requestId }),
    [emitSocketEvent]
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
