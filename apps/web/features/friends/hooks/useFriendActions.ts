"use client";

import { FRIEND_REQUEST_EVENTS, FRIEND_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";

// Extract callback types from ClientToServerEvents
type SendFriendRequestCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_REQUEST_EVENTS.SEND]
>[1];
type AcceptFriendRequestCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_REQUEST_EVENTS.ACCEPT]
>[1];
type RejectFriendRequestCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_REQUEST_EVENTS.REJECT]
>[1];
type CancelFriendRequestCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_REQUEST_EVENTS.CANCEL]
>[1];
type RemoveFriendCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_EVENTS.REMOVE]
>[1];

export const useFriendActions = () => {
  const { emit } = useSocket();

  const sendFriendRequest = useCallback(
    (receiverTag: string, callback: SendFriendRequestCallback) => {
      emit(FRIEND_REQUEST_EVENTS.SEND, { receiverTag }, callback);
    },
    [emit]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string, callback: AcceptFriendRequestCallback) => {
      emit(FRIEND_REQUEST_EVENTS.ACCEPT, { requestId }, callback);
    },
    [emit]
  );

  const rejectFriendRequest = useCallback(
    (requestId: string, callback: RejectFriendRequestCallback) => {
      emit(FRIEND_REQUEST_EVENTS.REJECT, { requestId }, callback);
    },
    [emit]
  );

  const cancelFriendRequest = useCallback(
    (requestId: string, callback: CancelFriendRequestCallback) => {
      emit(FRIEND_REQUEST_EVENTS.CANCEL, { requestId }, callback);
    },
    [emit]
  );

  const removeFriend = useCallback(
    (friendId: string, callback: RemoveFriendCallback) => {
      emit(FRIEND_EVENTS.REMOVE, { friendId }, callback);
    },
    [emit]
  );

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
  };
};
