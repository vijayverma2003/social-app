import { MessageData } from "@shared/schemas/messages";
import { create } from "zustand";

interface MessagesState {
  // Channel ID -> Messages array
  messagesByChannel: Record<string, MessageData[]>;
  isLoading: boolean;
  error: string | null;
  setMessages: (channelId: string, messages: MessageData[]) => void;
  addMessage: (channelId: string, message: MessageData) => void;
  prependMessages: (channelId: string, messages: MessageData[]) => void;
  updateMessage: (
    channelId: string,
    messageId: string,
    updates: Partial<MessageData>
  ) => void;
  removeMessage: (channelId: string, messageId: string) => void;
  clearChannel: (channelId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messagesByChannel: {},
  isLoading: false,
  error: null,

  setMessages: (channelId, messages) =>
    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: messages,
      },
      isLoading: false,
      error: null,
    })),

  addMessage: (channelId, message) =>
    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      // Check if message already exists (avoid duplicates)
      if (existingMessages.some((m) => m._id === message._id)) {
        return state;
      }
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...existingMessages, message],
        },
      };
    }),

  prependMessages: (channelId, messages) =>
    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      // Filter out duplicates
      const newMessageIds = new Set(messages.map((m) => m._id));
      const filteredExisting = existingMessages.filter(
        (m) => !newMessageIds.has(m._id)
      );
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...messages, ...filteredExisting],
        },
      };
    }),

  updateMessage: (channelId, messageId, updates) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages.map((message) =>
            message._id === messageId ? { ...message, ...updates } : message
          ),
        },
      };
    }),

  removeMessage: (channelId, messageId) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages.filter((message) => message._id !== messageId),
        },
      };
    }),

  clearChannel: (channelId) =>
    set((state) => {
      const { [channelId]: _, ...rest } = state.messagesByChannel;
      return {
        messagesByChannel: rest,
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
