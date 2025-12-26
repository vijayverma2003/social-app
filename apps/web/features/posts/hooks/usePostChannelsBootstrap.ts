"use client";

import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback, useEffect, useRef } from "react";
import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { toast } from "sonner";

export const usePostChannelsBootstrap = () => {
  const { emit, socket, isConnected } = useSocket();
  const { setChannels } = useChannelsStore();
  const fetchedRef = useRef(false);

  const getPostChannels = useCallback(() => {
    if (!socket || !isConnected) return;
    console.log("Getting post channels...");
    console.time("getPostChannels");

    emit(CHANNEL_EVENTS.GET_POSTS_LIST, {}, (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      } else if (response.success && response.data) {
        // Merge post channels with existing channels
        const existingChannels = useChannelsStore.getState().channels;
        const postChannels = response.data ?? [];

        // Filter out channels that already exist
        const newChannels = postChannels.filter(
          (postChannel) =>
            !existingChannels.some((ch) => ch.id === postChannel.id)
        );

        // Add new post channels
        setChannels([...existingChannels, ...newChannels]);
      }
      console.timeEnd("getPostChannels");
    });
  }, [emit, socket, isConnected, setChannels]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    if (fetchedRef.current) return;
    getPostChannels();
    fetchedRef.current = true;
  }, [socket, isConnected]);

  return { getPostChannels };
};
