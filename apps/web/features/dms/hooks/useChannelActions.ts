"use client";

import { CHANNEL_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { useChannelsStore } from "../store/channelsStore";
import { toast } from "sonner";

export const useChannelActions = () => {
  const { emit } = useSocket();
  const { setChannels } = useChannelsStore();

  const getDMChannelsList = useCallback(() => {
    console.log("Getting DM channels list...");
    console.time("getDMChannelsList");
    emit(CHANNEL_EVENTS.GET_DMS_LIST, {}, (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      } else if (response.success && response.data) {
        const existingChannels = useChannelsStore.getState().channels;
        const newChannels = response.data.filter(
          (channel) => !existingChannels.some((ch) => ch.id === channel.id)
        );
        setChannels([...existingChannels, ...newChannels]);
      }
      console.timeEnd("getDMChannelsList");
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
