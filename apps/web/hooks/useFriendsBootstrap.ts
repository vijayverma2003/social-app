"use client";

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useFriendsStore } from "@/store/friendsStore";
import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";

export const useFriendsBootstrap = () => {
  const { socket } = useSocket();
  const { removeFriendById } = useFriendsStore();

  useEffect(() => {
    if (!socket) return;

    const handleRemoved = (data: { friendId: string; userId: string }) => {
      removeFriendById(data.friendId);
    };

    socket.on(FRIEND_REQUEST_EVENTS.REMOVED, handleRemoved);

    return () => {
      socket.off(FRIEND_REQUEST_EVENTS.REMOVED, handleRemoved);
    };
  }, [socket, removeFriendById]);
};
