"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { FRIEND_REQUEST_EVENTS } from "@/../shared/socketEvents";

interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
}

interface SocketResponse {
  success?: boolean;
  data?: FriendRequest;
  message?: string;
  error?: string;
}

interface UseFriendRequestsCallbacks {
  onFriendRequestReceived?: (request: FriendRequest) => void;
  onFriendRequestAccepted?: (request: FriendRequest) => void;
  onFriendRequestRejected?: (request: FriendRequest) => void;
}

export const useFriendRequests = (callbacks?: UseFriendRequestsCallbacks) => {
  const { socket, isConnected } = useSocket();
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const emitSocketEvent = useCallback(
    (event: string, data: any): Promise<SocketResponse> => {
      return new Promise((resolve) => {
        if (!isConnected || !socket) {
          resolve({ error: "Socket not connected" });
          return;
        }

        socket.emit(event, data, (response: SocketResponse) => {
          resolve(response);
        });
      });
    },
    [socket, isConnected]
  );

  const sendFriendRequest = useCallback(
    (receiverId: string) =>
      emitSocketEvent(FRIEND_REQUEST_EVENTS.SEND, { receiverId }),
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

    const handleReceived = (request: FriendRequest) =>
      callbacksRef.current?.onFriendRequestReceived?.(request);

    const handleAccepted = (request: FriendRequest) =>
      callbacksRef.current?.onFriendRequestAccepted?.(request);

    const handleRejected = (request: FriendRequest) =>
      callbacksRef.current?.onFriendRequestRejected?.(request);

    socket.on(FRIEND_REQUEST_EVENTS.RECEIVED, handleReceived);
    socket.on(FRIEND_REQUEST_EVENTS.ACCEPTED, handleAccepted);
    socket.on(FRIEND_REQUEST_EVENTS.REJECTED, handleRejected);

    return () => {
      socket.off(FRIEND_REQUEST_EVENTS.RECEIVED, handleReceived);
      socket.off(FRIEND_REQUEST_EVENTS.ACCEPTED, handleAccepted);
      socket.off(FRIEND_REQUEST_EVENTS.REJECTED, handleRejected);
    };
  }, [socket]);

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
};
