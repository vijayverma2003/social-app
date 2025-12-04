"use client";

import { getFriends } from "@/features/friends/services/friends";
import { useFriendsStore } from "@/features/friends/store/friendsStore";
import { useSocket } from "@/providers/SocketContextProvider";
import { useAuth } from "@clerk/nextjs";
import { FRIEND_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useEffect } from "react";
import { toast } from "sonner";

export const useFriendsBootstrap = () => {
  const { socket } = useSocket();
  const { getToken } = useAuth();
  const { removeFriendById, setFriends, setLoading } = useFriendsStore();

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await getFriends(token || undefined);
      setFriends(response.data);
    } catch (error) {
      toast.error("Failed to fetch friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRemoved: ServerToClientEvents[typeof FRIEND_EVENTS.REMOVED] = (
      data
    ) => {
      removeFriendById(data.friendId);
    };

    socket.on(FRIEND_EVENTS.REMOVED, handleRemoved);

    return () => {
      socket.off(FRIEND_EVENTS.REMOVED, handleRemoved);
    };
  }, [socket, removeFriendById]);
};
