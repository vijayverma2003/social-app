import { MessageData } from "@shared/schemas/messages";
import { create } from "zustand";

interface MessagesState {
  // Channel ID -> Messages array
  messagesByChannel: Record<string, MessageData[]>;
  isLoading: boolean;
  error: string | null;
  setMessages: (channelId: string, messages: MessageData[]) => void;
  addMessage: (channelId: string, message: MessageData) => void;
  addOptimisticMessage: (
    channelId: string,
    message: MessageData & { _id: string; isOptimistic?: boolean }
  ) => string; // Returns the optimistic message ID
  replaceOptimisticMessage: (
    channelId: string,
    optimisticId: string,
    realMessage: MessageData
  ) => void;
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

  addOptimisticMessage: (channelId, message) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const optimisticMessage: MessageData = {
      ...message,
      _id: optimisticId,
    };

    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...existingMessages, optimisticMessage],
        },
      };
    });

    return optimisticId;
  },

  replaceOptimisticMessage: (channelId, optimisticId, realMessage) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      const messageIndex = messages.findIndex((m) => m._id === optimisticId);

      if (messageIndex === -1) {
        // Optimistic message not found, just add the real message
        return {
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: [...messages, realMessage],
          },
        };
      }

      // Replace optimistic message with real one
      const newMessages = [...messages];
      newMessages[messageIndex] = realMessage;

      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: newMessages,
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
