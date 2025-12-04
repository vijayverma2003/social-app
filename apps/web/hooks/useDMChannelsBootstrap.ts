"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketContextProvider";
import { useDMChannelsStore } from "@/store/dmChannelsStore";
import { useDMActions } from "@/hooks/useDMActions";

export const useDMChannelsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { setChannels, setLoading, setError } = useDMChannelsStore();
  const { getDMChannelsList } = useDMActions();

  useEffect(() => {
    if (!socket || !isConnected) return;

    setLoading(true);
    getDMChannelsList((response) => {
      if (response.error || !response.success) {
        setError(response.error || "Failed to load DM channels");
        setLoading(false);
        return;
      }

      if (response.data) {
        setChannels(response.data);
      }
      setLoading(false);
    });
  }, [
    socket,
    isConnected,
    getDMChannelsList,
    setChannels,
    setLoading,
    setError,
  ]);
};
