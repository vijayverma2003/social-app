"use client";

import { Channel, ChannelWithUsers } from "@shared/types/responses";
import { create } from "zustand";

interface PostChannelsState {
  postChannels: Record<string, ChannelWithUsers>;
  addPostChannel: (channel: ChannelWithUsers) => void;
  removePostChannel: (channelId: string) => void;
}

export const usePostChannelsStore = create<PostChannelsState>((set) => ({
  postChannels: {},

  addPostChannel: (channel) =>
    set((state) => ({
      postChannels: {
        ...state.postChannels,
        [channel.id]: channel,
      },
    })),

  removePostChannel: (channelId) =>
    set((state) => {
      const { [channelId]: _, ...rest } = state.postChannels;
      return { postChannels: rest };
    }),
}));
