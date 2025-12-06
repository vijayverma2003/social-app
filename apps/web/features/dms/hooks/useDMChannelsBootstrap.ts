"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketContextProvider";
import { useDMChannelActions } from "@/features/dms/hooks/useDMChannelActions";

export const useDMChannelsBootstrap = () => {
  const { socket, isConnected } = useSocket();
  const { getDMChannelsList } = useDMChannelActions();

  useEffect(() => {
    if (!socket || !isConnected) return;
    getDMChannelsList();
  }, [socket, isConnected, getDMChannelsList]);
};
