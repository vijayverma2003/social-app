"use client";

import { DM_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import { useDMChannelsStore } from "../store/dmChannelsStore";
import { toast } from "sonner";

type GetDMChannelsListCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.GET_LIST]
>[1];

type JoinDMChannelCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.JOIN]
>[1];

type LeaveDMChannelCallback = Parameters<
  ClientToServerEvents[typeof DM_EVENTS.LEAVE]
>[1];

export const useDMChannelActions = () => {
  const { emit } = useSocket();
  const { setChannels } = useDMChannelsStore();

  const getDMChannelsList = useCallback(() => {
    emit(DM_EVENTS.GET_LIST, {}, (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      } else if (response.success && response.data) {
        setChannels(response.data ?? []);
      }
    });
  }, [emit, setChannels]);

  const joinChannel = useCallback(
    (channelId: string) => {
      emit(DM_EVENTS.JOIN, { channelId }, (response) => {
        if (response.error) {
          toast.error(response.error);
          return;
        }
      });
    },
    [emit]
  );

  const leaveChannel = useCallback(
    (channelId: string) => {
      emit(DM_EVENTS.LEAVE, { channelId }, (response) => {
        if (response.error) {
          toast.error(response.error);
          return;
        }
      });
    },
    [emit]
  );

  return {
    getDMChannelsList,
    joinChannel,
    leaveChannel,
  };
};
