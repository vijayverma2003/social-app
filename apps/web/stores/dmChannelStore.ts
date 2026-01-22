"use client";

import { Channel, ChannelWithUsers } from "@shared/types/responses";
import { create } from "zustand";

interface DMChannelsState {
  // Channel ID -> Channel with users
  dmChannels: Record<string, ChannelWithUsers>;
  // Channel ID -> Last message timestamp (for sorting)
  lastMessageTimestamps: Record<string, number>;
  setDMChannels: (channels: ChannelWithUsers[]) => void;
  addDMChannel: (channel: ChannelWithUsers) => void;
  incrementUnreadCount: (channelId: string, excludeUserId: string) => void;
  resetUnreadCount: (channelId: string, userId: string) => void;
  removeDMChannel: (channelId: string) => void;
  updateLastMessageTimestamp: (channelId: string, timestamp: number) => void;
}

export const useDMChannelsStore = create<DMChannelsState>((set, get) => ({
  dmChannels: {},
  lastMessageTimestamps: {},

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
      const { [channelId]: __, ...restTimestamps } = state.lastMessageTimestamps;
      return {
        dmChannels: rest,
        lastMessageTimestamps: restTimestamps,
      };
    }),

  updateLastMessageTimestamp: (channelId, timestamp) =>
    set((state) => ({
      lastMessageTimestamps: {
        ...state.lastMessageTimestamps,
        [channelId]: timestamp,
      },
    })),
}));
