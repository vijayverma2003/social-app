"use client";

import { DM_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";

// Extract callback type from ClientToServerEvents
type GetDMChannelsListCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.GET_LIST]
>[1];

export const useDMActions = () => {
  const { emit } = useSocket();

  const getDMChannelsList = useCallback(
    (callback: GetDMChannelsListCallback) => {
      emit(DM_EVENTS.GET_LIST, {}, callback);
    },
    [emit]
  );

  return {
    getDMChannelsList,
  };
};
