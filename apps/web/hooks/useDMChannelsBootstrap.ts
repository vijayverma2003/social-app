"use client";

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useDMChannelsStore } from "@/store/dmChannelsStore";
import { useDMActions } from "@/hooks/useDMActions";

export const useDMChannelsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { setChannels, setLoading, setError } = useDMChannelsStore();
  const { getDMChannelsList } = useDMActions();

  useEffect(() => {
    let cancelled = false;

    const loadDMChannels = async () => {
      if (!socket || !isConnected) return;

      try {
        setLoading(true);
        const response = await getDMChannelsList();

        if (cancelled) return;

        if (response.error || !response.success) {
          setError(response.error || "Failed to load DM channels");
          return;
        }

        if (response.data) {
          setChannels(response.data);
        }
      } catch (error) {
        console.error("Failed to load DM channels:", error);
        if (!cancelled) {
          setError("Failed to load DM channels");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDMChannels();

    return () => {
      cancelled = true;
    };
  }, [
    socket,
    isConnected,
    getDMChannelsList,
    setChannels,
    setLoading,
    setError,
  ]);
};
