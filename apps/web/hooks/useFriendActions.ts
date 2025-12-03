"use client";

import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/SocketContext";
import { FriendRequest } from "@database/postgres/generated/prisma/client";
import { useCallback } from "react";
import { FriendRequestResponse, SocketResponse } from "@shared/types";

export interface FriendRequestSocketResponse {
  success?: boolean;
  data?: FriendRequest;
  message?: string;
  error?: string;
}

export const useFriendActions = () => {
  const { emit } = useSocket();

  const sendFriendRequest = useCallback(
    (receiverTag: string) =>
      emit(FRIEND_REQUEST_EVENTS.SEND, {
        receiverTag,
      }) as Promise<SocketResponse<FriendRequestResponse>>,
    [emit]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) =>
      emit(FRIEND_REQUEST_EVENTS.ACCEPT, {
        requestId,
      }) as Promise<SocketResponse<FriendRequestResponse>>,
    [emit]
  );

  const rejectFriendRequest = useCallback(
    (requestId: string) =>
      emit(FRIEND_REQUEST_EVENTS.REJECT, {
        requestId,
      }) as Promise<SocketResponse<FriendRequestResponse>>,
    [emit]
  );

  const removeFriend = useCallback(
    (friendId: string) =>
      emit(FRIEND_REQUEST_EVENTS.REMOVE, {
        friendId,
      }) as Promise<SocketResponse<{ friendId: string }>>,
    [emit]
  );

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};
