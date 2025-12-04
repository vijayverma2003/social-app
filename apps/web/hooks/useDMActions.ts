"use client";

import { DM_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/SocketContext";
import { useCallback } from "react";

export const useDMActions = () => {
  const { emit } = useSocket();

  const getDMChannelsList = useCallback(
    () => emit(DM_EVENTS.GET_LIST, {}),
    [emit]
  );

  return {
    getDMChannelsList,
  };
};
