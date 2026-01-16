"use client";

import { getFriends } from "@/features/friends/services/friends";
import { useFriendsStore } from "@/features/friends/store/friendsStore";
import { useSocket } from "@/contexts/socket";
import { FRIEND_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { FriendsList } from "@shared/types/responses";

export const useFriendsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { removeFriendById, setFriends, setLoading } = useFriendsStore();

  useEffect(() => {
    if (!isConnected) return;

    const fetchFriends = async () => {
      const onComplete = (friends: FriendsList[]) => {
        setFriends(friends);
      };

      const onError = (error: string) => {
        toast.error("Failed to fetch friends", {
          description: error,
        });
      };

      try {
        setLoading(true);
        await getFriends({ onComplete, onError });
      } catch (error) {
        toast.error("Failed to fetch friends");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [isConnected]);

  useEffect(() => {
    if (!socket) return;

    function handleRemoved(
      data: Parameters<ServerToClientEvents[typeof FRIEND_EVENTS.REMOVED]>[0]
    ) {
      removeFriendById(data.friendId);
    }

    socket.on(FRIEND_EVENTS.REMOVED, handleRemoved);

    return () => {
      socket.off(FRIEND_EVENTS.REMOVED, handleRemoved);
    };
  }, [socket, removeFriendById]);
};
