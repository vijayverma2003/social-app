import { DMChannelWithUsers } from "@shared/types/responses";
import { create } from "zustand";

interface DMChannelsState {
  channels: DMChannelWithUsers[];
  isLoading: boolean;
  error: string | null;
  setChannels: (channels: DMChannelWithUsers[]) => void;
  addChannel: (channel: DMChannelWithUsers) => void;
  updateChannel: (
    channelId: string,
    updates: Partial<DMChannelWithUsers>
  ) => void;
  incrementUnreadCount: (channelId: string, excludeUserId: string) => void;
  resetUnreadCount: (channelId: string, userId: string) => void;
  removeChannel: (channelId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDMChannelsStore = create<DMChannelsState>((set) => ({
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

  incrementUnreadCount: (channelId, excludeUserId) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              users: channel.users.map((user) =>
                user.userId !== excludeUserId
                  ? {
                      ...user,
                      totalUnreadMessages: user.totalUnreadMessages + 1,
                    }
                  : user
              ),
            }
          : channel
      ),
    })),

  resetUnreadCount: (channelId, userId) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              users: channel.users.map((user) =>
                user.userId === userId
                  ? {
                      ...user,
                      totalUnreadMessages: 0,
                      lastReadAt: new Date(),
                    }
                  : user
              ),
            }
          : channel
      ),
    })),

  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channelId),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
