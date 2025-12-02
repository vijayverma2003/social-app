"use client";

import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/SocketContext";
import { FriendRequest } from "@/services/friends";
import { useCallback } from "react";

export interface FriendRequestSocketResponse {
  success?: boolean;
  data?: FriendRequest;
  message?: string;
  error?: string;
}

export const useFriendRequests = () => {
  const { emit } = useSocket();

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

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
};
