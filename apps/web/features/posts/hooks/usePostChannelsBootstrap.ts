"use client";

import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback, useEffect } from "react";
import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { toast } from "sonner";

export const usePostChannelsBootstrap = () => {
  const { emit, socket, isConnected } = useSocket();
  const { addChannel } = useChannelsStore();

  const getPostChannels = useCallback(() => {
    if (!socket || !isConnected) return;

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
        newChannels.forEach((channel) => addChannel(channel));
      }
    });
  }, [emit, socket, isConnected, addChannel]);

  useEffect(() => {
    if (socket && isConnected) {
      getPostChannels();
    }
  }, [socket, isConnected, getPostChannels]);

  return { getPostChannels };
};
