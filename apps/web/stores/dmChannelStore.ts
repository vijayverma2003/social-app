"use client";

import { Channel, ChannelWithUsers } from "@shared/types/responses";
import { create } from "zustand";

interface DMChannelsState {
  // Channel ID -> Channel with users
  dmChannels: Record<string, ChannelWithUsers>;
  setDMChannels: (channels: ChannelWithUsers[]) => void;
  addDMChannel: (channel: ChannelWithUsers) => void;
  incrementUnreadCount: (channelId: string, excludeUserId: string) => void;
  resetUnreadCount: (channelId: string, userId: string) => void;
  removeDMChannel: (channelId: string) => void;
}

export const useDMChannelsStore = create<DMChannelsState>((set, get) => ({
  dmChannels: {},

  setDMChannels: (channels) => {
    const channelsMap: Record<string, ChannelWithUsers> = {};
    channels.forEach((channel) => {
      channelsMap[channel.id] = channel;
    });
    set({ dmChannels: channelsMap });
  },

  addDMChannel: (channel) =>
    set((state) => ({
      dmChannels: {
        ...state.dmChannels,
        [channel.id]: channel,
      },
    })),

  incrementUnreadCount: (channelId, excludeUserId) =>
    set((state) => {
      const channel = state.dmChannels[channelId];
      if (!channel) return state;

      const updatedUsers = channel.users.map((user) =>
        user.userId !== excludeUserId
          ? {
              ...user,
              totalUnreadMessages: (user.totalUnreadMessages || 0) + 1,
            }
          : user
      );

      return {
        dmChannels: {
          ...state.dmChannels,
          [channelId]: { ...channel, users: updatedUsers },
        },
      };
    }),

  resetUnreadCount: (channelId, userId) =>
    set((state) => {
      const channel = state.dmChannels[channelId];
      if (!channel) return state;

      const updatedUsers = channel.users.map((user) =>
        user.userId === userId
          ? {
              ...user,
              totalUnreadMessages: 0,
              lastReadAt: new Date(),
            }
          : user
      );

      return {
        dmChannels: {
          ...state.dmChannels,
          [channelId]: { ...channel, users: updatedUsers },
        },
      };
    }),

  removeDMChannel: (channelId) =>
    set((state) => {
      const { [channelId]: _, ...rest } = state.dmChannels;
      return {
        dmChannels: rest,
      };
    }),
}));
