"use client";

import { FRIEND_REQUEST_EVENTS, FRIEND_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/socket";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import { toast } from "sonner";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { useFriendsStore } from "@/features/friends/store/friendsStore";

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
  const { removeRequestById, addSentRequest } = useFriendRequestsStore();
  const { removeFriendById } = useFriendsStore();

  const sendFriendRequest = useCallback(
    (receiverTag: string, onSuccess: () => void) => {
      emit(FRIEND_REQUEST_EVENTS.SEND, { receiverTag }, ((response) => {
        if (response.error) {
          toast.error("Failed to send friend request", {
            description: response.error,
          });
        } else if (response.success && response.data) {
          addSentRequest(response.data);
          onSuccess();
        }
      }) as SendFriendRequestCallback);
    },
    [emit, addSentRequest]
  );

  const sendFriendRequestByUserId = useCallback(
    (receiverId: string, onSuccess?: () => void) => {
      emit(FRIEND_REQUEST_EVENTS.SEND, { receiverId }, ((response) => {
        if (response.error) {
          toast.error("Failed to send friend request", {
            description: response.error,
          });
        } else if (response.success && response.data) {
          addSentRequest(response.data);
        }
        onSuccess?.();
      }) as SendFriendRequestCallback);
    },
    [emit, addSentRequest]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) => {
      emit(FRIEND_REQUEST_EVENTS.ACCEPT, { requestId }, ((response) => {
        if (response.error) {
          toast.error("Failed to accept friend request", {
            description: response.error,
          });
        } else removeRequestById(requestId);
      }) as AcceptFriendRequestCallback);
    },
    [emit, removeRequestById]
  );

  const rejectFriendRequest = useCallback(
    (requestId: string) => {
      emit(FRIEND_REQUEST_EVENTS.REJECT, { requestId }, ((response) => {
        if (response.error) {
          toast.error("Failed to reject friend request", {
            description: response.error,
          });
        } else removeRequestById(requestId);
      }) as RejectFriendRequestCallback);
    },
    [emit, removeRequestById]
  );

  const cancelFriendRequest = useCallback(
    (requestId: string) => {
      emit(FRIEND_REQUEST_EVENTS.CANCEL, { requestId }, ((response) => {
        if (response.error) {
          toast.error("Failed to cancel friend request", {
            description: response.error,
          });
        } else removeRequestById(requestId);
      }) as CancelFriendRequestCallback);
    },
    [emit, removeRequestById]
  );

  const removeFriend = useCallback(
    (friendId: string) => {
      emit(FRIEND_EVENTS.REMOVE, { friendId }, ((response) => {
        if (response.error || !response.success) {
          const errorMessage = response.error || "Failed to remove friend";
          toast.error(errorMessage);
        } else removeFriendById(friendId);
      }) as RemoveFriendCallback);
    },
    [emit, removeFriendById]
  );

  return {
    sendFriendRequest,
    sendFriendRequestByUserId,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
  };
};
