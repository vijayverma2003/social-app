import { Channel } from "@shared/types/responses";
import { create } from "zustand";

interface ChannelsState {
  channels: Channel[];
  isLoading: boolean;
  error: string | null;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  incrementUnreadCount: (channelId: string, excludeUserId: string) => void;
  resetUnreadCount: (channelId: string, userId: string) => void;
  removeChannel: (channelId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChannelsStore = create<ChannelsState>((set) => ({
  channels: [],
  isLoading: false,
  error: null,

  setChannels: (channels) =>
    set({
      channels: channels ?? [],
      isLoading: false,
      error: null,
    }),

  addChannel: (channel) =>
    set((state) => {
      if (state.channels.some((c) => c.id === channel.id)) return state;
      return { channels: [channel, ...state.channels] };
    }),

  updateChannel: (channelId, updates) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId ? { ...channel, ...updates } : channel
      ),
    })),

  incrementUnreadCount: (channelId) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId ? { ...channel } : channel
      ),
    })),

  resetUnreadCount: (channelId, userId) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId ? { ...channel } : channel
      ),
    })),

  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channelId),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
