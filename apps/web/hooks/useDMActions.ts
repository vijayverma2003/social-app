"use client";

import { DM_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/SocketContext";
import { useCallback } from "react";
import {
  DMChannelsListResponse,
  SocketResponse,
} from "@shared/types/responses";

export const useDMActions = () => {
  const { emit } = useSocket();

  const getDMChannelsList = useCallback(
    () =>
      emit(DM_EVENTS.GET_LIST, {}) as Promise<
        SocketResponse<DMChannelsListResponse>
      >,
    [emit]
  );

  return {
    getDMChannelsList,
  };
};
