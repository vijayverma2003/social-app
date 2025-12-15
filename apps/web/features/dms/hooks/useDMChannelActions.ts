"use client";

import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback, useMemo } from "react";
import { useDMChannelsStore } from "../store/dmChannelsStore";
import { toast } from "sonner";

export const useDMChannelActions = () => {
  const { emit } = useSocket();
  const { setChannels } = useDMChannelsStore();

  const getDMChannelsList = useCallback(() => {
    emit(CHANNEL_EVENTS.GET_DMS_LIST, {}, (response) => {
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
      emit(CHANNEL_EVENTS.JOIN, { channelId }, (response) => {
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
      emit(CHANNEL_EVENTS.LEAVE, { channelId }, (response) => {
        if (response.error) {
          toast.error(response.error);
          return;
        }
      });
    },
    [emit]
  );

  const markAsRead = useCallback(
    (channelId: string) => {
      emit(CHANNEL_EVENTS.MARK_AS_READ, { channelId }, (response) => {
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
    markAsRead,
  };
};
